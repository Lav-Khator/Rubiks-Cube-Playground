import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import PllCase from './models/PllCase.js';
import pllSeedData from './utils/pllSeedData.js';
import pllRoutes from './routes/pllRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rubiks_trainer';

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/pll', pllRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Helper to invert algorithm moves to create scrambles
function invertAlg(algString) {
  if (!algString) return '';
  const moves = algString.trim().split(/\s+/);
  const invertMove = (move) => {
    if (move.endsWith("'")) {
      return move.slice(0, -1);
    } else if (move.endsWith('2')) {
      return move;
    } else {
      return move + "'";
    }
  };
  return moves.reverse().map(invertMove).join(' ');
}

// Auto-seed and sync function
async function seedDatabase() {
  try {
    console.log('🌱 Syncing and seeding PLL cases database...');
    for (const seed of pllSeedData) {
      // Calculate scramble as the mathematical inverse of the preferred algorithm
      const scramble = invertAlg(seed.preferredAlg);
      
      await PllCase.updateOne(
        { name: seed.name },
        { 
          $set: { 
            group: seed.group,
            scramble: scramble,
            preferredAlg: seed.preferredAlg,
            alternativeAlgs: seed.alternativeAlgs 
          }
        },
        { upsert: true }
      );
    }
    const count = await PllCase.countDocuments();
    console.log(`✅ Database sync completed. Total PLL cases: ${count}`);
  } catch (err) {
    console.error('❌ Failed to seed database:', err);
  }
}

// Database Connection & Server Boot
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('🔌 Connected to MongoDB successfully.');
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 Express server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });
