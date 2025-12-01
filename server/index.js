import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/auth.js';
import characterRoutes from './routes/characters.js';
import itemRoutes from './routes/items.js';
import monsterRoutes from './routes/monsters.js';
import spellRoutes from './routes/spells.js';
import classRoutes from './routes/classes.js';
import raceRoutes from './routes/races.js';
import backgroundRoutes from './routes/backgrounds.js';
import featRoutes from './routes/feats.js';
import subclassRoutes from './routes/subclasses.js';
import petRoutes from './routes/pets.js';
import faithRoutes from './routes/faiths.js';
import campaignRoutes from './routes/campaigns.js';
import collectionRoutes from './routes/collection.js';
import browseRoutes from './routes/browse.js';
import userRoutes from './routes/users.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/monsters', monsterRoutes);
app.use('/api/spells', spellRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/races', raceRoutes);
app.use('/api/backgrounds', backgroundRoutes);
app.use('/api/feats', featRoutes);
app.use('/api/subclasses', subclassRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/faiths', faithRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/collection', collectionRoutes);
app.use('/api/browse', browseRoutes);
app.use('/api/users', userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

