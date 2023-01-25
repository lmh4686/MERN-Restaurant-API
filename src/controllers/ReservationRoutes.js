import express from 'express'
import { verifyJwt, generateAdminJWT } from './AdminFunction.js' //recently uncommented.
import { 
  getUnavailableTables, 
  getAvailableTable,
  updateGuestForm
} from './ReservationFunction.js'
import Reservation from '../db/models/ReservationModel.js'

const router = express.Router()
const notFoundMsg = {error: 'No reservation found'}
const populateOption = {path: 'table', select: ['tableNumber', 'seats']}

//GET ALL RESERVATIONS
router.get('/', verifyJwt, generateAdminJWT, async (req, res) => {
  const reservations = await Reservation.find().populate(populateOption)
  reservations.sort((a, b) => a.guest.date - b.guest.date)

  reservations.length ? res.json({jwt: req.jwt, reservations}) : res.status(404).json(notFoundMsg)
})

//POST
router.post('/', getUnavailableTables, getAvailableTable, async (req, res) => {
  req.body.date = new Date(req.body.date)
  console.log(typeof req.body.date)
  const newBooking = await Reservation.create({
    table: req.availableTableId,
    guest: req.body
  })

  res.status(201).json(await newBooking.populate(populateOption))
})

//GET BY MOBILE
router.get('/:mobile', verifyJwt, generateAdminJWT, async (req, res) => {
  const reservations = await Reservation.find({'guest.mobile': req.params.mobile})
  .populate(populateOption)

  reservations.length ? res.json({jwt: req.jwt, reservations}) 
  : res.status(404).json(notFoundMsg)
})

//UPDATE ONE BY ID
router.put('/:id', 
  verifyJwt, generateAdminJWT, updateGuestForm, 
  getUnavailableTables, getAvailableTable, 
  async (req, res) => {
    req.updatedGuestForm.date = new Date(req.updatedGuestForm.date)
    try {
      const updatedReservation = await Reservation.findByIdAndUpdate(
        req.params.id, 
        { table: req.availableTableId, guest: req.updatedGuestForm, isConfirmed: Boolean(req.updatedGuestForm.isConfirmed)}, 
        {returnDocument: 'after'}
        ).populate(populateOption)

      updatedReservation ? res.json({jwt: req.jwt, updatedReservation})
      : res.status(404).json(notFoundMsg)

    }catch (e) {
      res.status(400).json({error: 'Wrong ID format provided'})
    }
  }
)

//DELETE ONE BY ID
router.delete('/:id', verifyJwt, generateAdminJWT, async (req, res) => {
  try{
   const deletedReservation = await Reservation.findByIdAndDelete(req.params.id, {returnDocument: 'after'})
   .populate(populateOption)

   deletedReservation ? res.json({jwt: req.jwt, deletedReservation}) : res.status(404).json({error: "No reservation found"})

  }catch (e) {
    res.status(400).json({error: 'Wrong ID format provided'})
  }
})

export default router

