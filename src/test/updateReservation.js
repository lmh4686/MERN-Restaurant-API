import Reservation from "../db/models/ReservationModel"
import { numOfTwoSeaters, numOfFourSeaters, numOfSixSeaters } from "./tableAvailability.js"

export async function getUnavailableTables(date, guestNumber) {
  const dateFilteredReservation = await Reservation.find({
  'guest.date': {$lt: manipulateHours(date, 'plus', 1.5), 
                 $gt: manipulateHours(date, 'minus', 1.5)}
                }).populate('table')
  
  return dateFilteredReservation.find(reservation => reservation.table.seats === guestNumber || guestNumber + 1
    ).map(reservation => reservation.table)
 }

 export function isReallyFull(unavailableTables) {
  switch (unavailableTables.seats) {
    case 2:
      return unavailableTables.length === numOfTwoSeaters ? true : false
    case 4:
      return unavailableTables.length === numOfFourSeaters ? true : false
    case 6:
      return unavailableTables.length === numOfSixSeaters ? true : false
    default:
      throw new Error("Error in unavailableTables.seats")
  }
 }