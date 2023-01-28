import Table from '../db/models/TableModel.js'


const mockCustomer = {
  "firstName" : "Jihyuk",
  "lastName" : "Lee",
  "mobile": "123456789",
  "date": "2023-03-10T18:00",
  "guestNumber": 6
}

const allTables = await Table.find()
export const numOfTwoSeaters = allTables.filter(tbl => tbl.seats === 2).length
export const numOfFourSeaters = allTables.filter(tbl => tbl.seats === 4).length
export const numOfSixSeaters = allTables.filter(tbl => tbl.seats === 6).length

export function getNewCustomer(guestNumber, tableAssignmentTest=false) {
  const customer = {...mockCustomer};
  customer.mobile = String(Math.floor(Math.random() * 10000000000))
  customer.guestNumber = guestNumber
  
  if (tableAssignmentTest) {
   customer.date = "2023-03-07T12:00"
  }
  
  return customer
}
