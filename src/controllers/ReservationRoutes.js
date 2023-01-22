import express from 'express'
import { verifyJwt, verifyCredentials, generateAdminJWT } from './AdminFunction.js' //recently uncommented.
import { 
  getUnavailableTables, 
  getAvailableTable,
  updateGuestForm
} from './ReservationFunction.js'
import Reservation from '../db/models/ReservationModel.js'

const router = express.Router()

//GET ALL RESERVATIONS
router.get('/', verifyJwt, verifyCredentials, generateAdminJWT, async (req, res) => {
  const reservations = await Reservation.find().populate({path: 'table', select: ['tableNumber', 'seats']})
  res.send(reservations)
})

//POST
router.post('/', getUnavailableTables, getAvailableTable, async (req, res) => {
  req.body.date = new Date(req.body.date)
  const newBooking = await Reservation.create({
    table: req.availableTableId,
    guest: req.body
  })
  console.log(typeof newBooking.guest.date)
  res.status(201).send(await newBooking.populate({path: 'table', select: ['tableNumber', 'seats']}))
})

//GET BY MOBILE
router.get('/:mobile', verifyJwt, verifyCredentials, generateAdminJWT, async (req, res) => {
  const reservations = await Reservation.find({'guest.mobile': req.params.mobile})
  .populate({path: 'table', select: ['tableNumber', 'seats']})

  res.send(reservations)
})

//UPDATE ONE BY ID
router.put('/:id', 
  verifyJwt, verifyCredentials, generateAdminJWT, updateGuestForm, 
  getUnavailableTables, getAvailableTable, 
  async (req, res) => {
    req.newGuestForm.date = new Date(req.newGuestForm.date)
    const updatedReservation = await Reservation.findByIdAndUpdate(req.params.id, 
      {
        table: req.availableTableId,
        guest: req.newGuestForm
      }, 
      {returnDocument: 'after'}).populate({path: 'table', select: ['tableNumber', 'seats']})
    res.send(updatedReservation)
  }
)

//DELETE ONE BY ID


export default router

