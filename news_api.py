import requests
from datetime import datetime, timedelta
from config import NEWS_API_KEY

def fetch_news_articles(page=1, query="India", sort="newest"):
    """
    Fetches news articles from News API.
    Returns articles in a simple format with error handling.
    """
    # Get current date and 3 days ago
    today = datetime.utcnow()
    three_days_ago = today - timedelta(days=3)

    # API request parameters
    params = {
        "apiKey": NEWS_API_KEY,
        "page": page,
        "pageSize": 9,  # Show 9 articles per page
        "q": query,  # Search keyword
        "from": three_days_ago.strftime('%Y-%m-%d'),
        "to": today.strftime('%Y-%m-%d'),
        "sortBy": "publishedAt" if sort == "newest" else "relevancy",
        "language": "en",
        "domains": "bbc.co.uk,cnn.com,ndtv.com,aljazeera.com,thehindu.com"  # Trusted sources
    }

    try:
        # Send request to News API
        response = requests.get("https://newsapi.org/v2/everything", params=params, timeout=10)
        response.raise_for_status()  # Raise error if request fails
        data = response.json()

        if data.get("status") != "ok":
            return {"status": "error", "message": data.get("message", "API error"), "articles": [], "totalPages": 0}

        # Format news articles
        articles = []
        for article in data.get("articles", []):
            articles.append({
                "title": article.get("title", "No title available").strip(),
                "description": article.get("description", "No description available")[:150] + "...",
                "url": article.get("url", "#"),
                "urlToImage": article.get("urlToImage", "/static/images/news-placeholder.jpg"),
                "publishedAt": format_date(article.get("publishedAt", "")),
                "source": article.get("source", {}).get("name", "Unknown Source")
            })

        # Limit total pages to prevent too many requests
        total_pages = min((data.get("totalResults", 0) // params["pageSize"]) + 1, 5)

        return {"status": "ok", "articles": articles, "totalPages": total_pages}

    except requests.exceptions.RequestException as e:
        return {"status": "error", "message": f"Network error: {str(e)}", "articles": [], "totalPages": 0}

def format_date(date_str):
    """Convert date to a readable format."""
    try:
        return datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%SZ").strftime("%b %d, %Y %I:%M %p")
    except (ValueError, TypeError):
        return "Unknown date"
