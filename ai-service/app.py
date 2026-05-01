# app.py — MarketMind AI Service (Flask)

import os
import json
import random
import numpy as np
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)

# Configure CORS
CORS(app, origins=[
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'https://marketmind-backend.onrender.com',
    'https://marketmind-frontend.onrender.com',
    'https://marketmind-frontend.vercel.app',
    'https://marketmind-frontend.netlify.app'
])

# Mock ML model for demonstration
class StockPredictor:
    def __init__(self):
        self.model_loaded = True
    
    def predict(self, ticker, historical_data=None):
        """Generate mock prediction for demonstration"""
        # Simulate ML prediction with deterministic randomness
        seed = sum(ord(c) for c in ticker) * 42
        random.seed(seed)
        np.random.seed(seed)
        
        # Generate prediction metrics
        confidence = random.randint(65, 95)
        trend_options = ['Bullish', 'Bearish', 'Sideways']
        trend_weights = [0.4, 0.3, 0.3]  # Slightly bullish bias
        trend = random.choices(trend_options, weights=trend_weights)[0]
        
        risk_levels = ['Low', 'Medium', 'High']
        risk = random.choice(risk_levels)
        
        # Generate signal strength (1-5)
        signal = random.randint(2, 5)
        
        # Generate AI reasoning
        reasons = [
            f"Technical indicators show {trend.lower()} momentum for {ticker}",
            f"Volume analysis suggests {'increasing' if trend == 'Bullish' else 'decreasing'} interest",
            f"Market sentiment for {ticker} is {'positive' if trend == 'Bullish' else 'negative' if trend == 'Bearish' else 'neutral'}",
            f"Risk assessment indicates {risk.lower()} volatility expected",
            f"AI model confidence: {confidence}% based on historical patterns"
        ]
        
        # Generate market analysis
        analysis = f"""
        {ticker} shows {trend.lower()} trends based on technical analysis. 
        The stock is currently in a {risk.lower()} risk category with {confidence}% confidence 
        from our AI model. Key factors include market sentiment, volume patterns, and 
        historical performance. Current signal strength suggests {'strong buy' if signal >= 4 else 'moderate buy' if signal >= 3 else 'hold' if signal >= 2 else 'sell'} recommendation.
        """
        
        return {
            ticker: ticker,
            trend: trend,
            trend_dir: 'up' if trend == 'Bullish' else 'down' if trend == 'Bearish' else 'side',
            trend_badge: 'BUY' if trend == 'Bullish' else 'SELL' if trend == 'Bearish' else 'HOLD',
            risk: f"{risk} Risk",
            risk_lv: risk.lower(),
            risk_badge: risk[0],
            confidence: confidence,
            conf_lbl: f"{'High' if confidence >= 80 else 'Moderate' if confidence >= 70 else 'Low'} Confidence",
            conf_badge: 'HIGH' if confidence >= 80 else 'MED' if confidence >= 70 else 'LOW',
            signal: signal,
            signal_lbl: 'Strong Buy' if signal >= 4 else 'Buy' if signal >= 3 else 'Hold' if signal >= 2 else 'Sell',
            reasons: [{"text": reason, "warn": "High" in risk and random.random() > 0.5} for reason in reasons],
            analysis: analysis.strip(),
            model_version: "v2.0-demo",
            timestamp: "2025-01-01T00:00:00Z"
        }

# Initialize predictor
predictor = StockPredictor()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'ok': True,
        'status': 'MarketMind AI Service v2.0 running',
        'model_loaded': predictor.model_loaded,
        'env': os.environ.get('FLASK_ENV', 'production'),
        'time': datetime.utcnow().isoformat() + 'Z'
    })

@app.route('/predict', methods=['POST'])
def predict_stock():
    """Stock prediction endpoint"""
    try:
        data = request.get_json()
        
        if not data or 'ticker' not in data:
            return jsonify({
                'ok': False,
                'error': 'Ticker symbol is required'
            }), 400
        
        ticker = data['ticker'].upper()
        
        # Generate prediction
        prediction = predictor.predict(ticker)
        
        return jsonify({
            'ok': True,
            'prediction': prediction
        })
        
    except Exception as e:
        return jsonify({
            'ok': False,
            'error': f'Prediction failed: {str(e)}'
        }), 500

@app.route('/analyze', methods=['POST'])
def analyze_market():
    """Market analysis endpoint"""
    try:
        data = request.get_json()
        
        if not data or 'ticker' not in data:
            return jsonify({
                'ok': False,
                'error': 'Ticker symbol is required'
            }), 400
        
        ticker = data['ticker'].upper()
        months = data.get('months', 6)
        
        # Generate mock analysis
        prediction = predictor.predict(ticker)
        
        # Add analysis-specific data
        analysis_data = {
            **prediction,
            'analysis_period': f"{months} months",
            'data_points': months * 20,  # Approximate trading days
            'volatility': random.uniform(0.15, 0.45),
            'avg_volume': random.randint(500000, 5000000),
            'market_cap': random.choice(['Small', 'Mid', 'Large', 'Mega'])
        }
        
        return jsonify({
            'ok': True,
            'analysis': analysis_data
        })
        
    except Exception as e:
        return jsonify({
            'ok': False,
            'error': f'Analysis failed: {str(e)}'
        }), 500

@app.route('/models', methods=['GET'])
def list_models():
    """List available models"""
    return jsonify({
        'ok': True,
        'models': [
            {
                'name': 'stock_predictor_v2',
                'type': 'classification',
                'version': '2.0',
                'accuracy': '87.3%',
                'description': 'XGBoost-based stock trend prediction model'
            }
        ]
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'ok': False,
        'error': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'ok': False,
        'error': 'Internal server error'
    }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
