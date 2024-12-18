import { quizService } from '../services/quiz.service.js';

export const quizController = {
  async createQuiz(req, res) {
    try {
      const quiz = await quizService.createQuiz(req.body);
      res.status(201).json(quiz);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async getQuiz(req, res) {
    try {
      const quiz = await quizService.getQuiz(req.params.id);
      res.json(quiz);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  async getAllQuizzes(req, res) {
    try {
      const quizzes = await quizService.getAllQuizzes();
      res.json(quizzes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getFirstQuiz(req, res) {
    try {
      const quiz = await quizService.getFirstQuiz();
      res.json(quiz);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  async createSession(req, res) {
    try {
      const { quizId, userId } = req.body;
      const session = await quizService.createSession(quizId, userId);
      res.status(201).json(session);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async startSession(req, res) {
    try {
      const session = await quizService.startSession(req.params.sessionId);
      res.json(session);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async submitAnswer(req, res) {
    try {
      const { sessionId } = req.params;
      const { userId, questionId, answer } = req.body;
      const result = await quizService.submitAnswer(sessionId, userId, questionId, answer);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async endSession(req, res) {
    try {
      const session = await quizService.endSession(req.params.sessionId);
      res.json(session);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async getSessionResults(req, res) {
    try {
      const results = await quizService.getSessionResults(req.params.sessionId);
      res.json(results);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },
};
