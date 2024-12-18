import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { submitAnswer, nextQuestion, endSession } from '../store/quizSlice';

export const QuizCard = () => {
  const dispatch = useDispatch();
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const { quiz, currentQuestion, session } = useSelector((state) => state.quiz);
  const question = quiz?.questions[currentQuestion];
  const isLastQuestion = currentQuestion === quiz?.questions.length - 1;

  useEffect(() => {
    // Check if we need to end the session after the last question
    if (isAnswered && isLastQuestion) {
      const timer = setTimeout(() => {
        dispatch(endSession(session._id));
      }, 2000); // Wait 2 seconds to show the result before ending

      return () => clearTimeout(timer);
    }
  }, [isAnswered, isLastQuestion, dispatch, session?._id]);

  if (!question) return null;

  const handleOptionSelect = (option) => {
    if (isAnswered) return;
    setSelectedOption(option);
  };

  const handleSubmit = async () => {
    if (!selectedOption || isAnswered) return;

    await dispatch(submitAnswer({
      sessionId: session._id,
      userId: session.participants[0].userId,
      questionId: question._id,
      answer: selectedOption,
    }));

    setIsAnswered(true);

    // If not the last question, proceed to next after delay
    if (!isLastQuestion) {
      setTimeout(() => {
        dispatch(nextQuestion());
        setSelectedOption(null);
        setIsAnswered(false);
      }, 2000);
    }
  };

  const getOptionClass = (option) => {
    if (!isAnswered) {
      return `quiz-option ${selectedOption === option ? 'quiz-option-selected' : ''}`;
    }

    if (option === question.correctAnswer) {
      return 'quiz-option quiz-option-correct';
    }

    if (option === selectedOption && option !== question.correctAnswer) {
      return 'quiz-option quiz-option-incorrect';
    }

    return 'quiz-option';
  };

  return (
    <div className="card max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-gray-500">
            Question {currentQuestion + 1} of {quiz.questions.length}
          </span>
          <span className="text-sm font-medium text-primary-600">
            {question.difficulty}
          </span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {question.text}
        </h2>
      </div>

      <div className="space-y-4">
        {question.options.map((option, index) => (
          <div
            key={index}
            className={getOptionClass(option)}
            onClick={() => handleOptionSelect(option)}
          >
            <div className="flex-1">{option}</div>
            {isAnswered && option === question.correctAnswer && (
              <svg
                className="h-5 w-5 text-green-500"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7"></path>
              </svg>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8">
        <button
          className={`btn-primary w-full ${
            !selectedOption || isAnswered ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          onClick={handleSubmit}
          disabled={!selectedOption || isAnswered}
        >
          {isAnswered ? (
            isLastQuestion ? 'Completing Quiz...' : 'Next Question...'
          ) : (
            'Submit Answer'
          )}
        </button>
      </div>

      {isAnswered && isLastQuestion && (
        <div className="mt-4 text-center text-gray-600">
          Quiz completed! Calculating final results...
        </div>
      )}
    </div>
  );
};

export default QuizCard;
