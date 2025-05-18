# AI Social - Twitter/X Community Engagement Bot Backend
# Solution for Hack-celerate 2025 challenge

from flask import Flask, jsonify, request, abort
from flask_cors import CORS
import os
import json
import openai
from dotenv import load_dotenv
import logging
from datetime import datetime
import random
import uuid
from collections import defaultdict

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Set API key from environment variable
openai.api_key = os.getenv('OPENAI_API_KEY')
if not openai.api_key:
    logger.warning("OpenAI API key not found - AI responses will not work!")

# Data Storage
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
os.makedirs(DATA_DIR, exist_ok=True)

SETTINGS_FILE = os.path.join(DATA_DIR, 'brand_settings.json')
TWEETS_FILE = os.path.join(DATA_DIR, 'tweets.json')
REPLIES_FILE = os.path.join(DATA_DIR, 'replies.json')
FEEDBACK_FILE = os.path.join(DATA_DIR, 'feedback.json')

# In-memory data store
brand_settings = {}
replies_history = []
feedback_data = []

# Load data from files if they exist
def load_data():
    global brand_settings, replies_history, feedback_data, mock_tweets
    
    # Load brand settings
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, 'r') as f:
                brand_settings = json.load(f)
                logger.info(f"Loaded brand settings: {brand_settings['brandName'] if 'brandName' in brand_settings else 'Unknown'}")
        except Exception as e:
            logger.error(f"Error loading brand settings: {str(e)}")
    
    # Load tweets
    if os.path.exists(TWEETS_FILE):
        try:
            with open(TWEETS_FILE, 'r') as f:
                mock_tweets = json.load(f)
                logger.info(f"Loaded {len(mock_tweets)} tweets")
        except Exception as e:
            logger.error(f"Error loading tweets: {str(e)}")
    
    # Load replies
    if os.path.exists(REPLIES_FILE):
        try:
            with open(REPLIES_FILE, 'r') as f:
                replies_history = json.load(f)
                logger.info(f"Loaded {len(replies_history)} replies")
        except Exception as e:
            logger.error(f"Error loading replies: {str(e)}")
    
    # Load feedback
    if os.path.exists(FEEDBACK_FILE):
        try:
            with open(FEEDBACK_FILE, 'r') as f:
                feedback_data = json.load(f)
                logger.info(f"Loaded {len(feedback_data)} feedback entries")
        except Exception as e:
            logger.error(f"Error loading feedback: {str(e)}")

# Save data to files
def save_brand_settings():
    try:
        with open(SETTINGS_FILE, 'w') as f:
            json.dump(brand_settings, f, indent=2)
        logger.info("Saved brand settings")
    except Exception as e:
        logger.error(f"Error saving brand settings: {str(e)}")

def save_tweets():
    try:
        with open(TWEETS_FILE, 'w') as f:
            json.dump(mock_tweets, f, indent=2)
        logger.info(f"Saved {len(mock_tweets)} tweets")
    except Exception as e:
        logger.error(f"Error saving tweets: {str(e)}")

def save_replies():
    try:
        with open(REPLIES_FILE, 'w') as f:
            json.dump(replies_history, f, indent=2)
        logger.info(f"Saved {len(replies_history)} replies")
    except Exception as e:
        logger.error(f"Error saving replies: {str(e)}")

def save_feedback():
    try:
        with open(FEEDBACK_FILE, 'w') as f:
            json.dump(feedback_data, f, indent=2)
        logger.info(f"Saved {len(feedback_data)} feedback entries")
    except Exception as e:
        logger.error(f"Error saving feedback: {str(e)}")

# Default mock tweets if no saved data exists
mock_tweets = [
    {
        "id": "001",
        "username": "@techlover",
        "text": "Hey @brand, loving your new app design! So clean 👏",
        "timestamp": "2025-05-17T10:12:00Z",
        "sentiment": "positive",
        "thread": []
    },
    {
        "id": "002",
        "username": "@customer123",
        "text": "@brand My order still hasn't arrived. What's going on?",
        "timestamp": "2025-05-17T11:45:00Z",
        "sentiment": "negative",
        "thread": []
    },
    {
        "id": "003",
        "username": "@techreporter",
        "text": "Interesting developments from @brand this quarter. Would love to get a statement for my article.",
        "timestamp": "2025-05-17T14:22:00Z",
        "sentiment": "neutral",
        "thread": []
    },
    {
        "id": "004",
        "username": "@angryuser42",
        "text": "@brand your customer service is a joke! Been waiting 2 hours on hold and still no help with my account issue! 😡",
        "timestamp": "2025-05-17T16:05:00Z",
        "sentiment": "negative",
        "thread": []
    },
    {
        "id": "005",
        "username": "@influencer_amy",
        "text": "Just got my hands on @brand's latest product and I'm OBSESSED! Can't wait to show you all the features in my next video 🤩",
        "timestamp": "2025-05-18T09:15:00Z",
        "sentiment": "positive",
        "thread": []
    },
    {
        "id": "006",
        "username": "@curious_george",
        "text": "@brand Is your platform compatible with the new MacOS update? Been having some issues since I upgraded.",
        "timestamp": "2025-05-18T10:32:00Z",
        "sentiment": "neutral",
        "thread": []
    }
]

