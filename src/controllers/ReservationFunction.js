import Reservation from "../db/models/ReservationModel.js";
import Table from '../db/models/TableModel.js'

function manipulateMinutes(date, operator, minutes) {
  switch (operator) {
    case 'plus':
      return new Date(date.getTime() + minutes*60000)
    case 'minus':
      return new Date(date.getTime() - minutes*60000)   
    default:
      return new Error(`Given operator ${operator} is invalid operator`)
  }
}

function findDuplicateReservation(bookingInfo, reservations) {
  return reservations.find(reservation => reservation.guest.mobile === bookingInfo.mobile)
}

export async function getUnavailableTables(req, res, next) {
  const bookingInfo = req.body
  const dateFilteredReservations = await Reservation.find({
    'guest.date': {$lt: manipulateMinutes(new Date(bookingInfo.date), 'plus', 90), 
                   $gt: manipulateMinutes(new Date(bookingInfo.date), 'minus', 90)}
                  }).populate('table')
  
  if (dateFilteredReservations.length) {
    const duplicateReservation = findDuplicateReservation(bookingInfo, dateFilteredReservations)
    if (duplicateReservation) {
      res.status(409).json({msg: `Same guest found!`})
    }
    else {
      const unavailableTables = dateFilteredReservations.filter(
      reservation => reservation.table.seats === bookingInfo.guestNumber || bookingInfo.guestNumber +1 
        ).map(reservation => reservation.table)      
      req.unavailableTables = unavailableTables
      next()
    } 
  }
}

export async function getAvailableTable(req, res, next) {
  const seatFilteredTables = await Table.find({seats: req.unavailableTables[0].seats})

  const availableTable = seatFilteredTables.find(table => 
    !req.unavailableTables.map(unavailableTable => unavailableTable.tableNumber).includes(table.tableNumber))
  
  if (!availableTable) {
    res.status(406).json({msg: 'No available table found'})
  }else {
  req.tableId = availableTable._id
  next()
  }
}

