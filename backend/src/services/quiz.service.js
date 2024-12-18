import { Quiz } from '../models/quiz.model.js';
import { Session } from '../models/session.model.js';
import { createClient } from 'redis';
import { config } from '../config/config.js';
import { io, getActiveQuizzes } from '../index.js';

class QuizService {
  constructor() {
    this.redisClient = createClient({
      host: config.redis.host,
      port: config.redis.port,
    });
    this.redisClient.connect().catch(console.error);
  }

  async createQuiz(quizData) {
    try {
      const quiz = new Quiz(quizData);
      await quiz.save();
      return quiz;
    } catch (error) {
      throw new Error(`Error creating quiz: ${error.message}`);
    }
  }

  async getAllQuizzes() {
    try {
      const cachedQuizzes = await this.redisClient.get('quizzes:all');
      if (cachedQuizzes) {
        return JSON.parse(cachedQuizzes);
      }

      const quizzes = await Quiz.find({ isActive: true })
        .select('title description questions timeLimit createdAt')
        .sort({ createdAt: -1 });

      await this.redisClient.setEx('quizzes:all', 300, JSON.stringify(quizzes));
      return quizzes;
    } catch (error) {
      throw new Error(`Error fetching quizzes: ${error.message}`);
    }
  }

  async getQuiz(quizId) {
    try {
      const cachedQuiz = await this.redisClient.get(`quiz:${quizId}`);
      if (cachedQuiz) {
        return JSON.parse(cachedQuiz);
      }

      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        throw new Error('Quiz not found');
      }

      await this.redisClient.setEx(`quiz:${quizId}`, 3600, JSON.stringify(quiz));
      return quiz;
    } catch (error) {
      throw new Error(`Error fetching quiz: ${error.message}`);
    }
  }

  async getFirstQuiz() {
    try {
      const quiz = await Quiz.findOne({ isActive: true }).sort({ createdAt: 1 });
      if (!quiz) {
        throw new Error('No quizzes found');
      }
      return quiz;
    } catch (error) {
      throw new Error(`Error fetching first quiz: ${error.message}`);
    }
  }

  async createSession(quizId, userId) {
    try {
      const quiz = await this.getQuiz(quizId);
      if (!quiz) {
        throw new Error('Quiz not found');
      }

      const session = new Session({
        quizId,
        participants: [{ userId }],
        status: 'pending',
      });

      await session.save();
      await this.redisClient.setEx(
        `session:${session._id}`,
        quiz.timeLimit,
        JSON.stringify(session)
      );

      return session;
    } catch (error) {
      throw new Error(`Error creating session: ${error.message}`);
    }
  }

  async startSession(sessionId) {
    try {
      const session = await Session.findById(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      session.status = 'active';
      session.startTime = new Date();
      await session.save();

      const quiz = await this.getQuiz(session.quizId);
      session.endTime = new Date(session.startTime.getTime() + quiz.timeLimit * 1000);

      await this.redisClient.setEx(
        `session:${sessionId}`,
        quiz.timeLimit,
        JSON.stringify(session)
      );

      return session;
    } catch (error) {
      throw new Error(`Error starting session: ${error.message}`);
    }
  }

  async submitAnswer(sessionId, userId, questionId, answer) {
    try {
      const session = await Session.findById(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      if (session.status !== 'active') {
        throw new Error('Session is not active');
      }

      const quiz = await this.getQuiz(session.quizId);
      const question = quiz.questions.find(q => q._id.toString() === questionId);

      if (!question) {
        throw new Error('Question not found');
      }

      const participant = session.participants.find(p => p.userId === userId);
      if (!participant) {
        throw new Error('Participant not found in session');
      }

      const isCorrect = question.correctAnswer === answer;
      const timeSpent = (new Date() - session.startTime) / 1000;

      participant.answers.push({
        questionId,
        answer,
        isCorrect,
        timeSpent,
      });

      if (isCorrect) {
        // Calculate score based on time spent and difficulty
        const timeBonus = Math.max(0, 1 - (timeSpent / quiz.timeLimit));
        const difficultyMultiplier = {
          easy: 1,
          medium: 1.5,
          hard: 2,
        }[question.difficulty];

        participant.score += Math.round(100 * timeBonus * difficultyMultiplier);
      }

      await session.save();
      await this.redisClient.setEx(
        `session:${sessionId}`,
        quiz.timeLimit,
        JSON.stringify(session)
      );

      // Update active quiz participant data
      const activeQuizzes = getActiveQuizzes();
      const quizParticipants = activeQuizzes.get(session.quizId.toString());
      if (quizParticipants) {
        const activeParticipant = quizParticipants.get(userId);
        if (activeParticipant) {
          activeParticipant.score = participant.score;
          activeParticipant.answers = participant.answers;
          activeParticipant.isCorrect = isCorrect;
          activeParticipant.progress = `${participant.answers.length}/${quiz.questions.length}`;
          activeParticipant.lastActive = new Date();
          quizParticipants.set(userId, activeParticipant);
        }

        // Broadcast updated participants list
        const participantsList = Array.from(quizParticipants.values()).map(p => ({
          userId: p.userId,
          score: p.score || 0,
          progress: p.progress,
          isCorrect: p.isCorrect,
          lastActive: p.lastActive
        }));

        io.to(`quiz:${session.quizId}`).emit('participants-update', {
          participants: participantsList
        });
      }

      return {
        isCorrect,
        score: participant.score,
        timeSpent,
      };
    } catch (error) {
      throw new Error(`Error submitting answer: ${error.message}`);
    }
  }

  async endSession(sessionId) {
    try {
      const session = await Session.findById(sessionId).populate('quizId');
      if (!session) {
        throw new Error('Session not found');
      }

      session.status = 'completed';
      session.endTime = new Date();

      for (const participant of session.participants) {
        participant.completed = true;
      }

      await session.save();
      await this.redisClient.del(`session:${sessionId}`);

      // Clean up active quiz participants
      const activeQuizzes = getActiveQuizzes();
      const quizParticipants = activeQuizzes.get(session.quizId.toString());
      if (quizParticipants) {
        session.participants.forEach(participant => {
          quizParticipants.delete(participant.userId);
        });

        if (quizParticipants.size === 0) {
          activeQuizzes.delete(session.quizId.toString());
        } else {
          // Broadcast final participant list
          const participantsList = Array.from(quizParticipants.values()).map(p => ({
            userId: p.userId,
            score: p.score || 0,
            progress: p.progress,
            isCorrect: p.isCorrect,
            lastActive: p.lastActive
          }));

          io.to(`quiz:${session.quizId}`).emit('participants-update', {
            participants: participantsList
          });
        }
      }

      return session;
    } catch (error) {
      throw new Error(`Error ending session: ${error.message}`);
    }
  }

  async getSessionResults(sessionId) {
    try {
      const session = await Session.findById(sessionId)
        .populate('quizId')
        .exec();

      if (!session) {
        throw new Error('Session not found');
      }

      return {
        quizTitle: session.quizId.title,
        startTime: session.startTime,
        endTime: session.endTime,
        participants: session.participants.map(p => ({
          userId: p.userId,
          score: p.score,
          correctAnswers: p.answers.filter(a => a.isCorrect).length,
          totalAnswers: p.answers.length,
          completed: p.completed,
        })),
      };
    } catch (error) {
      throw new Error(`Error fetching session results: ${error.message}`);
    }
  }
}

export const quizService = new QuizService();
