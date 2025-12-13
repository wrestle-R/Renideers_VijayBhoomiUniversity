// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');

const connectDB = require('./config/db');
const initSocket = require('./config/socket');

const userRoutes = require('./routes/userRoutes');
const followerRoutes = require('./routes/followerRoutes');
const trekRoutes = require('./routes/trekRoutes');
const clubRoutes = require('./routes/clubRoutes');
const aiRoutes = require('./routes/aiRoutes');        
const activityRoutes = require('./routes/activityRoutes');
const trekPhotoRoutes = require('./routes/trekPhotoRoutes');
const badgeRoutes = require('./routes/badgeRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');
const sosRoutes = require('./routes/sosRoutes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = initSocket(server);

const PORT = process.env.PORT || 8000;

// ---------- MIDDLEWARE ----------
app.use(
  cors({
    origin: [
      process.env.FRONTEND_ORIGIN, 'http://localhost:5173', 'http://localhost:5174'
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
// Twilio webhooks send application/x-www-form-urlencoded payloads
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ---------- ROUTES ----------
app.use('/api/users', userRoutes);
app.use('/api/followers', followerRoutes);
app.use('/api/treks', trekRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api', trekPhotoRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/sos', sosRoutes);

// ---------- DB & SERVER ----------
connectDB();

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API endpoints available:`);
  console.log(`   - GET  http://localhost:${PORT}/api/test-ai`);
  console.log(`   - POST http://localhost:${PORT}/api/identify-species`);
  console.log(`   - POST http://localhost:${PORT}/api/species-details`);
});
