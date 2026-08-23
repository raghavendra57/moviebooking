const express = require('express');
const router = express.Router();

const movieController = require('../controllers/movieController');
const bookingController = require('../controllers/bookingController');
const userController = require('../controllers/userController');

// Home & Catalog
router.get('/', movieController.getHomePage);
router.get('/movie/:id', movieController.getMovieDetails);

// Booking & Seating
router.get('/book', bookingController.getSeatBookingPage);
router.post('/lock-seats', bookingController.postLockSeats);
router.post('/release-seats', bookingController.postReleaseSeats);
router.post('/prepare-checkout', bookingController.postPrepareCheckout);

// Checkout & Payment
router.get('/checkout', bookingController.getCheckoutPage);
router.post('/apply-coupon', bookingController.postApplyCoupon);
router.post('/process-payment', bookingController.postProcessPayment);
router.get('/success', bookingController.getSuccessPage);

// E-Pass & PDF Ticket
router.get('/ticket/:id', bookingController.getDigitalTicketPage);
router.get('/download-ticket/:bookingId', bookingController.downloadTicketPdf);

// User Profile & Dashboard
router.get('/dashboard', userController.getDashboard);
router.post('/cancel-booking/:id', userController.postCancelBooking);

// Backward Compatibility Aliases
router.get('/payment', bookingController.getCheckoutPage);
router.post('/payment-preview-success', bookingController.postProcessPayment);

module.exports = router;
