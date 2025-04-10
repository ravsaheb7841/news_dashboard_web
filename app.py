from flask import Flask, render_template, request, jsonify
import requests
from datetime import datetime
from config import NEWS_API_KEY
from news_api import fetch_news_articles

app = Flask(__name__)

# Basic logging to track issues
import logging
logging.basicConfig(level=logging.INFO)

@app.route('/')
def home():
    """Show the homepage."""
    return render_template('index.html')

@app.route('/api/news')
def get_news():
    """Fetch news articles based on user query."""
    page = request.args.get('page', 1, type=int)  # Get page number, default is 1
    query = request.args.get('q', 'India')  # Default search keyword is 'India'
    sort = request.args.get('sort', 'newest')  # Default sorting is 'newest'

    result = fetch_news_articles(page, query, sort)

    if result["status"] == "error":
        return jsonify({"status": "error", "message": result["message"]}), 500

    return jsonify({
        "status": "ok",
        "articles": result["articles"],
        "totalPages": result.get("totalPages", 1)
    })


if __name__ == '__main__':
    app.run(debug=True)
