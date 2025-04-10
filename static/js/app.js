document.addEventListener('DOMContentLoaded', function () {
    // Mapping for sections
    const sectionMap = {
      news: 'newsSection',
      saved: 'savedSection',
      about: 'aboutSection',
      contact: 'contactSection',
    };
  
    // Tab buttons
    const tabButtons = {
      news: document.getElementById('newsTab'),
      saved: document.getElementById('savedTab'),
      about: document.getElementById('aboutTab'),
      contact: document.getElementById('contactTab'),
    };
  
    // Setting up event listeners for each tab button
    Object.entries(sectionMap).forEach(([key, sectionId]) => {
      const button = tabButtons[key];
      const section = document.getElementById(sectionId);
  
      if (button && section) {
        button.addEventListener('click', () => {
          document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active', 'text-blue-600', 'border-blue-600');
            btn.classList.add('text-gray-500');
          });
  
          button.classList.add('active', 'text-blue-600', 'border-blue-600');
          button.classList.remove('text-gray-500');
  
          document.querySelectorAll('.content-section').forEach(sec => sec.classList.add('hidden'));
          section.classList.remove('hidden');
  
          toggleSearchBar(key === 'news');
          if (key === 'news') fetchNews();
          if (key === 'saved') renderSavedArticles();
        });
      }
    });
  
    // Function to toggle search bar visibility
    function toggleSearchBar(show = true) {
      const searchBar = document.getElementById('searchBarWrapper');
      if (searchBar) {
        searchBar.classList.toggle('hidden', !show);
      }
    }
  
    // State for tracking current page, query, and sort
    let currentNewsPage = 1;
    let currentQuery = 'India';
    let currentSort = 'newest';
    let savedArticles = JSON.parse(localStorage.getItem('savedArticles') || '[]');
  
    // Event listeners for search button and search input field
    const searchBtn = document.getElementById('searchBtn');
    const searchQuery = document.getElementById('searchQuery');
  
    if (searchBtn && searchQuery) {
      searchBtn.addEventListener('click', performSearch);
      searchQuery.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') performSearch();
      });
    }
  
    // Function to handle search and trigger news fetch
    function performSearch() {
      const query = searchQuery.value.trim() || 'India';
      currentQuery = query;
      fetchNews(1, query, currentSort);
    }
  
    // Event listener for news sort dropdown
    const newsSort = document.getElementById('newsSort');
    if (newsSort) {
      newsSort.addEventListener('change', function () {
        currentSort = this.value;
        fetchNews(1, currentQuery, currentSort);
      });
    }
  
    // Function to fetch news articles
    function fetchNews(page = 1, query = currentQuery, sort = currentSort) {
      const newsLoading = document.getElementById('newsLoading');
      const newsError = document.getElementById('newsError');
      const newsContainer = document.getElementById('newsContainer');
  
      if (newsLoading) newsLoading.classList.remove('hidden');
      if (newsError) newsError.classList.add('hidden');
      if (newsContainer) newsContainer.innerHTML = '';
  
      fetch(`/api/news?page=${page}&q=${encodeURIComponent(query)}&sort=${sort}`)
        .then(response => {
          const contentType = response.headers.get("content-type") || "";
  
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
  
          if (!contentType.includes("application/json")) {
            throw new Error("Server response is not JSON.");
          }
  
          return response.json();
        })
        .then(data => {
          if (data.status === 'ok') {
            displayNews(data.articles || []);
            setupPagination(data.totalPages || 1, page);
            setupSaveButtons();
            updateSaveButtons();
            setupShareButtons();
          } else {
            throw new Error(data.message || 'News fetch failed');
          }
        })
        .catch(err => {
          console.error('Error fetching news:', err.message);
          if (newsError) {
            newsError.textContent = `Error: ${err.message}`;
            newsError.classList.remove('hidden');
          }
        })
        .finally(() => {
          if (newsLoading) newsLoading.classList.add('hidden');
        });
    }
  
    // Function to display news articles
    function displayNews(articles) {
      const container = document.getElementById('newsContainer');
      if (!container) return;
  
      if (articles.length === 0) {
        container.innerHTML = '<p class="text-gray-600 text-center py-8 col-span-3">No articles found.</p>';
        return;
      }
  
      container.innerHTML = '';
      articles.forEach(article => {
        const url = article.url || `no-url-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const card = document.createElement('div');
        card.className = 'news-card bg-white rounded-lg shadow-md overflow-hidden flex flex-col';
  
        const img = article.urlToImage
          ? `<img src="${article.urlToImage}" alt="${article.title}" class="w-full h-48 object-cover" onerror="this.style.display='none'">`
          : `<div class="w-full h-48 bg-gray-200 flex items-center justify-center"><i class="fas fa-newspaper text-4xl text-gray-400"></i></div>`;
  
        card.innerHTML = `
          ${img}
          <div class="p-4 flex-grow flex flex-col">
            <h3 class="font-bold text-lg mb-2 line-clamp-2">${article.title || 'Untitled'}</h3>
            <p class="text-gray-600 text-sm mb-4 line-clamp-3">${article.description || 'No description'}</p>
            <div class="mt-auto">
              <p class="text-gray-500 text-xs">${article.publishedAt} • ${article.source || 'Unknown'}</p>
              <div class="flex justify-between items-center mt-2">
                <a href="${url}" target="_blank" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Read more <i class="fas fa-external-link-alt ml-1"></i>
                </a>
                <div class="flex space-x-2">
                  <button class="save-btn p-2 text-gray-400 hover:text-yellow-500" data-article='${JSON.stringify(article).replace(/'/g, "\\'")}'>
                    <i class="far fa-bookmark"></i>
                  </button>
                  <button class="share-btn p-2 text-gray-400 hover:text-blue-500" data-url="${url}">
                    <i class="fas fa-share-alt"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>`;
        container.appendChild(card);
      });
    }
  
    // Function to set up pagination buttons
    function setupPagination(totalPages, currentPage) {
      const pagination = document.getElementById('newsPagination');
      if (!pagination) return;
  
      pagination.innerHTML = '';
      if (totalPages <= 1) return;
  
      const maxPages = 5;
      let start = Math.max(1, currentPage - Math.floor(maxPages / 2));
      let end = Math.min(totalPages, start + maxPages - 1);
  
      for (let i = start; i <= end; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.className = `px-3 py-1 mx-1 rounded ${i === currentPage ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'}`;
        btn.addEventListener('click', () => fetchNews(i));
        pagination.appendChild(btn);
      }
    }
  
    // Function to set up save buttons
    function setupSaveButtons() {
      document.querySelectorAll('.save-btn').forEach(btn => {
        btn.removeEventListener('click', handleSaveClick);
        btn.addEventListener('click', handleSaveClick);
      });
    }
  
    // Function to handle saving articles
    function handleSaveClick(e) {
      try {
        const article = JSON.parse(this.getAttribute('data-article'));
        if (!article.url) article.url = `no-url-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const exists = savedArticles.some(a => a.url === article.url);
        if (exists) {
          savedArticles = savedArticles.filter(a => a.url !== article.url);
        } else {
          savedArticles.push(article);
        }
        localStorage.setItem('savedArticles', JSON.stringify(savedArticles));
        updateSavedCount();
        renderSavedArticles();
        updateSaveButtons();
      } catch (err) {
        console.error('Save error:', err);
      }
    }
  
    // Function to update save button state
    function updateSaveButtons() {
      document.querySelectorAll('.save-btn').forEach(btn => {
        const article = JSON.parse(btn.getAttribute('data-article'));
        const saved = savedArticles.some(a => a.url === article.url);
        btn.innerHTML = `<i class="${saved ? 'fas text-yellow-500' : 'far'} fa-bookmark"></i>`;
      });
    }
  
    // Function to set up share buttons
    function setupShareButtons() {
      document.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('click', function () {
          const url = this.getAttribute('data-url');
          if (navigator.share) {
            navigator.share({ title: 'Check out this article', url }).catch(console.error);
          } else {
            navigator.clipboard.writeText(url).then(() => alert('Link copied to clipboard!'));
          }
        });
      });
    }
  
    // Function to update the saved count
    function updateSavedCount() {
      const count = document.getElementById('savedCount');
      if (count) count.textContent = savedArticles.length;
    }
  
    // Function to render saved articles
    function renderSavedArticles() {
      const container = document.getElementById('savedContainer');
      const sort = document.getElementById('savedSort')?.value || 'newest';
      container.innerHTML = '';
  
      const list = [...savedArticles];
      if (sort === 'oldest') list.reverse();
  
      if (list.length === 0) {
        container.innerHTML = '<p class="text-gray-600 text-center py-8 col-span-3">No saved articles yet.</p>';
        return;
      }
  
      list.forEach(article => {
        const url = article.url || '#';
        const card = document.createElement('div');
        card.className = 'news-card bg-white rounded-lg shadow-md overflow-hidden flex flex-col';
  
        const image = article.urlToImage
          ? `<img src="${article.urlToImage}" alt="${article.title}" class="w-full h-48 object-cover">`
          : `<div class="w-full h-48 bg-gray-200 flex items-center justify-center"><i class="fas fa-newspaper text-4xl text-gray-400"></i></div>`;
  
        card.innerHTML = `
          ${image}
          <div class="p-4 flex-grow flex flex-col">
            <h3 class="font-bold text-lg mb-2 line-clamp-2">${article.title}</h3>
            <p class="text-gray-600 text-sm mb-4 line-clamp-3">${article.description}</p>
            <div class="mt-auto">
              <p class="text-gray-500 text-xs">${article.publishedAt} • ${article.source}</p>
              <div class="flex justify-between items-center mt-2">
                <a href="${url}" target="_blank" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Read more <i class="fas fa-external-link-alt ml-1"></i>
                </a>
                <div class="flex space-x-2">
                  <button class="remove-saved-btn p-2 text-red-400 hover:text-red-600" data-url="${url}">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>`;
        container.appendChild(card);
      });
  
      document.querySelectorAll('.remove-saved-btn').forEach(btn => {
        btn.addEventListener('click', function () {
          const url = this.getAttribute('data-url');
          savedArticles = savedArticles.filter(a => a.url !== url);
          localStorage.setItem('savedArticles', JSON.stringify(savedArticles));
          updateSavedCount();
          renderSavedArticles();
          updateSaveButtons();
        });
      });
    }


    // Category Button Click
document.querySelectorAll('.category-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.category-btn').forEach(b => {
      b.classList.remove('bg-blue-100', 'text-blue-800');
      b.classList.add('bg-gray-100', 'text-gray-800');
    });
    this.classList.remove('bg-gray-100', 'text-gray-800');
    this.classList.add('bg-blue-100', 'text-blue-800');

    const selected = this.getAttribute('data-category') || 'trending';
    currentQuery = selected;
    fetchNews(1, currentQuery, currentSort);
  });
});

// Header Search
const headerSearchBtn = document.getElementById('headerSearchBtn');
const headerSearchInput = document.getElementById('headerSearch');

if (headerSearchBtn && headerSearchInput) {
  headerSearchBtn.addEventListener('click', () => {
    const value = headerSearchInput.value.trim();
    if (value) {
      currentQuery = value;
      fetchNews(1, currentQuery, currentSort);
    }
  });

  headerSearchInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      const value = headerSearchInput.value.trim();
      if (value) {
        currentQuery = value;
        fetchNews(1, currentQuery, currentSort);
      }
    }
  });
}

  
    // Initial load
    updateSavedCount();
    fetchNews();
  });

  
