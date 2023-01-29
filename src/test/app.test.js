import dotenv from 'dotenv'
dotenv.config()
import request from 'supertest'
import app from '../index.js'
import sameCustomerFilterTestCases from './sameCustomerFilter.js'
import { numOfSixSeaters, numOfFourSeaters, numOfTwoSeaters, getNewCustomer } from './tableAvailability.js'
import { getUnavailableTables, isReallyFull } from './updateReservation.js'

//  PLEASE RUN FOLLOWING CODE EACH TIME AFTER RUN TEST SCRIPT
//  node ./src/db/seed.js


//Test for correctly accept, refuse booking depending on the table availability
function tableAvailabilityTest(NumOfTable, requiredSeats) {
  for (let i = 0; i < NumOfTable + 1; i++) {
    const customer = getNewCustomer(requiredSeats)
    test(`${requiredSeats} seaters table availability test at remained table of ${NumOfTable - (i)}. 
    => ${i+1 > NumOfTable ? 'Return error' : 'Post reservation'}`, 
    async () => {
      const res = await request(app).post('/reservation').send(customer)

      if (i != NumOfTable) {
        expect(res.status).toBe(201)
        expect(new Date(res.body.guest.date).toLocaleString()).toEqual(new Date(customer.date).toLocaleString())
        delete res.body.guest._id
        delete res.body.guest.date
        delete customer.date
        expect(res.body.guest).toEqual(customer)
      }else {
        //Make sure this only happens when table is fully booked. i+1 = number of table booked.
        expect(i+1 > NumOfTable).toBe(true)
        expect(res.status).toBe(406)
        expect(res.body.error).toBe('No available table found')
        expect(Object.keys(res.body).length).toEqual(1)
      }
    })
  }
}


describe('POST Reservation',() => {
  // Test for correctly accept, refuse booking when the same customer book again on the same date different time.
  for (let testCase of sameCustomerFilterTestCases) {
    test(testCase.condition, async () => {
      const res = await request(app).post('/reservation').send(testCase.guest)
      expect(res.statusCode).toBe(testCase.expectedStatus)

      if (testCase.expectedStatus === 201 ) {
        expect(res.statusCode).toBe(201)
        expect(new Date(res.body.guest.date).toLocaleString()).toEqual(new Date(testCase.guest.date).toLocaleString())
        delete res.body.guest._id
        delete res.body.guest.date
        delete testCase.guest.date
        expect(res.body.guest).toEqual(testCase.guest)
      }else {
        expect(res.statusCode).toBe(409)
        expect(res.body.error).toBe('Same guest found!')
        expect(Object.keys(res.body).length).toEqual(1)
      }
    })
  }
  tableAvailabilityTest(numOfSixSeaters, 6)
  tableAvailabilityTest(numOfFourSeaters, 4)
  tableAvailabilityTest(numOfTwoSeaters, 2)

  // Test for table gets assigned properly corresponding to the number of guests
  for (let i = 1; i < 7; i++) {
    const customer = getNewCustomer(i, true)
    test(`${i} people gets assigned table accordingly`, async () => {
      const res = await request(app).post('/reservation').send(customer)

      if (i < 3) {
        expect(res.body.table.seats).toBe(2)
      }else if (i > 2 && i < 5) {
        expect(res.body.table.seats).toBe(4)
      }else {
        expect(res.body.table.seats).toBe(6)
      }
    })
  }
  }
)


function adminLoginTest(condition, result, id, pw, jwt) {
  test(`Login with ${condition}
  => ${result}`, async() => {
    const encodedCredential = Buffer.from(`${id}:${pw}`).toString('base64')
    const res = await request(app).post('/admin/login').set('Authorization', `Basic ${encodedCredential}`)
    if (condition === 'correct ID & PW') {
      expect(res.statusCode).toBe(200)
      expect(res.body.jwt).toBeDefined()
      jwt.value = res.body.jwt
    }else {
      expect(res.statusCode).toBe(401)
      expect(res.body.error).toBe("Wrong username or password provided")
      expect(Object.keys(res.body).length).toBe(1)
    }
  })
}

function getAllReservationsTest(condition, result, jwt, sampleModel) {
  test(`Get All Reservations after passing ${condition}
  => ${result}`, async () => {
    const res = await request(app).get('/reservation').set({jwt: jwt.value})

    if (condition === 'correct jwt') {
      expect(res.statusCode).toBe(200)
      expect(res.body.reservations).toBeDefined()
      expect(res.body.jwt).toBeDefined()
      sampleModel.reservation = res.body.reservations[0]
    }else {
      expect(res.statusCode).toBe(401)
      expect(res.error).toBeDefined()
      expect(Object.keys(res.body).length).toBe(1)
    }
  })
}

