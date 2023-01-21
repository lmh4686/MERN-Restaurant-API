import Reservation from "../db/models/ReservationModel.js";
import { tableModel } from "../index.js";

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

export async function getUnavailableTable(req, res, next) {
  const bookingInfo = req.body
  const dateFilteredReservations = await Reservation.find({
    'guest.date': {$lt: manipulateMinutes(new Date(bookingInfo.date), 'plus', 90), 
                   $gt: manipulateMinutes(new Date(bookingInfo.date), 'minus', 90)}
                  }).populate('table')
  
  const unavailableTables = dateFilteredReservations.filter(reservation => reservation.table.seats === bookingInfo.guestNumber || bookingInfo.guestNumber +1 )
  next(unavailableTables)
}

export function getAvailableTable(req, res, next) {
  
}