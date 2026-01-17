import express from 'express';
import PllCase from '../models/PllCase.js';

const router = express.Router();

// 1. Fetch all PLL cases
router.get('/', async (req, res) => {
  try {
    const cases = await PllCase.find();
    res.json(cases);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch PLL cases: ' + err.message });
  }
});

export default router;
