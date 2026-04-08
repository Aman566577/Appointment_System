const router = require('express').Router();
const {
  bookAppointment,
  cancelAppointment,
  getMyAppointments,
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');

// Student books an appointment
router.post('/', protect, authorize('student'), bookAppointment);

// View own appointments (student or professor)
router.get('/', protect, getMyAppointments);

// Professor cancels an appointment
router.patch('/:id/cancel', protect, authorize('professor'), cancelAppointment);

module.exports = router;
