# ThinkSort

## Description
ThinkSort is a DSA tutor application that helps users learn and practice data structures and algorithms through interactive coding and chat interface.

## Features
- User authentication (login/register)
- Conversation management
- Interactive chat with AI assistance
- Code editor with execution capabilities
- Multiple programming language support
- Real-time code execution feedback

## Tech Stack
### Frontend
- React
- Vite

### Backend
- Node.js
- Express
- MongoDB
- JWT Authentication

## Installation

### Prerequisites
- Node.js (v14+)
- MongoDB

### Server Setup
```bash
cd server
npm install
# Create .env file with:
# MONGO_URI=value
# GEMINI_API_KEY=value
# JUDGE0_API_KEY=value
# JUDGE0_API_URL=value
# PORT=value
# JWT_SECRET=value
# RATE_LIMIT_WINDOW_MS=value
# RATE_LIMIT_MAX=value
npm run dev
```

### Client Setup
```bash
cd client
npm install
# Create .env file with:
# VITE_API_URL=value
npm run dev
```

## Deployment
- Backend: Vercel
- Frontend: Vercel