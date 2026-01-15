import express from 'express';
import PllCase from '../models/PllCase.js';
import SolveTime from '../models/SolveTime.js';

const router = express.Router();

// Helper to compute AoN (Average of N)
// In speedcubing, Ao5/Ao12 discards the fastest and slowest times, and averages the rest.
function computeAoN(times, n) {
  if (times.length < n) return null;
  const subset = times.slice(0, n); // Take the latest n times
  const min = Math.min(...subset);
  const max = Math.max(...subset);
  const sum = subset.reduce((acc, val) => acc + val, 0);
  return Math.round((sum - min - max) / (n - 2));
}

// 1. Fetch all PLL cases
router.get('/', async (req, res) => {
  try {
    const cases = await PllCase.find();
    res.json(cases);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch PLL cases: ' + err.message });
  }
});

// 2. Save a practice solve time
router.post('/stats', async (req, res) => {
  const { pllCaseId, timeMs } = req.body;
  if (!pllCaseId || timeMs === undefined) {
    return res.status(400).json({ error: 'Missing pllCaseId or timeMs' });
  }

  try {
    const newSolve = new SolveTime({ pllCaseId, timeMs });
    await newSolve.save();
    res.json({ success: true, solve: newSolve });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save solve time: ' + err.message });
  }
});

// 3. Get statistics for a specific PLL case
router.get('/stats/:caseId', async (req, res) => {
  const { caseId } = req.params;

  try {
    // Fetch all solves for this case, sorted by date descending (newest first)
    const solves = await SolveTime.find({ pllCaseId: caseId })
      .sort({ date: -1 })
      .limit(100); // Analyze up to last 100 solves

    if (solves.length === 0) {
      return res.json({
        totalSolves: 0,
        pb: null,
        ao5: null,
        ao12: null,
        recent: []
      });
    }

    const times = solves.map(s => s.timeMs);
    const pb = Math.min(...times);
    const ao5 = computeAoN(times, 5);
    const ao12 = computeAoN(times, 12);

    res.json({
      totalSolves: solves.length,
      pb,
      ao5,
      ao12,
      recent: solves.slice(0, 10).map(s => ({
        id: s._id,
        timeMs: s.timeMs,
        date: s.date
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats: ' + err.message });
  }
});

// 4. Reset stats for a specific PLL case
router.delete('/stats/:caseId', async (req, res) => {
  const { caseId } = req.params;
  try {
    await SolveTime.deleteMany({ pllCaseId: caseId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete stats: ' + err.message });
  }
});

export default router;
