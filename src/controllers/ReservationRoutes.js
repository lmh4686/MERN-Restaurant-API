import express from 'express'
import { verifyJwt } from './AdminFunction.js'
import { getUnavailableTable } from './ReservationFunction.js'


const router = express.Router()

//GET ALL RESERVATIONS
router.get('/', async (req, res) => {

})

//POST
router.post('/', async (req, res) => {
  getUnavailableTable(req, res)
})

//GET BY MOBILE


//UPDATE ONE BY ID


//DELETE ONE BY ID


export default router

