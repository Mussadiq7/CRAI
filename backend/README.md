# ConnexAI Backend

This directory contains the Flask backend API for the ConnexAI social media reply generator.

## Setup

1. Create a virtual environment (recommended):
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Create a `.env` file based on `.env.example` with your OpenAI API key

4. Run the application:
   ```
   python app.py
   ```

## API Endpoints

- `GET /api/health`: Health check endpoint
- `GET /api/tweets`: Get all tweets
- `GET /api/tweets/:id`: Get a specific tweet
- `POST /api/tweets/:id/thread`: Add a reply to a tweet thread
- `POST /api/generate-reply`: Generate an AI reply for a tweet
- `GET /api/brand-settings`: Get brand settings
- `POST /api/brand-settings`: Update brand settings
- `POST /api/feedback`: Submit feedback on AI-generated replies

## Data Storage

The application stores data in JSON files in the `data/` directory:
- `brand_settings.json`: Brand configuration
- `tweets.json`: Sample tweet data
- `replies.json`: History of replies
- `feedback.json`: User feedback on AI-generated replies
