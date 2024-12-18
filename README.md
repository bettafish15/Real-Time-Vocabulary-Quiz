# Real-Time Vocabulary Quiz System

A real-time quiz system with multiplayer support, live scoring, and anonymous participation.

## System Requirements

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- Redis (v6 or higher)

## Project Structure

```
.
├── backend/                 # Backend server
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   └── package.json
│
├── frontend/               # Frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── store/         # Redux store
│   │   └── utils/         # Utility functions
│   └── package.json
│
├── ARCHITECTURE.md         # System architecture documentation
├── SCALABILITY.md         # Future scalability plans
└── README.md              # This file
```

## Getting Started

### Prerequisites

1. Install MongoDB:
   ```bash
   # Ubuntu
   sudo apt-get install mongodb

   # macOS
   brew install mongodb-community
   ```

2. Install Redis:
   ```bash
   # Ubuntu
   sudo apt-get install redis-server

   # macOS
   brew install redis
   ```

3. Start MongoDB and Redis:
   ```bash
   # MongoDB
   sudo systemctl start mongodb   # Ubuntu
   brew services start mongodb-community   # macOS

   # Redis
   sudo systemctl start redis   # Ubuntu
   brew services start redis    # macOS
   ```

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create .env file:
   ```bash
   cp .env.example .env
   ```

4. Update .env with your configuration:
   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/quiz_service
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

5. Seed the database with sample quizzes:
   ```bash
   npm run seed
   ```

6. Start the backend server:
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

The backend server will be running at http://localhost:3000

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create .env file:
   ```bash
   cp .env.example .env
   ```

4. Update .env with your configuration:
   ```env
   VITE_API_URL=http://localhost:3000
   VITE_WS_URL=ws://localhost:3000
   ```

5. Start the frontend development server:
   ```bash
   npm run dev
   ```

The frontend application will be running at http://localhost:5173

## Testing the Application

1. Open http://localhost:5173 in multiple browsers or incognito windows
2. Each window will get a unique anonymous user ID
3. Select a quiz to participate
4. Watch real-time updates as multiple users answer questions

## API Documentation

### Quiz Endpoints

- `GET /api/quizzes` - Get all quizzes
- `GET /api/quizzes/:id` - Get specific quiz
- `POST /api/sessions` - Create new quiz session
- `POST /api/sessions/:sessionId/start` - Start quiz session
- `POST /api/sessions/:sessionId/submit` - Submit answer
- `GET /api/sessions/:sessionId/results` - Get session results

### WebSocket Events

- `join-quiz` - Join a quiz room
- `participants-update` - Real-time participant updates
- `scoreUpdate` - Real-time score updates
- `user-joined` - New participant notification

## Development

### Running Tests
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

### Code Linting
```bash
# Backend linting
cd backend && npm run lint

# Frontend linting
cd frontend && npm run lint
```

### Building for Production
```bash
# Backend build
cd backend && npm run build

# Frontend build
cd frontend && npm run build
```

## Troubleshooting

1. **MongoDB Connection Issues**
   - Verify MongoDB is running: `sudo systemctl status mongodb`
   - Check MongoDB logs: `tail -f /var/log/mongodb/mongodb.log`
   - Ensure correct MongoDB URI in .env

2. **Redis Connection Issues**
   - Verify Redis is running: `redis-cli ping`
   - Check Redis logs: `tail -f /var/log/redis/redis-server.log`
   - Ensure correct Redis configuration in .env

3. **WebSocket Connection Issues**
   - Check browser console for connection errors
   - Verify WebSocket URL in frontend .env
   - Ensure no firewall blocking WebSocket connections

## Architecture Documentation

For detailed information about the system architecture and future scalability plans, please refer to:

- [ARCHITECTURE.md](ARCHITECTURE.md) - Current system architecture
- [SCALABILITY.md](SCALABILITY.md) - Future scalability improvements

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details
