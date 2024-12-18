import mongoose from 'mongoose';
import { Quiz } from '../models/quiz.model.js';
import { config } from '../config/config.js';

const sampleQuizzes = [
  {
    title: 'Advanced Vocabulary Challenge',
    description: 'Test your knowledge of advanced English vocabulary words',
    timeLimit: 300, // 5 minutes
    questions: [
      {
        text: 'What is the meaning of "Ephemeral"?',
        options: [
          'Lasting for a very short time',
          'Extremely important',
          'Clearly visible',
          'Strongly scented'
        ],
        correctAnswer: 'Lasting for a very short time',
        difficulty: 'hard'
      },
      {
        text: 'Choose the correct meaning of "Ubiquitous"',
        options: [
          'Rare and unique',
          'Present everywhere',
          'Underground',
          'Unnecessary'
        ],
        correctAnswer: 'Present everywhere',
        difficulty: 'hard'
      },
      {
        text: 'What does "Surreptitious" mean?',
        options: [
          'Above ground',
          'Kept secret',
          'Very surprising',
          'Extremely loud'
        ],
        correctAnswer: 'Kept secret',
        difficulty: 'hard'
      }
    ]
  },
  {
    title: 'Common English Words',
    description: 'Test your understanding of commonly used English words',
    timeLimit: 180, // 3 minutes
    questions: [
      {
        text: 'What is the opposite of "Happy"?',
        options: [
          'Sad',
          'Angry',
          'Tired',
          'Excited'
        ],
        correctAnswer: 'Sad',
        difficulty: 'easy'
      },
      {
        text: 'Choose the synonym of "Beautiful"',
        options: [
          'Ugly',
          'Pretty',
          'Smart',
          'Fast'
        ],
        correctAnswer: 'Pretty',
        difficulty: 'easy'
      },
      {
        text: 'What is the meaning of "Brave"?',
        options: [
          'Scared',
          'Weak',
          'Courageous',
          'Silly'
        ],
        correctAnswer: 'Courageous',
        difficulty: 'easy'
      }
    ]
  },
  {
    title: 'Business Vocabulary',
    description: 'Test your knowledge of business-related terms',
    timeLimit: 240, // 4 minutes
    questions: [
      {
        text: 'What does "ROI" stand for?',
        options: [
          'Return on Investment',
          'Rate of Interest',
          'Risk of Inflation',
          'Return on Income'
        ],
        correctAnswer: 'Return on Investment',
        difficulty: 'medium'
      },
      {
        text: 'What is a "Merger"?',
        options: [
          'A new business',
          'A business closure',
          'Combination of two companies',
          'A business loan'
        ],
        correctAnswer: 'Combination of two companies',
        difficulty: 'medium'
      },
      {
        text: 'What does "B2B" mean?',
        options: [
          'Back to Business',
          'Business to Business',
          'Business to Buyer',
          'Buy to Build'
        ],
        correctAnswer: 'Business to Business',
        difficulty: 'medium'
      }
    ]
  }
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    console.log('Connected to MongoDB');

    // Clear existing quizzes
    await Quiz.deleteMany({});
    console.log('Cleared existing quizzes');

    // Insert sample quizzes
    const result = await Quiz.insertMany(sampleQuizzes);
    console.log(`Inserted ${result.length} quizzes`);

    // Log the IDs of created quizzes for reference
    console.log('Created quiz IDs:');
    result.forEach(quiz => {
      console.log(`${quiz.title}: ${quiz._id}`);
    });

    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the seed function
seedDatabase();
