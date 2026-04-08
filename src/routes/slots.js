const router = require('express').Router();
const { addSlots, getAvailableSlots } = require('../controllers/slotController');
const { protect, authorize } = require('../middleware/auth');

// Professor adds their available slots
router.post('/', protect, authorize('professor'), addSlots);

// Anyone authenticated can view a professor's available slots
router.get('/:professorId', protect, getAvailableSlots);

module.exports = router;