# Load existing data at startup
load_data()

def generate_ai_reply(tweet_text, brand_settings=None, tone="Friendly"):
    try:
        # Updated OpenAI client usage pattern
        client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        
        # Default brand info if none provided
        brand_name = brand_settings.get('brandName', 'our brand') if brand_settings else 'our brand'
        industry = brand_settings.get('industry', 'Technology') if brand_settings else 'Technology'
        keywords = brand_settings.get('keywords', []) if brand_settings else []
        
        # Create a more detailed system prompt based on brand settings
        system_prompt = f"""You are an AI social media manager for {brand_name}, a company in the {industry} industry.
        Your task is to respond to tweets in a way that:
        1. Reflects the brand's voice and values
        2. Addresses the user's specific question or comment
        3. Is empathetic and personable
        4. Is concise (under 280 characters)
        5. Uses a {tone} tone
        """
        
        # Add keywords to monitor if available
        if keywords:
            keyword_str = ', '.join(keywords)
            system_prompt += f"\nPay special attention to these keywords that are important to our brand: {keyword_str}"
        
        user_prompt = f"""A Twitter user posted the following tweet:
        "{tweet_text}"

        Please craft a response in a {tone.lower()} tone that addresses their message and represents {brand_name} well.
        """
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",  # Using 3.5-turbo as a more widely available model
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=150,
            temperature=0.7  # Slightly more creative responses
        )
        
        # Parse the result and return
        ai_reply = response.choices[0].message.content.strip()
        
        # Log this for learning
        logger.info(f"Generated reply with tone '{tone}' for tweet: {tweet_text[:50]}...")
        
        return ai_reply
    except Exception as e:
        logger.error(f"Error generating AI reply: {str(e)}")
        return f"I apologize, but I'm unable to generate a response at this time. Please try again later."

# Function to detect sentiment using AI
def detect_sentiment(text):
    try:
        client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        
        prompt = f"""Analyze the sentiment of this tweet and classify it as one of: positive, negative, neutral, or urgent.
        Tweet: "{text}"
        
        Only respond with one word: positive, negative, neutral, or urgent.
        """
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a sentiment analysis tool that only responds with a single word."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=20,
            temperature=0.3  # More deterministic for classification
        )
        
        sentiment = response.choices[0].message.content.strip().lower()
        
        # Ensure sentiment is one of our expected values
        valid_sentiments = ['positive', 'negative', 'neutral', 'urgent']
        if sentiment not in valid_sentiments:
            for valid in valid_sentiments:
                if valid in sentiment:
                    sentiment = valid
                    break
            else:
                sentiment = 'neutral'  # Default fallback
        
        return sentiment
    except Exception as e:
        logger.error(f"Error detecting sentiment: {str(e)}")
        return 'neutral'  # Default to neutral on error

