const Slot = require('../models/Slot');

// POST /api/slots  — Professor adds availability slots
const addSlots = async (req, res) => {
  try {
    let slots = req.body; // array of { startTime, endTime }

    if (!Array.isArray(slots)) slots = [slots]; // allow single object too

    if (!slots.length) {
      return res.status(400).json({ success: false, message: 'Provide at least one slot.' });
    }

    const docs = slots.map(({ startTime, endTime }) => ({
      professor: req.user._id,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
    }));

    // insertMany with ordered:false so one duplicate doesn't block the rest
    const inserted = await Slot.insertMany(docs, { ordered: false });

    res.status(201).json({ success: true, count: inserted.length, slots: inserted });
  } catch (err) {
    // Duplicate key errors from the unique index
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'One or more slots already exist at that time.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/slots/:professorId — List available (unbooked) slots for a professor
const getAvailableSlots = async (req, res) => {
  try {
    const slots = await Slot.find({
      professor: req.params.professorId,
      isBooked: false,
      startTime: { $gt: new Date() }, // only future slots
    })
      .sort({ startTime: 1 })
      .select('-__v');

    res.json({ success: true, count: slots.length, slots });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { addSlots, getAvailableSlots };
