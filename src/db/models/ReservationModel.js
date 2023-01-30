import mongoose from "mongoose";

const GuestSchema = mongoose.Schema({
  firstName : { type: String, required: true },
  lastName : { type: String, required: true },
  mobile: { type: String, required: true },
  date: { type: Date, required: true },
  guestNumber: { type: Number, required: true }
})

const ReservationSchema = mongoose.Schema({
  table: { type: mongoose.Types.ObjectId, ref: "Table", required: true },
  guest: GuestSchema,
  isConfirmed: { type: Boolean, default: false }
})

const Reservation = mongoose.model("Reservation", ReservationSchema)

export default Reservation