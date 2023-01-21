import mongoose from "mongoose";

const GuestSchema = mongoose.Schema({
  firstName : String,
  lastName : String,
  mobile: String,
  date: Date,
  guestNumber: Number
})

const ReservationSchema = mongoose.Schema({
  table: { type: mongoose.Types.ObjectId, ref: "Table" },
  guest: GuestSchema
})

const Reservation = mongoose.model("Reservation", ReservationSchema)

export default Reservation