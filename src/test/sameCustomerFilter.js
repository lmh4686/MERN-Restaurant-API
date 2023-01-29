import { manipulateHours } from '../controllers/ReservationFunction.js'


const mockCustomer = {
  "firstName" : "Jihyuk",
  "lastName" : "Lee",
  "mobile": "123456789",
  "date": "2023-02-10T18:00",
  "guestNumber": 6
}


function manipulateCustomerDate(customer, operator, hr) {
  //Reset date to be initial value for the next test
  customer.date = new Date("2023-02-10T18:00")
  // plus or minus hr from original data value
  customer.date = manipulateHours(customer.date, operator, hr)
  // return customer with manipulated date value
  return {...customer}
}


const sameCustomerFilterTestCases = [
  {
    condition: `New booking on date that has no reservation
    => Post reservation`,
    expectedStatus: 201,
    guest: mockCustomer
  },
  {
    condition: `Same customer book again with new date value that has less than 4hr difference from the previous one. +3hr
    => Return error`,
    expectedStatus: 409,
    guest: manipulateCustomerDate({...mockCustomer},'plus', 3)
  },
  {
    condition: `Same customer book again with new date value that has less than 4hr difference from the previous one. -3hr
    => Return error`,
    expectedStatus: 409,
    guest: manipulateCustomerDate({...mockCustomer},'minus', 3)
  },
  {
    condition: `Same customer book again with new date value that has more than 4hr difference from the previous one +5hr
    => Post reservation`,
    expectedStatus: 201,
    guest: manipulateCustomerDate({...mockCustomer},'plus', 5)
  },
  {
    condition: `Same customer book again with new date value that has more than 4hr difference from the previous one -5hr
    => Post reservation`,
    expectedStatus: 201,
    guest: manipulateCustomerDate({...mockCustomer},'minus', 5)
  }
]

export default sameCustomerFilterTestCases