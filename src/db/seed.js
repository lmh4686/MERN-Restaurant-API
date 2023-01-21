import mongoose from "mongoose";
import { dbConnect, dbClose } from "./db.js";
import Admin from "./models/AdminModel.js";
import Table from "./models/TableModel.js";
import Reservation from "./models/ReservationModel.js";
import { encryptString, hashString } from '../controllers/AdminFunction.js'

await dbConnect()

await Admin.deleteMany()
console.log('Admin deleted')
await Table.deleteMany()
console.log('Table deleted')
await Reservation.deleteMany()
console.log('Table deleted')

const tables = []

function pushTable(seats, amount) {
  for (let i = 0; i < amount; i++) {
    tables.push({ tableNumber: tables.length+1, seats: seats })
  }
}

pushTable(2, 6)
pushTable(4, 8)
pushTable(6, 4)

await Table.insertMany(tables)
console.log('Table seeded')

await Admin.create({
  username: encryptString(await hashString(process.env.ADMIN_USERNAME)),
  password: encryptString(await hashString(process.env.ADMIN_PW))
}).then(console.log('Admin seeded'))

const sixSeaters = await Table.find({seats: 6})

const reservations = [
  {table: sixSeaters[0], guest: {
    "firstName" : "Simba",
    "lastName" : "Kim",
    "mobile": "156165126",
    "date": new Date("2023-01-30T18:00Z"),
    "guestNumber": 5
}},
  {table: sixSeaters[1], guest: {
  "firstName" : "Rexy",
  "lastName" : "Rob",
  "mobile": "3564815",
  "date": new Date("2023-01-30T18:00Z"),
  "guestNumber": 5
}},
  {table: sixSeaters[2], guest: {
  "firstName" : "Rexy",
  "lastName" : "Rob",
  "mobile": "3564815",
  "date": new Date("2023-01-30T20:00Z"),
  "guestNumber": 5
}}
]

await Reservation.insertMany(reservations)
console.log('reservations seeded')


dbClose()