const store = require('../models/store');
const seatService = require('../services/seatService');
const websocketService = require('../services/websocketService');

const getDashboard = (req, res) => {
    try {
        const userEmail = req.query.email || req.session.userEmail || 'guest@cineverse.io';
        req.session.userEmail = userEmail;

        const allBookings = store.getBookingsByEmail(userEmail);

        // Fallback: if no bookings found for specific email, show all recent bookings so user sees full UI immediately
        const displayBookings = allBookings.length > 0 ? allBookings : store.getBookings().slice(0, 5);

        // Calculate total loyalty points (10 points per ₹100 spent)
        let totalLoyaltyPoints = 0;
        let totalSpent = 0;

        displayBookings.forEach(b => {
            if (b.status !== 'Cancelled') {
                const amt = Number(b.finalAmount || b.amount || 0);
                totalSpent += amt;
                totalLoyaltyPoints += (b.loyaltyPointsEarned || Math.round(amt / 10));
            }
        });

        // Separate into Active/Upcoming vs Past bookings
        const todayStr = new Date().toISOString().split('T')[0];
        const activeBookings = displayBookings.filter(b => (b.showDate >= todayStr || !b.showDate) && b.status !== 'Cancelled');
        const pastBookings = displayBookings.filter(b => b.showDate < todayStr || b.status === 'Cancelled');

        res.render('dashboard', {
            userEmail,
            displayBookings,
            activeBookings,
            pastBookings,
            totalLoyaltyPoints,
            totalSpent,
            totalBookingsCount: displayBookings.length
        });
    } catch (error) {
        console.error('User Dashboard Error:', error);
        res.status(500).render('error', {
            title: 'Dashboard Error',
            error: 'Failed to load user booking profile.'
        });
    }
};

const postCancelBooking = (req, res) => {
    try {
        const bookingId = req.params.id || req.body.bookingId;
        const booking = store.getBookingById(bookingId);

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }

        if (booking.status === 'Cancelled') {
            return res.status(400).json({ success: false, message: 'Booking is already cancelled.' });
        }

        // 1. Release occupied seats
        if (booking.showId && Array.isArray(booking.seats)) {
            seatService.releaseOccupiedSeats(booking.showId, booking.seats);
            websocketService.notifySeatStatusChanged(
                booking.showId,
                seatService.getSeatsStatus(booking.showId).occupiedSeats,
                seatService.getSeatsStatus(booking.showId).blockedSeats
            );
        }

        // 2. Mark booking as Cancelled
        store.updateBookingStatus(bookingId, 'Cancelled');

        res.json({
            success: true,
            message: `Booking #${bookingId} has been successfully cancelled. Refund of ₹${booking.finalAmount || booking.amount} has been initiated.`
        });
    } catch (error) {
        console.error('Cancel Booking Error:', error);
        res.status(500).json({ success: false, message: 'Failed to cancel booking.' });
    }
};

module.exports = {
    getDashboard,
    postCancelBooking
};
