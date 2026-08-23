require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');

// Import Services & Real-time Engine
const websocketService = require('./services/websocketService');

// Import Routes
const webRoutes = require('./routes/webRoutes');
const adminRoutes = require('./routes/adminRoutes');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Session Configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'cineverse-pro-super-secret-key-2026',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: isProduction,
        httpOnly: true,
        maxAge: 60 * 60 * 1000 // 1 hour session
    }
}));

// Body Parsing Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve Static Assets
app.use(express.static(path.join(__dirname, '../public')));

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Initialize WebSocket Real-Time Engine
websocketService.initialize(server);

// Request Logger (Lightweight)
app.use((req, res, next) => {
    if (!req.url.startsWith('/css') && !req.url.startsWith('/js') && !req.url.startsWith('/images')) {
        console.log(`[${new Date().toISOString().slice(11, 19)}] ${req.method} ${req.url}`);
    }
    next();
});

// Mount Routes
app.use('/admin', adminRoutes);
app.use('/api/v1', apiRoutes);
app.use('/', webRoutes);

// 404 Page Not Found Handler
app.use((req, res) => {
    res.status(404).render('error', {
        title: 'Page Not Found',
        error: 'The requested cinema page or showtime does not exist.'
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('❌ Server Internal Error:', err);
    res.status(500).render('error', {
        title: 'Application Error',
        error: 'Something went wrong while processing your request. Please try again.'
    });
});

// Start Server
if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`🚀 CineVerse Pro Server listening on http://localhost:${PORT}`);
        console.log(`🔌 WebSocket engine running on ws://localhost:${PORT}/ws`);
        console.log(`📊 Admin Portal: http://localhost:${PORT}/admin`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`❌ Port ${PORT} is in use. Attempting fallback...`);
            server.listen(0);
        } else {
            console.error('Server error:', err);
        }
    });
}

module.exports = app;
module.exports.app = app;
module.exports.server = server;