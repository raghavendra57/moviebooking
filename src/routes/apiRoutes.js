const express = require('express');
const router = express.Router();

const store = require('../models/store');
const seatService = require('../services/seatService');
const bookingService = require('../services/bookingService');
const analyticsService = require('../services/analyticsService');
const bookingController = require('../controllers/bookingController');

// API Health Check
router.get('/health', (req, res) => {
    res.json({
        status: 'online',
        service: 'CineVerse Pro API',
        version: '2.0.0',
        timestamp: new Date().toISOString()
    });
});

// Movies API
router.get('/movies', (req, res) => {
    const movies = store.getMovies();
    res.json({ success: true, count: movies.length, data: movies });
});

router.get('/movies/:id', (req, res) => {
    const movie = store.getMovieById(req.params.id);
    if (!movie) return res.status(404).json({ success: false, error: 'Movie not found' });
    res.json({ success: true, data: movie });
});

// Shows API
router.get('/shows', (req, res) => {
    const { movieId } = req.query;
    const shows = movieId ? store.getShowsByMovieId(movieId) : store.getShows();
    res.json({ success: true, count: shows.length, data: shows });
});

// Seat Layout & Status API
router.get('/shows/:showId/seats', (req, res) => {
    const show = store.getShowById(req.params.showId);
    if (!show) return res.status(404).json({ success: false, error: 'Show not found' });
    const seatData = seatService.getSeatLayout(show.id, show.basePrice);
    res.json({ success: true, data: seatData });
});

// Coupons API
router.get('/coupons', (req, res) => {
    res.json({ success: true, data: store.getCoupons() });
});

// Snacks API
router.get('/snacks', (req, res) => {
    res.json({ success: true, data: store.getSnacks() });
});

// Concurrency & Seat Locking API
router.post('/lock-seats', bookingController.postLockSeats);
router.post('/release-seats', bookingController.postReleaseSeats);

// Promo Discount Validation API
router.post('/apply-coupon', bookingController.postApplyCoupon);

// Payment & Confirmation API
router.post('/process-payment', bookingController.postProcessPayment);

// Ticket PDF Download Stream API
router.get('/download-ticket/:bookingId', bookingController.downloadTicketPdf);

// Analytics Metrics API
router.get('/analytics', (req, res) => {
    const metrics = analyticsService.getDashboardMetrics();
    res.json({ success: true, data: metrics });
});

module.exports = router;

