require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const morgan = require('morgan');

const app = express();

const promBundle = require('express-prom-bundle');
const metricsMiddleware = promBundle({ includeMethod: true, includePath: true, excludeRoutes: ['/health'] });
app.use(metricsMiddleware);
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
    secure: false,
    on: {
        proxyReq: (proxyReq, req, res) => {
            // Strip headers that might cause routing loop detection on Render's Edge
            proxyReq.removeHeader('x-forwarded-for');
            proxyReq.removeHeader('x-forwarded-host');
            proxyReq.removeHeader('x-forwarded-proto');
            proxyReq.removeHeader('x-forwarded-port');
            proxyReq.removeHeader('forwarded');
        },
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
for (const [prefix, target] of Object.entries(routes)) {
    const proxy = createProxyMiddleware({
        ...proxyOptions,
        target,
    });
    app.use((req, res, next) => {
        if (req.path !== prefix && !req.path.startsWith(`${prefix}/`)) return next();
        return proxy(req, res, next);
    });
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
