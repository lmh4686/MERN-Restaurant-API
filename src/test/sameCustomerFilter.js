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
  //New booking on date that has no reservation
  {
    expectedStatus: 201,
    guest: mockCustomer
  },
  //Same customer book again with new date value that has less than 4hr difference from the previous one.
  //plus 3hr
  {
    expectedStatus: 409,
    guest: manipulateCustomerDate({...mockCustomer},'plus', 3)
  },
  //Same customer book again with new date value that has less than 4hr difference from the previous one.
  //minus 3hr
  {
    expectedStatus: 409,
    guest: manipulateCustomerDate({...mockCustomer},'minus', 3)
  },
  //Same customer book again with new date value that has more than 4hr difference from the previous one
  //plus 5hr
  {
    expectedStatus: 201,
    guest: manipulateCustomerDate({...mockCustomer},'plus', 5)
  },
  //Same customer book again with new date value that has more than 4hr difference from the previous one
  //minus 5hr
  {
    expectedStatus: 201,
    guest: manipulateCustomerDate({...mockCustomer},'minus', 5)
  }
]

export default sameCustomerFilterTestCases