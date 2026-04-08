const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Slot = require('../models/Slot');

// POST /api/appointments  — Student books a slot
const bookAppointment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction(); // both happen together or neither happens (slot booked and creating appointment record )

  try {
    const { slotId } = req.body;
    if (!slotId) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'slotId is required.' });
    }

    // Lock the slot atomically — find an available slot and mark it booked in one op
    const slot = await Slot.findOneAndUpdate(
      { _id: slotId, isBooked: false },
      { isBooked: true },
      { new: true, session }
    );

    if (!slot) {
      await session.abortTransaction();
      return res.status(409).json({ success: false, message: 'Slot is unavailable or already booked.' });
    }

    const appointment = await Appointment.create(
      [{ slot: slot._id, student: req.user._id, professor: slot.professor }],
      { session }
    );

    await session.commitTransaction();

    const populated = await Appointment.findById(appointment[0]._id)
      .populate('student', 'name email')
      .populate('professor', 'name email')
      .populate('slot', 'startTime endTime');

    res.status(201).json({ success: true, appointment: populated });
  } catch (err) {
    await session.abortTransaction();
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Slot already booked.' });
    }
    res.status(500).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};

// PATCH /api/appointments/:id/cancel  — Professor cancels an appointment
const cancelAppointment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const appointment = await Appointment.findById(req.params.id).session(session);

    if (!appointment) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

     // appointment belong to professor who's requesting the cancel
    if (!appointment.professor.equals(req.user._id)) {    
      await session.abortTransaction();
      return res.status(403).json({ success: false, message: 'Only the assigned professor can cancel this appointment.' });
    }

    if (appointment.status === 'cancelled') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Appointment is already cancelled.' });
    }

    // Mark appointment cancelled
    appointment.status = 'cancelled';
    appointment.cancelledBy = req.user._id;
    appointment.cancelledAt = new Date();
    await appointment.save({ session });

    // Free up the slot again
    await Slot.findByIdAndUpdate(appointment.slot, { isBooked: false }, { session }); 

    await session.commitTransaction();

    const populated = await Appointment.findById(appointment._id)
      .populate('student', 'name email')
      .populate('professor', 'name email')
      .populate('slot', 'startTime endTime');

    res.json({ success: true, message: 'Appointment cancelled successfully.', appointment: populated });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};

// GET /api/appointments  — View own appointments (student or professor)
const getMyAppointments = async (req, res) => {
  try {
    const filter =
      req.user.role === 'professor'
        ? { professor: req.user._id }
        : { student: req.user._id };

    const appointments = await Appointment.find(filter)
      .populate('student', 'name email')
      .populate('professor', 'name email')
      .populate('slot', 'startTime endTime')
      .sort({ createdAt: -1 })
      .select('-__v');

    res.json({ success: true, count: appointments.length, appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { bookAppointment, cancelAppointment, getMyAppointments };
