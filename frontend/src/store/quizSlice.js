import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

export const fetchQuiz = createAsyncThunk(
  'quiz/fetchQuiz',
  async (quizId) => {
    const response = await axios.get(`${API_URL}/quizzes/${quizId}`);
    return response.data;
  }
);

export const createSession = createAsyncThunk(
  'quiz/createSession',
  async ({ quizId, userId }) => {
    const response = await axios.post(`${API_URL}/sessions`, { quizId, userId });
    return response.data;
  }
);

export const startSession = createAsyncThunk(
  'quiz/startSession',
  async (sessionId) => {
    const response = await axios.post(`${API_URL}/sessions/${sessionId}/start`);
    return response.data;
  }
);

export const submitAnswer = createAsyncThunk(
  'quiz/submitAnswer',
  async ({ sessionId, userId, questionId, answer }) => {
    const response = await axios.post(`${API_URL}/sessions/${sessionId}/submit`, {
      userId,
      questionId,
      answer,
    });
    return response.data;
  }
);

export const endSession = createAsyncThunk(
  'quiz/endSession',
  async (sessionId) => {
    const response = await axios.post(`${API_URL}/sessions/${sessionId}/end`);
    return response.data;
  }
);

const initialState = {
  quiz: null,
  session: null,
  currentQuestion: 0,
  score: 0,
  status: 'idle',
  error: null,
  results: null,
};

const quizSlice = createSlice({
  name: 'quiz',
  initialState,
  reducers: {
    nextQuestion: (state) => {
      if (state.currentQuestion < state.quiz.questions.length - 1) {
        state.currentQuestion += 1;
      }
    },
    resetQuiz: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuiz.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchQuiz.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.quiz = action.payload;
      })
      .addCase(fetchQuiz.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(createSession.fulfilled, (state, action) => {
        state.session = action.payload;
      })
      .addCase(startSession.fulfilled, (state, action) => {
        state.session = action.payload;
        state.status = 'active';
      })
      .addCase(submitAnswer.fulfilled, (state, action) => {
        state.score = action.payload.score;
      })
      .addCase(endSession.fulfilled, (state, action) => {
        state.session = action.payload;
        state.status = 'completed';
      });
  },
});

export const { nextQuestion, resetQuiz } = quizSlice.actions;
export default quizSlice.reducer;
