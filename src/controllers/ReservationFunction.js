import Reservation from '../db/models/ReservationModel.js';
import Table from '../db/models/TableModel.js';

function manipulateHours(date, operator, hours) {
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

  const bookingInfo = req?.newGuestForm || req.body;

  bookingInfo.guestNumber = Number(bookingInfo.guestNumber);

  const dateFilteredReservations = await Reservation.find({
    'guest.date': {
      $lt: manipulateHours(new Date(bookingInfo.date), 'plus', 5),
      $gt: manipulateHours(new Date(bookingInfo.date), 'minus', 5),
    },
  }).populate('table');

  if (dateFilteredReservations.length) {
    const duplicateReservation = req?.newGuestForm
      ? null
      : findDuplicateReservation(bookingInfo, dateFilteredReservations);
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
  } else {
    next();
  }
}

export async function getAvailableTable(req, res, next) {
  if (req.skipMiddleware) return next();

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
  if (!existingReservation)
    return res.status(404).json({ error: 'Reservation not found' });

  const newGuestForm = req.body;
  const existingGuestForm = existingReservation.guest;
  req.newGuestForm = newGuestForm;

  if (
    newGuestForm.date != existingGuestForm.date ||
    newGuestForm.guestNumber != existingGuestForm.guestNumber
  ) {
    next();
  } else {
    req.skipMiddleware = true;
    next();
  }
}
