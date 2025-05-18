# C.R.A.I

A tool for generating intelligent, context-aware replies to social media posts using AI. This project was developed for the Hack-celerate 2025 challenge.

## Project Overview

C.R.A.I is a web application that helps brands manage their social media presence by automatically generating appropriate replies to tweets/posts. The application consists of:

- **React Frontend**: User interface for viewing tweets, generating AI replies, and providing feedback
- **Flask Backend**: API server that processes requests, interacts with the OpenAI API, and maintains data persistence

## Features

- View incoming social media mentions and posts
- Generate AI-powered replies using OpenAI
- Customize response tone (Friendly, Professional, Witty, etc.)
- Edit AI-generated replies before sending
- Provide feedback on AI responses to improve future generations
- Configure brand settings and voice

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn
- Python (v3.8+)
- OpenAI API key

### Installation

#### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create a virtual environment (optional but recommended):
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Create a `.env` file based on `.env.example` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   PORT=5000
   DEBUG=True
   ```

5. Start the backend server:
   ```
   python app.py
   ```
   The server will run on http://localhost:5000

#### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   # or
   yarn
   ```

3. Start the development server:
   ```
   npm start
   # or
   yarn start
   ```
   The application will open in your browser at http://localhost:3000

## Project Structure

```
├── backend/                # Flask backend API
│   ├── app.py             # Main Flask application
│   ├── requirements.txt   # Python dependencies
│   ├── .env              # Environment variables (not in repo)
│   └── data/              # Data storage directory
│
├── frontend/              # React frontend application
│   ├── public/            # Static files
│   ├── src/               # Source code
│   │   ├── components/    # React components
│   │   ├── App.js         # Main application component
│   │   └── index.js       # Entry point
│   ├── package.json       # Frontend dependencies
│   └── tailwind.config.js # Tailwind CSS configuration
```

## Development

### Backend API Endpoints

- `GET /api/health`: Health check endpoint
- `GET /api/tweets`: Get all tweets
- `GET /api/tweets/:id`: Get a specific tweet
- `POST /api/tweets/:id/thread`: Add a reply to a tweet thread
- `POST /api/generate-reply`: Generate an AI reply for a tweet
- `GET /api/brand-settings`: Get brand settings
- `POST /api/brand-settings`: Update brand settings
- `POST /api/feedback`: Submit feedback on AI-generated replies

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built for Hack-celerate 2025
- Powered by OpenAI's GPT models
