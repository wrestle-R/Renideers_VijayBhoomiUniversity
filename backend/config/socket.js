const { Server } = require('socket.io');
const Message = require('../models/Message');
const Club = require('../models/Club');

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

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

  return io;
};

module.exports = initSocket;
