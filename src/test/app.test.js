import dotenv from 'dotenv'
dotenv.config()
import request from 'supertest'
import app from '../index.js'
import sameCustomerFilterTestCases from './sameCustomerFilter.js'
import { numOfSixSeaters, numOfFourSeaters, numOfTwoSeaters, getNewCustomer } from './tableAvailability.js'
import resetDB from '../db/seed.js'

//  PLEASE RUN FOLLOWING CODE EACH TIME AFTER RUN TEST SCRIPT
//  node ./src/db/seed.js


//Test for correctly accept, refuse booking depending on the table availability
function tableAvailabilityTest(NumOfTable, requiredSeats) {
  for (let i = 0; i < NumOfTable + 1; i++) {
    const customer = getNewCustomer(requiredSeats)
    test(`${requiredSeats} seaters table availability`, async () => {
      const res = await request(app).post('/reservation').send(customer)

      if (i != NumOfTable) {
        expect(res.status).toBe(201)
      }else {
        expect(res.status).toBe(406)
        expect(res.body.error).toBe('No available table found')
      }
    })
  }
}


describe('POST Reservation',() => {
  // Test for correctly accept, refuse booking when the same customer book again on the same date different time.
  for (let testCase of sameCustomerFilterTestCases) {
    test('Same customer filter', async () => {
      const res = await request(app).post('/reservation').send(testCase.guest)
      expect(res.status).toBe(testCase.expectedStatus)

      if (testCase.expectedStatus === 201 ) {
        expect(res.body.guest.firstName).toBe(testCase.guest.firstName)
      }else {
        expect(res.body.error).toBe('Same guest found!')
      }
    })
  }
  tableAvailabilityTest(numOfSixSeaters, 6)
  tableAvailabilityTest(numOfFourSeaters, 4)
  tableAvailabilityTest(numOfTwoSeaters, 2)

  // Test for table gets assigned properly depending on the number of guests
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


function adminLoginTest(condition, id, pw, jwt) {
  test(`Login with ${condition}`, async() => {
    const encodedCredential = Buffer.from(`${id}:${pw}`).toString('base64')
    const res = await request(app).post('/admin/login').set('Authorization', `Basic ${encodedCredential}`)
    if (condition === 'correct ID & PW') {
      expect(res.statusCode).toBe(200)
      expect(res.body.jwt).toBeDefined()
      jwt.value = res.body.jwt
    }else {
      expect(res.statusCode).toBe(401)
      expect(res.body.error).toBe("Wrong username or password provided")
    }
  })
}

function getAllReservationsTest(condition, jwt, sampleModel) {
  test(`Get All Reservations after passing ${condition}`, async () => {
    const res = await request(app).get('/reservation').set({jwt: jwt.value})

    if (condition === 'correct jwt') {
      expect(res.statusCode).toBe(200)
      expect(res.body.reservations).toBeDefined()
      expect(res.body.jwt).toBeDefined()
      sampleModel.model = res.body.reservations[0]
    }else {
      expect(res.statusCode).toBe(401)
      expect(res.error).toBeDefined()
    }
  })
}

function updateReservationTest(condition, model, jwt, body) {
  test(`Update reservation with ${condition}`, async () => {
    const newBookingInfo = getNewCustomer()
    const res = await request(app).put(`/reservation/${model._id}`).set({jwt: jwt.value}).send(body)
    const updatedGuestInfo = res.body.updatedReservation.guest
    if (condition === "new firstName") {
      expect(updatedGuestInfo.firstName).toBe(model.guest.firstName)
    }
  })
}

describe ('Admin Functions', () => {
  const jwt = {value: ''}
  adminLoginTest('correct ID & PW', process.env.ADMIN_USERNAME, process.env.ADMIN_PW, jwt)
  adminLoginTest('Incorrect ID Correct PW', 'aa', process.env.ADMIN_PW, jwt)
  adminLoginTest('Correct ID Incorrect PW', process.env.ADMIN_USERNAME, 'ff')
  adminLoginTest('Incorrect ID and PW', 'aa', 'ff')

  const sampleModel = {model: ''}
  getAllReservationsTest('correct jwt', jwt, sampleModel)
  getAllReservationsTest('wrong jwt', {value: 'ff'}, sampleModel)

  updateReservationTest("new firstname", sampleModel, jwt, {...sampleModel.map(key => key?.guest.firstName = 'Bob')})
})
