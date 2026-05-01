// routes/stocks.js

const express = require('express');
const router  = express.Router();
const {
  predict, history, analysis, search, portfolio
} = require('../controllers/stockController');

router.get('/predict',   predict);
router.get('/history',   history);
router.get('/analysis',  analysis);
router.get('/search',    search);
router.get('/portfolio', portfolio);

module.exports = router;
