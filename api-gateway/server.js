require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 8080;

// Logging setup
app.use(morgan(':method :url -> :req[host] (Status: :status)'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', message: 'API Gateway is running' });
});

// Proxy Options
const proxyOptions = {
    changeOrigin: true,
    on: {
        error: (err, req, res) => {
            console.error(`Proxy Error: ${err.message}`);
            res.status(502).json({
                error: 'Bad Gateway',
                message: 'Target service is unreachable or returned an error.'
            });
        }
    }
};

// Route Configuration
const routes = {
    '/users': process.env.USER_SERVICE_URL || 'http://localhost:3001',
    '/products': process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
    '/orders': process.env.ORDER_SERVICE_URL || 'http://localhost:3003'
};

// Apply Proxies
for (const [path, target] of Object.entries(routes)) {
    app.use(path, createProxyMiddleware({
        ...proxyOptions,
        target,
    }));
}

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
    console.log(`API Gateway is running on port ${PORT}`);
    console.log('Routes configured:');
    for (const [path, target] of Object.entries(routes)) {
        console.log(`  ${path} -> ${target}`);
    }
});
