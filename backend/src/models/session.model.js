import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  score: {
    type: Number,
    default: 0,
  },
  answers: [{
    questionId: String,
    answer: String,
    isCorrect: Boolean,
    timeSpent: Number,
  }],
  completed: {
    type: Boolean,
    default: false,
  },
});

const sessionSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed'],
    default: 'pending',
  },
  startTime: Date,
  endTime: Date,
  participants: [participantSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

sessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Session = mongoose.model('Session', sessionSchema);
