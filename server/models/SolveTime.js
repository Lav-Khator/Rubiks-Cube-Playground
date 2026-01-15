import mongoose from 'mongoose';

const solveTimeSchema = new mongoose.Schema({
  pllCaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'PllCase', required: true },
  timeMs: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

const SolveTime = mongoose.model('SolveTime', solveTimeSchema);
export default SolveTime;
