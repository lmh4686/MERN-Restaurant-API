import * as dotenv from 'dotenv'
dotenv.config()
import mongoose from "mongoose";

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

export { dbConnect, dbClose }