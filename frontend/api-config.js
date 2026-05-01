// MarketMind API Configuration
// Centralized configuration for all deployed services

const API_CONFIG = {
  // Production URLs (Render deployment)
  BACKEND_URL: "https://marketmind-backend-w8gx.onrender.com",
  AI_SERVICE_URL: "https://marketmind-ai-pd7o.onrender.com",
  FRONTEND_URL: "https://frontend-mmind-app.onrender.com",
  
  // API Endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: "/auth/login",
      REGISTER: "/auth/register"
    },
    STOCKS: {
      PREDICT: "/stocks/predict",
      HISTORY: "/stocks/history",
      ANALYSIS: "/stocks/analysis",
      SEARCH: "/stocks/search",
      PORTFOLIO: "/stocks/portfolio"
    },
    NEWS: {
      FEED: "/news",
      CATEGORIES: "/news/categories"
    }
  },
  
  // Get full API URL for endpoint
  getApiUrl: function(endpoint) {
    return this.BACKEND_URL + endpoint;
  },
  
  // Get AI service URL for endpoint
  getAiUrl: function(endpoint) {
    return this.AI_SERVICE_URL + endpoint;
  },
  
  // Common headers for API requests
  getHeaders: function() {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  },
  
  // Enhanced fetch with error handling
  async fetchWithErrorHandling(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = API_CONFIG;
} else {
  window.API_CONFIG = API_CONFIG;
}
