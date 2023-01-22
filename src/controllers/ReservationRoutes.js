import express from 'express'
import { verifyJwt, verifyCredentials, generateAdminJWT } from './AdminFunction.js' //recently uncommented.
import { 
  getUnavailableTables, 
  getAvailableTable,

} from './ReservationFunction.js'
import Reservation from '../db/models/ReservationModel.js'

const router = express.Router()

//GET ALL RESERVATIONS
router.get('/',verifyJwt, verifyCredentials, generateAdminJWT, async (req, res) => {
  const reservations = await Reservation.find().populate({path: 'table', select: ['tableNumber', 'seats']})
  res.send(reservations)
})

//POST
router.post('/', getUnavailableTables, getAvailableTable, async (req, res) => {
  const newBooking = await Reservation.create({
    table: req.availableTableId,
    guest: req.body
  })
  res.status(201).send(await newBooking.populate({path: 'table', select: ['tableNumber', 'seats']}))
})

//GET BY MOBILE


//UPDATE ONE BY ID


//DELETE ONE BY ID


export default router

