import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino-http';
import { config } from './config/config.js';
import { quizRoutes } from './routes/quiz.routes.js';
import { Session } from './models/session.model.js';
import { Quiz } from './models/quiz.model.js';

const app = express();
const httpServer = createServer(app);
export const io = new Server(httpServer, {
  cors: {
    origin: config.cors.origin,
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors(config.cors));
app.use(helmet());
app.use(express.json());
app.use(pino({ level: config.logger.level }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api', quizRoutes);

// Track active quizzes and their participants
const activeQuizzes = new Map();

const broadcastParticipants = async (quizId) => {
  try {
    const quizParticipants = activeQuizzes.get(quizId);
    if (!quizParticipants) return;

    const participantsList = Array.from(quizParticipants.values()).map(participant => ({
      userId: participant.userId,
      score: participant.score || 0,
      progress: participant.progress,
      isCorrect: participant.isCorrect,
      lastActive: participant.lastActive
    }));

    io.to(`quiz:${quizId}`).emit('participants-update', {
      participants: participantsList
    });
  } catch (error) {
    console.error('Error broadcasting participants:', error);
  }
};

// WebSocket events
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('join-quiz', async ({ quizId, sessionId, userId }) => {
    try {
      // Join quiz room
      socket.join(`quiz:${quizId}`);

      // Get or initialize quiz participants
      if (!activeQuizzes.has(quizId)) {
        activeQuizzes.set(quizId, new Map());
      }
      const quizParticipants = activeQuizzes.get(quizId);

      // Get session details
      const session = await Session.findById(sessionId).populate('quizId');
      if (!session) {
        throw new Error('Session not found');
      }

      // Find participant in session
      const participant = session.participants.find(p => p.userId === userId);

      // Add or update participant in active quizzes
      quizParticipants.set(userId, {
        userId,
        socketId: socket.id,
        sessionId,
        score: participant?.score || 0,
        answers: participant?.answers || [],
        progress: `${participant?.answers?.length || 0}/${session.quizId.questions.length}`,
        lastActive: new Date()
      });

      // Store quiz and session info in socket for cleanup
      socket.quizId = quizId;
      socket.sessionId = sessionId;
      socket.userId = userId;

      // Broadcast updated participants list
      await broadcastParticipants(quizId);

      // Notify others that a new participant joined
      socket.to(`quiz:${quizId}`).emit('user-joined', {
        userId,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error handling join-quiz:', error);
    }
  });

  socket.on('leave-quiz', async ({ quizId, userId }) => {
    try {
      socket.leave(`quiz:${quizId}`);
      const quizParticipants = activeQuizzes.get(quizId);
      if (quizParticipants) {
        quizParticipants.delete(userId);
        if (quizParticipants.size === 0) {
          activeQuizzes.delete(quizId);
        } else {
          await broadcastParticipants(quizId);
        }
      }
    } catch (error) {
      console.error('Error handling leave-quiz:', error);
    }
  });

  socket.on('disconnect', async () => {
    try {
      console.log(`Client disconnected: ${socket.id}`);

      // Clean up participant from active quiz
      const { quizId, userId } = socket;
      if (quizId && userId) {
        const quizParticipants = activeQuizzes.get(quizId);
        if (quizParticipants) {
          quizParticipants.delete(userId);
          if (quizParticipants.size === 0) {
            activeQuizzes.delete(quizId);
          } else {
            await broadcastParticipants(quizId);
          }
        }
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
});

// Export activeQuizzes for use in quiz service
export const getActiveQuizzes = () => activeQuizzes;

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(config.env === 'development' && { stack: err.stack }),
    },
  });
});

// Connect to MongoDB
mongoose
  .connect(config.mongodb.uri, config.mongodb.options)
  .then(() => {
    console.log('Connected to MongoDB');

    // Start server
    const port = config.port;
    httpServer.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Environment: ${config.env}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  httpServer.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});
