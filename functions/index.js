const functions = require('firebase-functions');
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Proxy all /api/* requests to the FastAPI backend running on localhost:8000
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:8000',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api', // keep the /api prefix
  },
  logLevel: 'debug',
}));

// Export the Cloud Function named "api"
exports.api = functions.https.onRequest(app);