function updateReservationTest(condition, result, jwt, originalModel, fieldsToUpdate) {
  test(`Update reservation by ${condition}
  => ${result}`, async () => {
    const originalModelGuestInfo = originalModel.reservation.guest

    const updatedGuestForm = {}
    Object.keys(originalModelGuestInfo).map(key => updatedGuestForm[key] = fieldsToUpdate[key] || originalModelGuestInfo[key])

    const res = jwt ? await request(app).put(`/reservation/${originalModel.reservation._id}`).set({jwt: jwt.value}).send(updatedGuestForm)
                    : await request(app).put(`/reservation/${originalModel.reservation._id}`).send(updatedGuestForm)

    if (condition === "passing incorrect _ID") {
      expect(res.statusCode).toBe(400)
      expect(res.body.error).toBeDefined()
      expect(Object.keys(res.body).length).toBe(1)
      return
    }

    if(!jwt || condition === "passing wrong JWT") {
      expect(res.status).toBe(401)
      expect(res.body.error).toBeDefined()
      expect(Object.keys(res.body).length).toBe(1)
      return
    }

    if (res.body.error === 'No available table found') {
      expect(condition).toBe("changing date to the time when reservation is full")
      expect(res.statusCode).toBe(406)
      const unavailableTables = await getUnavailableTables(new Date(updatedGuestForm.date), updatedGuestForm.guestNumber)
      expect(isReallyFull(unavailableTables)).toBe(true)
      expect(Object.keys(res.body).length).toBe(1)
      return
    }

    expect(res.statusCode).toBe(200)
    const responseReservation = res.body.updatedReservation

    if (fieldsToUpdate?.date || fieldsToUpdate?.guestNumber) {
    //Check if table is assigned properly corresponding to guest number
    expect(updatedGuestForm.guestNumber <= responseReservation.table.seats &&
            updatedGuestForm.guestNumber+1 >= responseReservation.table.seats).toBe(true)
    }else {
      //Check if table is not changed
      expect(responseReservation.table).toEqual(originalModel.reservation.table)
    }

    expect(res.body.jwt).toBeDefined()
    expect(responseReservation._id).toBe(originalModel.reservation._id)

    expect(new Date(responseReservation.guest.date).toLocaleString()).toBe(new Date(updatedGuestForm.date).toLocaleString())
    delete responseReservation.guest.date
    delete updatedGuestForm.date
    expect(responseReservation.guest).toEqual(updatedGuestForm)
  })
}

function deleteReservationTest(condition, result, jwt, sampleModel) {
  test(`Delete a reservation when ${condition}
  => ${result}`, async () => {
    const res = jwt ? await request(app).delete(`/reservation/${sampleModel.reservation._id}`).set({jwt: jwt.value})
                    : await request(app).delete(`/reservation/${sampleModel.reservation._id}`).send()

    if(!jwt || condition === "passing wrong JWT") {
      expect(res.status).toBe(401)
      expect(res.body.error).toBeDefined()
      expect(Object.keys(res.body).length).toBe(1)
      return
    }

    if (condition === "passing incorrect _ID") {
      expect(res.statusCode).toBe(400)
      expect(res.body.error).toBeDefined()
      expect(Object.keys(res.body).length).toBe(1)
      return
    }

    expect(condition === "passing correct JWT and ID")
    expect(res.status).toBe(200)
    expect(res.body.jwt).toBeDefined()
    expect(res.body.deletedReservation._id).toEqual(sampleModel.reservation._id)
  })
}

describe ('Admin Functions', () => {
  const jwt = {value: ''}
  adminLoginTest('correct ID & PW', 'Return JWT', process.env.ADMIN_USERNAME, process.env.ADMIN_PW, jwt)
  adminLoginTest('Incorrect ID Correct PW', 'Return error', 'aa', process.env.ADMIN_PW)
  adminLoginTest('Correct ID Incorrect PW', 'Return error', process.env.ADMIN_USERNAME, 'ff')
  adminLoginTest('Incorrect ID and PW', 'Return error', 'aa', 'ff')

  const sampleModel = {reservation: ''}
  getAllReservationsTest('correct jwt', 'Get all reservations',jwt, sampleModel)
  getAllReservationsTest('wrong jwt', 'Return error', {value: 'ff'}, sampleModel)

  updateReservationTest(
    "passing incorrect _ID", 'Return error',
    jwt, {reservation: {_id: 5, guest: {a: 1, b: 2}}},
    {guestNumber: 2}
  )
  updateReservationTest(
    "changing guestNumber", 'Update reservation by find available table and assigning a new table that can accommodate the number of guests',
    jwt, sampleModel,
    {guestNumber: 2}
  )
  updateReservationTest(
    "changing firstName, lastName, mobile, isConfirmed", 'Update reservation without searching available table',
    jwt, sampleModel,
    {firstName: 'Change', lastName: "Change", mobile: '0123456789', isConfirmed: true}
  )
  updateReservationTest(
    "changing date to the time when reservation is full", 'Return error after searching available table on given date',
    jwt, sampleModel,  
    {date: getNewCustomer(2, true).date})
  updateReservationTest(
    "changing date to the time when reservation is not full", 'Update reservation after searching available table on given date',
    jwt, sampleModel,  
    {date: "2023-03-01T13:00"})
  updateReservationTest(
    "passing no JWT", 'Return error',
    null, sampleModel,  
    {})
  updateReservationTest(
    "passing wrong JWT", 'Return error',
    {value: 'ff'}, sampleModel,  
    {})

  deleteReservationTest('passing no JWT', 'Return error', null, sampleModel)
  deleteReservationTest('passing incorrect _ID', 'Return error', jwt, {reservation: {_id:5}})
  deleteReservationTest('passing correct JWT and ID', 'delete the model', jwt, sampleModel)
})
