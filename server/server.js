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

// Auto-seed function
async function seedDatabase() {
  try {
    const count = await PllCase.countDocuments();
    if (count === 0) {
      console.log('🌱 Database is empty. Seeding standard 21 PLL cases...');
      await PllCase.insertMany(pllSeedData);
      console.log('✅ Seeding completed! 21 PLL cases registered.');
    } else {
      console.log(`ℹ️ Database already seeded with ${count} PLL cases.`);
    }
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
