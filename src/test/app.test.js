import dotenv from 'dotenv'
dotenv.config()
import request from 'supertest'
import app from '../index.js'
import sameCustomerFilterTestCases from './sameCustomerFilter.js'
import { numOfSixSeaters, numOfFourSeaters, numOfTwoSeaters, getNewCustomer } from './tableAvailability.js'

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
        expect(res.body.error).toBeDefined()
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
        expect(res.body.guest).toBeDefined()
        expect(res.body.guest.firstName).toBe(testCase.guest.firstName)
      }else {
        expect(res.body.error).toBeDefined()
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
        expect(res.body.table).toBeDefined()
        expect(res.body.table.seats).toBe(2)
      }else if (i > 2 && i < 5) {
        expect(res.body.table).toBeDefined()
        expect(res.body.table.seats).toBe(4)
      }else {
        expect(res.body.table).toBeDefined()
        expect(res.body.table.seats).toBe(6)
      }
    })
  }
  }
)
