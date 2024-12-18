import express from 'express';
import { quizController } from '../controllers/quiz.controller.js';
import { body, param } from 'express-validator';

const router = express.Router();

// Validation middleware
const validateQuiz = [
  body('title').notEmpty().trim().isString(),
  body('description').notEmpty().trim().isString(),
  body('timeLimit').isInt({ min: 30, max: 3600 }),
  body('questions').isArray({ min: 1 }),
  body('questions.*.text').notEmpty().trim().isString(),
  body('questions.*.options').isArray({ min: 2 }),
  body('questions.*.correctAnswer').notEmpty().trim().isString(),
  body('questions.*.difficulty').isIn(['easy', 'medium', 'hard']),
];

const validateSession = [
  body('quizId').notEmpty().isMongoId(),
  body('userId').notEmpty().trim().isString(),
];

const validateAnswer = [
  param('sessionId').isMongoId(),
  body('userId').notEmpty().trim().isString(),
  body('questionId').notEmpty().trim().isString(),
  body('answer').notEmpty().trim().isString(),
];

// Quiz routes
router.get('/quizzes', quizController.getAllQuizzes);
router.get('/quizzes/first', quizController.getFirstQuiz);
router.post('/quizzes', validateQuiz, quizController.createQuiz);
router.get('/quizzes/:id', param('id').isMongoId(), quizController.getQuiz);

// Session routes
router.post('/sessions', validateSession, quizController.createSession);
router.post('/sessions/:sessionId/start',
  param('sessionId').isMongoId(),
  quizController.startSession
);
router.post('/sessions/:sessionId/submit',
  validateAnswer,
  quizController.submitAnswer
);
router.post('/sessions/:sessionId/end',
  param('sessionId').isMongoId(),
  quizController.endSession
);
router.get('/sessions/:sessionId/results',
  param('sessionId').isMongoId(),
  quizController.getSessionResults
);

export const quizRoutes = router;
