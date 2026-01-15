import mongoose from 'mongoose';

const pllCaseSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  group: { type: String, required: true },
  scramble: { type: String, required: true },
  preferredAlg: { type: String, required: true },
  alternativeAlgs: [{ type: String }]
});

const PllCase = mongoose.model('PllCase', pllCaseSchema);
export default PllCase;
