import mongoose from "mongoose";

const TableSchema = new mongoose.Schema({
  tableNumber: Number,
  seats: Number
})

const Table = mongoose.model("Table", TableSchema)

export default Table
