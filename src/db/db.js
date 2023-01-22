// import dotenv from 'dotenv'
// dotenv.config()
import dotenv from 'dotenv'
dotenv.config({path: '../../.env'})
import mongoose from "mongoose";

console.log('DB\n' + process.env.DATABASE_URL)
mongoose.set('strictQuery', true)

async function dbConnect() {
  try{
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('DB connected')
  }catch(e) {
    console.log(e)
  }
}

async function dbClose() {
  await mongoose.connection.close();
  console.log('DB disconnected')
}

export { dbConnect, dbClose };