@app.route("/api/tweets", methods=["GET"])
def get_mock_tweets():
    try:
        # Return in the format expected by the frontend
        return jsonify({
            "tweets": mock_tweets,
            "total": len(mock_tweets),
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error fetching tweets: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/tweets/<tweet_id>", methods=["GET"])
def get_single_tweet(tweet_id):
    try:
        tweet = next((t for t in mock_tweets if t["id"] == tweet_id), None)
        if not tweet:
            return jsonify({"error": "Tweet not found"}), 404
        return jsonify(tweet)
    except Exception as e:
        logger.error(f"Error fetching tweet {tweet_id}: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/tweets/<tweet_id>/thread", methods=["POST"])
def add_reply_to_thread(tweet_id):
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No reply data provided"}), 400
            
        tweet = next((t for t in mock_tweets if t["id"] == tweet_id), None)
        if not tweet:
            return jsonify({"error": "Tweet not found"}), 404
            
        # Create a standardized reply structure
        reply_data = {
            "username": data.get("username", "@brand_support"),
            "text": data.get("text", ""),
            "timestamp": data.get("timestamp", datetime.now().isoformat()),
            "auto_generated": data.get("auto_generated", False)
        }
        
        if not reply_data["text"]:
            return jsonify({"error": "Reply text cannot be empty"}), 400
            
        # Add to the tweet's thread
        tweet["thread"].append(reply_data)
        
        # Save to reply history
        reply_history_entry = {
            "tweet_id": tweet_id,
            "tweet_text": tweet["text"],
            "reply": reply_data["text"],
            "timestamp": reply_data["timestamp"],
            "auto_generated": reply_data["auto_generated"]
        }
        replies_history.append(reply_history_entry)
        
        # Save changes
        save_tweets()
        save_replies()
        
        logger.info(f"Added reply to tweet {tweet_id}")
        return jsonify(tweet)
    except Exception as e:
        logger.error(f"Error adding reply to tweet {tweet_id}: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/generate-reply", methods=["POST"])
def reply_to_tweet():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        tweet_id = data.get("tweet_id")
        tweet_text = data.get("tweet_text")
        tone = data.get("tone", "Friendly")
        
        # Get the tweet text either from ID or directly provided
        if tweet_id:
            tweet = next((t for t in mock_tweets if t["id"] == tweet_id), None)
            if not tweet:
                return jsonify({"error": "Tweet not found"}), 404
            tweet_text = tweet["text"]
        elif not tweet_text:
            return jsonify({"error": "Missing tweet_id or tweet_text"}), 400
            
        # Generate the reply using AI
        reply = generate_ai_reply(tweet_text, brand_settings, tone)
        
        logger.info(f"Generated reply for tweet {tweet_id if tweet_id else 'with custom text'}")
        return jsonify({
            "reply": reply,
            "status": "success",
            "timestamp": datetime.now().isoformat()
        })
            
    except Exception as e:
        logger.error(f"Error generating reply: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/brand-settings", methods=["GET"])
def get_brand_settings():
    try:
        return jsonify(brand_settings)
    except Exception as e:
        logger.error(f"Error getting brand settings: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/brand-settings", methods=["POST"])
def update_brand_settings():
    try:
        global brand_settings
        data = request.json
        if not data:
            return jsonify({"error": "No settings data provided"}), 400
            
        # Update brand settings
        brand_settings = data
        
        # Save to file
        save_brand_settings()
        
        logger.info(f"Updated brand settings for {brand_settings.get('brandName', 'Unknown')}")
        return jsonify({
            "message": "Brand settings updated successfully",
            "settings": brand_settings,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error updating brand settings: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/replies", methods=["GET"])
def get_reply_history():
    try:
        return jsonify(replies_history)
    except Exception as e:
        logger.error(f"Error fetching reply history: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/feedback", methods=["POST"])
def record_feedback():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No feedback data provided"}), 400
            
        # Add timestamp if not provided
        if 'timestamp' not in data:
            data['timestamp'] = datetime.now().isoformat()
            
        # Add to feedback history
        feedback_data.append(data)
        
        # Save feedback
        save_feedback()
        
        # Log the feedback data for analysis
        logger.info(f"Feedback received: {data}")
        
        return jsonify({
            "message": "Feedback recorded successfully",
            "status": "success",
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error recording feedback: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Route to simulate new tweets coming in (for demo purposes)
@app.route("/api/simulate-new-tweet", methods=["POST"])
def simulate_new_tweet():
    try:
        data = request.json
        custom_tweet = data.get("tweet_text", "")
        username = data.get("username", f"@user{random.randint(1000, 9999)}")
        
        if not custom_tweet:
            # Use a random template if no custom tweet provided
            templates = [
                "Hey @brand, love your product but having an issue with {feature}. Any tips?",
                "@brand Just bought your new {product} and it's amazing! One question though...",
                "Not happy with my recent @brand purchase. The {issue} is really disappointing.",
                "Can someone from @brand help me? Having trouble with my account.",
                "Thinking about trying @brand's services. How does it compare to {competitor}?",
                "@brand your customer service team deserves a raise! Thanks for solving my problem so quickly."
            ]
            
            features = ['login', 'checkout', 'mobile app', 'search function', 'notifications']
            products = ['premium subscription', 'starter kit', 'pro package', 'basic plan', 'enterprise solution']
            issues = ['shipping delay', 'quality', 'missing parts', 'billing error', 'customer service']
            competitors = ['CompetitorX', 'RivalCorp', 'AlternateBrand', 'OtherService', 'MarketLeader']
            
            template = random.choice(templates)
            
            if '{feature}' in template:
                custom_tweet = template.replace('{feature}', random.choice(features))
            elif '{product}' in template:
                custom_tweet = template.replace('{product}', random.choice(products))
            elif '{issue}' in template:
                custom_tweet = template.replace('{issue}', random.choice(issues))
            elif '{competitor}' in template:
                custom_tweet = template.replace('{competitor}', random.choice(competitors))
            else:
                custom_tweet = template
        
        # Detect sentiment with AI
        sentiment = detect_sentiment(custom_tweet)
        
        # Create a new tweet
        new_tweet = {
            "id": str(uuid.uuid4())[:8],  # Use first 8 chars of a UUID
            "username": username,
            "text": custom_tweet,
            "timestamp": datetime.now().isoformat(),
            "sentiment": sentiment,
            "thread": []
        }
        
        # Add to tweets
        mock_tweets.append(new_tweet)
        
        # Save changes
        save_tweets()
        
        logger.info(f"Simulated new tweet from {username}")
        return jsonify({
            "message": "New tweet created successfully",
            "tweet": new_tweet
        })
    except Exception as e:
        logger.error(f"Error simulating new tweet: {str(e)}")
        return jsonify({"error": str(e)}), 500

# API route for health check
@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "api_version": "1.0.0",
        "openai_configured": bool(openai.api_key),
        "timestamp": datetime.now().isoformat()
    })

if __name__ == "__main__":
    # Try to use port 5000 by default, but allow environment override
    port = int(os.getenv('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
