import mongoose from "mongoose";

const TableSchema = new mongoose.Schema({
  tableNumber: { type: Number, required: true },
  seats: { type: Number, required: true }
})

const Table = mongoose.model("Table", TableSchema)

export default Table
