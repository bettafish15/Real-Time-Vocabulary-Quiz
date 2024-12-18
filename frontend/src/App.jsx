import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Provider } from 'react-redux';
import axios from 'axios';
import store from './store';
import QuizSession from './components/QuizSession';

// Function to generate or retrieve anonymous user ID
const getAnonymousUserId = () => {
  // Check if we already have a user ID in localStorage
  let userId = localStorage.getItem('anonymousUserId');

  if (!userId) {
    // Generate a random user ID if none exists
    userId = 'anon_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('anonymousUserId', userId);
  }

  return userId;
};

const QuizList = ({ quizzes, loading, error }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {quizzes.map((quiz) => (
        <div key={quiz._id} className="card">
          <h3 className="text-xl font-semibold mb-2">{quiz.title}</h3>
          <p className="text-gray-600 mb-4">{quiz.description}</p>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">
              {quiz.questions.length} questions
            </span>
            <Link
              to={`/quiz/${quiz._id}`}
              className="btn-primary"
            >
              Start Quiz
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
};

const Home = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/quizzes');
        setQuizzes(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load quizzes. Please try again later.');
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Vocabulary Quiz App
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Test your vocabulary knowledge with our interactive quiz system.
            Challenge yourself with questions of varying difficulty levels.
          </p>
          <div className="text-sm text-gray-500 mb-8">
            Playing as: Anonymous User ({getAnonymousUserId().slice(-4)})
          </div>
        </div>

        <QuizList quizzes={quizzes} loading={loading} error={error} />

        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="card">
            <div className="text-primary-600 mb-4">
              <svg
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Real-time Updates</h3>
            <p className="text-gray-600">
              Experience instant feedback and live score updates as you progress
              through the quiz.
            </p>
          </div>

          <div className="card">
            <div className="text-primary-600 mb-4">
              <svg
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Adaptive Scoring</h3>
            <p className="text-gray-600">
              Earn points based on question difficulty and response time for a
              dynamic challenge.
            </p>
          </div>

          <div className="card">
            <div className="text-primary-600 mb-4">
              <svg
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">No Login Required</h3>
            <p className="text-gray-600">
              Start quizzing instantly - no registration needed. Your progress is
              saved automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  // Get or generate anonymous user ID
  const anonymousUserId = getAnonymousUserId();

  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/quiz/:quizId"
            element={<QuizSession userId={anonymousUserId} />}
          />
        </Routes>
      </Router>
    </Provider>
  );
};

export default App;
