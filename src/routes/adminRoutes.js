const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');

// Admin Analytics Dashboard
router.get('/', adminController.getAdminDashboard);
router.get('/dashboard', adminController.getAdminDashboard);

// Movie Management
router.get('/movies', adminController.getAdminMovies);
router.post('/movies/add', adminController.postAddMovie);
router.post('/movies/delete/:id', adminController.postDeleteMovie);

// Bookings & Reports
router.get('/bookings', adminController.getAdminBookings);
router.get('/export/csv', adminController.exportBookingsCsv);

module.exports = router;
