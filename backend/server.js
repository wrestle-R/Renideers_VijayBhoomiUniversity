// backend/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const userRoutes = require('./routes/userRoutes');
const followerRoutes = require('./routes/followerRoutes');
const trekRoutes = require('./routes/trekRoutes');
const clubRoutes = require('./routes/clubRoutes');
const aiRoutes = require('./routes/aiRoutes');        
const photoRoutes = require('./routes/photoRoutes');  
const activityRoutes = require('./routes/activityRoutes');

const http = require('http');
const { Server } = require('socket.io');
const Message = require('./models/Message');
const Club = require('./models/Club');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 8000;

// ---------- MIDDLEWARE ----------
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// ---------- SOCKET.IO ----------
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_club', (clubId) => {
    socket.join(clubId);
    console.log(`User ${socket.id} joined club ${clubId}`);
  });

  socket.on('send_message', async (data) => {
    try {
      const { clubId, senderId, content } = data;
      const newMessage = new Message({
        club: clubId,
        sender: senderId,
        content,
      });
      await newMessage.save();

      const populatedMessage = await newMessage.populate(
        'sender',
        'fullName photoUrl'
      );
      io.to(clubId).emit('receive_message', populatedMessage);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  socket.on('report_message', async (data) => {
    try {
      const { messageId, userId, clubId } = data;
      const message = await Message.findById(messageId);
      if (!message) return;

      // prevent duplicate report from same user
      const alreadyReported = message.reports.some(
        (report) => report.reportedBy.toString() === userId.toString()
      );
      if (alreadyReported) return;

      message.reports.push({ reportedBy: userId });
      await message.save();

      // Count unique reporters for this sender in this club
      const senderMessages = await Message.find({
        sender: message.sender,
        club: clubId,
      });

      const reportedBySet = new Set();
      for (const msg of senderMessages) {
        for (const report of msg.reports) {
          reportedBySet.add(report.reportedBy.toString());
        }
      }
      const totalReports = reportedBySet.size;

      // Threshold: 5 unique reporters
      if (totalReports >= 5) {
        const senderId = message.sender;

        // Remove user from club
        const club = await Club.findById(clubId);
        if (club) {
          club.members = club.members.filter(
            (member) => member.toString() !== senderId.toString()
          );
          await club.save();

          io.to(clubId).emit('user_kicked', {
            userId: senderId,
            message: 'User kicked due to multiple reports',
          });
        }

        // Delete all messages from this user in this club
        await Message.deleteMany({ sender: senderId, club: clubId });
        io.to(clubId).emit('user_messages_deleted', { userId: senderId });
      }
    } catch (error) {
      console.error('Error reporting message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// ---------- ROUTES ----------
app.use('/api/users', userRoutes);
app.use('/api/followers', followerRoutes);
app.use('/api/treks', trekRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/activities', activityRoutes);

app.use('/api/ai', aiRoutes);
app.use('/api', photoRoutes);

// ---------- DB & SERVER ----------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.error('MongoDB Connection Error:', err));

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API endpoints available:`);
  console.log(`   - GET  http://localhost:${PORT}/api/test-ai`);
  console.log(`   - POST http://localhost:${PORT}/api/identify-species`);
  console.log(`   - POST http://localhost:${PORT}/api/species-details`);
});
