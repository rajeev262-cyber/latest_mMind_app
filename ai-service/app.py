# MarketMind AI Service - Lightweight Flask API

import os
import json
import random
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)

# Configure CORS for all origins
CORS(app)

def generate_prediction(ticker):
    """Generate realistic mock prediction data"""
    # Use ticker as seed for consistent results
    seed = sum(ord(c) for c in ticker) * 42
    random.seed(seed)
    
    # Generate prediction metrics
    confidence = random.randint(65, 95)
    trend_options = ['Uptrend', 'Downtrend', 'Sideways']
    trend_weights = [0.4, 0.3, 0.3]
    trend = random.choices(trend_options, weights=trend_weights)[0]
    
    risk_options = ['Low', 'Medium', 'High']
    risk_weights = [0.3, 0.4, 0.3]
    risk = random.choices(risk_options, weights=risk_weights)[0]
    
    signal_options = ['Weak', 'Moderate', 'Strong']
    signal_weights = [0.2, 0.5, 0.3]
    signal = random.choices(signal_options, weights=signal_weights)[0]
    
    # Generate buy recommendation based on trend and confidence
    buy = 'Yes' if trend == 'Uptrend' and confidence >= 70 else 'No'
    
    # Generate reason
    reasons = [
        f"Technical analysis shows {trend.lower()} momentum for {ticker}",
        f"Risk assessment indicates {risk.lower()} volatility expected",
        f"AI model confidence: {confidence}% based on historical patterns",
        f"Market sentiment suggests {'positive' if trend == 'Uptrend' else 'negative'} outlook"
    ]
    reason = random.choice(reasons)
    
    return {
        'ticker': ticker,
        'trend': trend,
        'risk': risk,
        'confidence': confidence,
        'buy': buy,
        'signal': signal,
        'reason': reason,
        'timestamp': '2025-01-01T00:00:00Z'
    }

@app.route('/')
def health_check():
    """Root health check endpoint"""
    return jsonify({
        'status': 'MarketMind AI Service running',
        'version': '1.0.0',
        'endpoints': ['/', '/predict']
    })

@app.route('/predict')
def predict_stock():
    """Stock prediction endpoint"""
    ticker = request.args.get('ticker', 'RELIANCE').upper()
    
    if not ticker:
        return jsonify({
            'error': 'Ticker parameter is required'
        }), 400
    
    prediction = generate_prediction(ticker)
    return jsonify(prediction)

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'error': 'Internal server error'
    }), 500

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port)
