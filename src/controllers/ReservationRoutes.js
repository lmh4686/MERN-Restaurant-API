import express from 'express'
import { verifyJwt } from './AdminFunction.js'
import { 
  getUnavailableTables, 
  getAvailableTable,

} from './ReservationFunction.js'
import Reservation from '../db/models/ReservationModel.js'

const router = express.Router()

//GET ALL RESERVATIONS
router.get('/', async (req, res) => {

})

//POST
router.post('/', getUnavailableTables, getAvailableTable, async (req, res) => {
  const newBooking = await Reservation.create({
    table: req.tableId,
    guest: req.body
  })
  res.status(201).json(newBooking)
})

//GET BY MOBILE


//UPDATE ONE BY ID


//DELETE ONE BY ID


export default router

