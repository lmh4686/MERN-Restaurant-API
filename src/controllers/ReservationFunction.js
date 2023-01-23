import Reservation from '../db/models/ReservationModel.js';
import Table from '../db/models/TableModel.js';

//delete export on submit
export function manipulateHours(date, operator, hours) {
  switch (operator) {
    case 'plus':
      return new Date(date.getTime() + 60 * 60000 * hours);
    case 'minus':
      return new Date(date.getTime() - 60 * 60000 * hours);
    default:
      return new Error(`Given operator ${operator} is invalid operator`);
  }
}

function findDuplicateReservation(bookingInfo, reservations) {
  return reservations.find(
    (reservation) => reservation.guest.mobile === bookingInfo.mobile
  );
}

export async function getUnavailableTables(req, res, next) {
  if (req.skipMiddleware) return next();


  const bookingInfo = req?.updatedGuestForm || req.body
  bookingInfo.date = new Date(bookingInfo.date)
  bookingInfo.guestNumber = Number(bookingInfo.guestNumber)

  const dateFilteredReservations = await Reservation.find({
    'guest.date': {$lt: manipulateHours(bookingInfo.date, 'plus', 5), 
                   $gt: manipulateHours(bookingInfo.date, 'minus', 5)}
                  }).populate('table')

  if (dateFilteredReservations.length) {
    const duplicateReservation = req?.updatedGuestForm ? null : findDuplicateReservation(bookingInfo, dateFilteredReservations)

    if (duplicateReservation) {
      res.status(409).json({ error: `Same guest found!` });
    } else {
      const unavailableTables = dateFilteredReservations
        .filter(
          (reservation) =>
            reservation.guest.date <
              manipulateHours(new Date(bookingInfo.date), 'plus', 1.5) &&
            reservation.guest.date >
              manipulateHours(new Date(bookingInfo.date), 'minus', 1.5)
        )
        .filter(
          (reservation) =>
            reservation.table.seats == Number(bookingInfo.guestNumber) ||
            reservation.table.seats == Number(bookingInfo.guestNumber) + 1
        )
        .map((reservation) => reservation.table);
      req.unavailableTables = unavailableTables;
      next();
    }
    else {
      const unavailableTables = dateFilteredReservations.filter(reservation => 
        reservation.guest.date < manipulateHours(bookingInfo.date, 'plus', 1.5) &&
        reservation.guest.date > manipulateHours(bookingInfo.date, 'minus', 1.5) 
        ).filter(reservation => 
          reservation.table.seats === bookingInfo.guestNumber || 
          reservation.table.seats === bookingInfo.guestNumber + 1
          ).map(reservation => reservation.table)
      req.unavailableTables = unavailableTables
      next()
    } 
  }else{
    next()
  }
}

export async function getAvailableTable(req, res, next) {
  if (req.skipMiddleware) return next()

  if (!req?.unavailableTables || !req.unavailableTables.length) {
    const allTables = await Table.find();
    req.availableTableId = allTables.find(
      (table) =>
        table.seats === Number(req.body.guestNumber) ||
        table.seats === Number(req.body.guestNumber + 1)
    )._id;
    next();
  } else {
    const seatFilteredTables = await Table.find({
      seats: req.unavailableTables[0].seats,
    });
    const availableTable = seatFilteredTables.find(
      (table) =>
        !req.unavailableTables
          .map((unavailableTable) => unavailableTable.tableNumber)
          .includes(table.tableNumber)
    );

    if (!availableTable) {
      res.status(406).json({ error: 'No available table found' });
    } else {
      req.availableTableId = availableTable._id;
      next();
    }
  }
}

export async function updateGuestForm(req, res, next) {
  try {
    var existingReservation = await Reservation.findById(req.params.id);
  } catch (e) {
    return res.status(400).json({ error: 'Wrong type of ID provided' });
  }

  if (!existingReservation) return res.status(404).json({error: 'Reservation not found'})
  
  const updatedGuestForm = req.body
  updatedGuestForm.date = new Date(updatedGuestForm.date)
  const existingGuestForm = existingReservation.guest
  req.updatedGuestForm = updatedGuestForm

  if ((updatedGuestForm.date.toString() != existingGuestForm.date.toString()) || (updatedGuestForm.guestNumber != existingGuestForm.guestNumber)) {
    next()
  }else {
    req.skipMiddleware = true
    next()
  }
}

export async function deleteOldReservations() {
  await Reservation.deleteMany({'guest.date': {$lt: manipulateHours(new Date(), 'minus', 3)}})
}


