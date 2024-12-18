import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchQuiz, createSession, startSession, endSession, resetQuiz } from '../store/quizSlice';
import QuizCard from './QuizCard';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

const formatUserId = (userId) => {
  if (userId.startsWith('anon_')) {
    return `Anonymous ${userId.slice(-4)}`;
  }
  return userId;
};

export const QuizSession = ({ userId }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { quizId } = useParams();
  const [timeLeft, setTimeLeft] = useState(null);
  const [participants, setParticipants] = useState([]);
  const { quiz, session, status, currentQuestion } = useSelector((state) => state.quiz);

  useEffect(() => {
    const initializeQuiz = async () => {
      if (!quizId) {
        navigate('/');
        return;
      }

      await dispatch(fetchQuiz(quizId));
      const result = await dispatch(createSession({ quizId, userId }));
      if (result.payload) {
        socket.emit('join-quiz', {
          quizId,
          sessionId: result.payload._id,
          userId
        });
      }
    };

    initializeQuiz();

    // Socket event listeners
    socket.on('participants-update', (data) => {
      setParticipants(data.participants);
    });

    socket.on('user-joined', (data) => {
      console.log(`User ${formatUserId(data.userId)} joined the quiz`);
    });

    return () => {
      if (quizId) {
        socket.emit('leave-quiz', {
          quizId,
          userId
        });
      }
      socket.off('participants-update');
      socket.off('user-joined');
    };
  }, [dispatch, quizId, userId, navigate]);

  useEffect(() => {
    if (session && quiz && status === 'active') {
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const end = new Date(session.startTime).getTime() + (quiz.timeLimit * 1000);
        const distance = end - now;

        if (distance <= 0) {
          clearInterval(timer);
          setTimeLeft(0);
          dispatch(endSession(session._id));
        } else {
          setTimeLeft(Math.floor(distance / 1000));
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [session, quiz, status, dispatch]);

  const handleStart = async () => {
    await dispatch(startSession(session._id));
  };

  const handleTryAgain = () => {
    dispatch(resetQuiz());
    navigate('/');
  };

  const calculatePercentage = (correct, total) => {
    return Math.round((correct / total) * 100);
  };

  const renderLiveScores = () => {
    if (status !== 'active' || participants.length === 0) return null;

    return (
      <div className="fixed top-4 right-4 bg-white p-4 rounded-lg shadow-lg max-w-sm">
        <h3 className="text-lg font-semibold mb-3">Live Scores</h3>
        <div className="space-y-2">
          {participants.map((participant) => (
            <div
              key={participant.userId}
              className={`flex justify-between items-center p-2 rounded ${
                participant.isCorrect ? 'bg-green-50' : 'bg-gray-50'
              } ${participant.userId === userId ? 'border-2 border-primary-500' : ''}`}
            >
              <div className="flex flex-col">
                <span className="font-medium">
                  {formatUserId(participant.userId)}
                  {participant.userId === userId ? ' (You)' : ''}
                </span>
                <span className="text-sm text-gray-500">{participant.progress}</span>
              </div>
              <span className="font-bold">{participant.score}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        );

      case 'succeeded':
      case 'idle':
        return (
          <div className="card max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">{quiz?.title}</h2>
            <p className="text-gray-600 mb-8">{quiz?.description}</p>
            <div className="text-sm text-gray-500 mb-4">
              Playing as: {formatUserId(userId)}
            </div>
            {participants.length > 1 && (
              <div className="text-sm text-primary-600 mb-4">
                {participants.length - 1} other player{participants.length > 2 ? 's' : ''} in this quiz
              </div>
            )}
            <button
              className="btn-primary"
              onClick={handleStart}
              disabled={!quiz || !session}
            >
              Start Quiz
            </button>
          </div>
        );

      case 'active':
        return (
          <div>
            <div className="mb-4 text-center">
              <div className="text-lg font-semibold text-primary-600">
                Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
            </div>
            <QuizCard />
            {renderLiveScores()}
          </div>
        );

      case 'completed':
        const participant = session?.participants[0];
        const correctAnswers = participant?.answers.filter(a => a.isCorrect).length || 0;
        const totalQuestions = quiz?.questions.length || 0;
        const percentage = calculatePercentage(correctAnswers, totalQuestions);

        return (
          <div className="card max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Quiz Completed!</h2>
              <p className="text-gray-600">Great effort! Here's how you did:</p>
              <div className="text-sm text-gray-500 mt-2">
                Playing as: {formatUserId(userId)}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary-600">
                      {participant?.score || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary-600">
                      {percentage}%
                    </div>
                    <div className="text-sm text-gray-600">Accuracy</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Correct Answers:</span>
                  <span className="font-medium">{correctAnswers} of {totalQuestions}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Time Taken:</span>
                  <span className="font-medium">
                    {Math.round((quiz.timeLimit - (timeLeft || 0)) / 60)} minutes
                  </span>
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={handleTryAgain}
                  className="btn-primary w-full"
                >
                  Try Another Quiz
                </button>
              </div>
            </div>
          </div>
        );

      case 'failed':
        return (
          <div className="card max-w-2xl mx-auto text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-4">
              Something went wrong
            </h2>
            <button
              className="btn-primary"
              onClick={() => navigate('/')}
            >
              Return to Home
            </button>
          </div>
        );

      default:
        return (
          <div className="card max-w-2xl mx-auto text-center">
            <h2 className="text-xl font-semibold text-gray-600 mb-4">
              Loading Quiz...
            </h2>
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {renderContent()}
    </div>
  );
};

export default QuizSession;
