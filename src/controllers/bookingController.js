const store = require('../models/store');
const seatService = require('../services/seatService');
const bookingService = require('../services/bookingService');
const ticketService = require('../services/ticketService');
const emailService = require('../services/emailService');
const websocketService = require('../services/websocketService');

// 1. Render Seat Selection Screen
const getSeatBookingPage = (req, res) => {
    try {
        const showId = req.query.show;
        const movieId = req.query.movie;

        let show = null;
        let movie = null;

        if (showId) {
            show = store.getShowById(showId);
            if (show) movie = store.getMovieById(show.movieId);
        } else if (movieId) {
            movie = store.getMovieById(movieId);
            const shows = store.getShowsByMovieId(movieId);
            show = shows && shows.length > 0 ? shows[0] : null;
        }

        if (!movie || !show) {
            return res.redirect('/');
        }

        const seatLayoutData = seatService.getSeatLayout(show.id, show.basePrice);
        const snacks = store.getSnacks();

        res.render('booking', {
            movie,
            show,
            seatLayout: seatLayoutData.layout,
            totalSeats: seatLayoutData.totalSeats,
            occupiedSeats: seatLayoutData.occupiedSeats,
            lockedSeats: seatLayoutData.lockedSeats,
            occupancyRate: seatLayoutData.occupancyRate,
            snacks,
            sessionId: req.sessionID || 'sess_' + Date.now(),
            userEmail: req.session.userEmail || ''
        });
    } catch (error) {
        console.error('Booking Page Error:', error);
        res.status(500).render('error', {
            title: 'Booking Error',
            error: 'Failed to load theater seat layout.'
        });
    }
};

// 2. Lock seats temporarily (5 min TTL)
const postLockSeats = (req, res) => {
    try {
        const { showId, seats } = req.body;
        const sessionId = req.sessionID || req.body.sessionId;

        if (!showId || !Array.isArray(seats) || seats.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid show or seats requested.' });
        }

        const lockResult = seatService.lockSeats(showId, seats, sessionId);

        if (lockResult.success) {
            // Notify other WebSocket viewers
            websocketService.broadcastToShow(showId, {
                type: 'seat_status_sync',
                showId,
                ...seatService.getSeatsStatus(showId)
            });
            return res.json({ success: true, expiresIn: lockResult.expiresIn, seats });
        } else {
            return res.status(409).json({ success: false, message: lockResult.message });
        }
    } catch (error) {
        console.error('Lock Seats Error:', error);
        res.status(500).json({ success: false, message: 'Failed to lock seats.' });
    }
};

// 3. Release temporarily locked seats
const postReleaseSeats = (req, res) => {
    try {
        const { showId, seats } = req.body;
        const sessionId = req.sessionID;

        if (showId && Array.isArray(seats)) {
            seatService.releaseSeats(showId, seats, sessionId);
            websocketService.broadcastToShow(showId, {
                type: 'seat_status_sync',
                showId,
                ...seatService.getSeatsStatus(showId)
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Release Seats Error:', error);
        res.status(500).json({ success: false, message: 'Failed to release seats.' });
    }
};

// 4. Save selections to session and transition to Checkout
const postPrepareCheckout = (req, res) => {
    try {
        const { showId, seats, snacks } = req.body;

        const show = store.getShowById(showId);
        if (!show) {
            return res.status(404).json({ success: false, message: 'Show not found.' });
        }

        const parsedSeats = typeof seats === 'string' ? JSON.parse(seats) : seats;
        const parsedSnacks = typeof snacks === 'string' ? JSON.parse(snacks) : (snacks || []);

        if (!parsedSeats || parsedSeats.length === 0) {
            return res.status(400).json({ success: false, message: 'Please select at least one seat.' });
        }

        req.session.pendingOrder = {
            showId: show.id,
            movieId: show.movieId,
            seats: parsedSeats,
            snacks: parsedSnacks,
            lockedAt: Date.now()
        };

        req.session.save((err) => {
            if (err) return res.status(500).json({ success: false, message: 'Session storage error' });
            res.json({ success: true, redirectUrl: '/checkout' });
        });
    } catch (error) {
        console.error('Prepare Checkout Error:', error);
        res.status(500).json({ success: false, message: 'Failed to prepare order.' });
    }
};

// 5. Render Modern Multi-Payment Checkout Page
const getCheckoutPage = (req, res) => {
    try {
        let showId = req.query.show;
        let seats = req.query.seats;
        let snacks = req.query.snacks;

        const sessionOrder = req.session ? req.session.pendingOrder : null;

        if (!showId && sessionOrder) {
            showId = sessionOrder.showId;
            seats = sessionOrder.seats;
            snacks = sessionOrder.snacks;
        }

        if (!showId || !seats) {
            return res.redirect('/?error=no_active_order');
        }

        const show = store.getShowById(showId);
        if (!show) return res.redirect('/');
        const movie = store.getMovieById(show.movieId);
        if (!movie) return res.redirect('/');

        let parsedSeats = [];
        try {
            parsedSeats = typeof seats === 'string' ? JSON.parse(seats) : seats;
            if (!Array.isArray(parsedSeats) && typeof seats === 'string') {
                parsedSeats = seats.split(',').map(s => s.trim());
            }
        } catch (e) {
            parsedSeats = typeof seats === 'string' ? seats.split(',').map(s => s.trim()) : [];
        }

        let parsedSnacks = [];
        try {
            parsedSnacks = typeof snacks === 'string' ? JSON.parse(snacks) : (snacks || []);
        } catch (e) {
            parsedSnacks = [];
        }

        if (!parsedSeats || parsedSeats.length === 0) {
            return res.redirect('/book?show=' + showId);
        }

        if (req.session) {
            req.session.pendingOrder = {
                showId: show.id,
                movieId: show.movieId,
                seats: parsedSeats,
                snacks: parsedSnacks,
                lockedAt: Date.now()
            };
        }

        const summary = bookingService.calculateOrderSummary({
            show,
            seats: parsedSeats,
            snacks: parsedSnacks,
            couponCode: req.query.coupon || null
        });

        res.render('checkout', {
            movie,
            show,
            seats: parsedSeats,
            snacks: parsedSnacks,
            summary,
            coupons: store.getCoupons(),
            userEmail: req.session ? (req.session.userEmail || '') : ''
        });
    } catch (error) {
        console.error('Checkout Page Error:', error);
        res.status(500).render('error', {
            title: 'Checkout Error',
            error: 'Failed to load checkout summary.'
        });
    }
};

// 6. Validate promo coupon AJAX
const postApplyCoupon = (req, res) => {
    try {
        const { code, showId, seats, snacks } = req.body;
        const show = store.getShowById(showId);

        if (!show) {
            return res.status(400).json({ success: false, message: 'Invalid show' });
        }

        const summary = bookingService.calculateOrderSummary({
            show,
            seats: Array.isArray(seats) ? seats : JSON.parse(seats || '[]'),
            snacks: Array.isArray(snacks) ? snacks : JSON.parse(snacks || '[]'),
            couponCode: code
        });

        if (summary.appliedCoupon) {
            res.json({
                success: true,
                message: summary.couponMessage,
                discountAmount: summary.discountAmount,
                finalAmount: summary.finalAmount,
                gstAmount: summary.gstAmount
            });
        } else {
            res.json({
                success: false,
                message: summary.couponMessage || 'Invalid coupon code.'
            });
        }
    } catch (error) {
        console.error('Apply Coupon Error:', error);
        res.status(500).json({ success: false, message: 'Error applying coupon' });
    }
};

// 7. Complete Payment & Confirm Booking
const postProcessPayment = async (req, res) => {
    try {
        const { name, email, phone, paymentMethod, couponCode, showId, seats, snacks } = req.body;
        const sessionOrder = req.session ? req.session.pendingOrder : null;

        const targetShowId = showId || sessionOrder?.showId;
        let targetSeats = seats || sessionOrder?.seats;
        let targetSnacks = snacks || sessionOrder?.snacks;

        if (typeof targetSeats === 'string') {
            try { targetSeats = JSON.parse(targetSeats); } catch(e) { targetSeats = targetSeats.split(','); }
        }
        if (typeof targetSnacks === 'string') {
            try { targetSnacks = JSON.parse(targetSnacks); } catch(e) { targetSnacks = []; }
        }

        if (!targetShowId || !targetSeats || targetSeats.length === 0) {
            return res.redirect('/?error=session_expired');
        }

        const show = store.getShowById(targetShowId);
        if (!show) return res.redirect('/');
        const movie = store.getMovieById(show.movieId);
        if (!movie) return res.redirect('/');

        // Calculate final total with applied coupon
        const summary = bookingService.calculateOrderSummary({
            show,
            seats: targetSeats,
            snacks: targetSnacks,
            couponCode: couponCode || null
        });

        const bookingId = bookingService.generateBookingId();
        const customerEmail = email || (req.session ? req.session.userEmail : null) || 'guest@cineverse.io';
        const customerName = name || 'Valued Guest';

        const bookingRecord = {
            id: bookingId,
            _id: bookingId, // backward compatibility
            movie: movie.title,
            movieTitle: movie.title,
            movieId: movie.id,
            posterUrl: movie.posterUrl,
            showId: show.id,
            theater: show.theater,
            screenType: show.screenType,
            showDate: show.date,
            showTime: show.time,
            seats: targetSeats,
            seatDetails: summary.seatDetails,
            snacks: summary.snackDetails,
            snackSummary: summary.snackDetails.map(s => `${s.name} x${s.qty}`).join(', '),
            baseAmount: summary.subtotal,
            discountAmount: summary.discountAmount,
            appliedCoupon: summary.appliedCoupon ? summary.appliedCoupon.code : null,
            convenienceFee: summary.convenienceFee,
            gstAmount: summary.gstAmount,
            amount: summary.finalAmount,
            finalAmount: summary.finalAmount,
            paymentMethod: paymentMethod || 'Card',
            name: customerName,
            email: customerEmail,
            phone: phone || '',
            status: 'Confirmed',
            createdAt: new Date().toISOString(),
            timestamp: new Date().toISOString(),
            loyaltyPointsEarned: Math.round(summary.finalAmount / 10)
        };

        // 1. Confirm seats in memory/store
        seatService.confirmSeats(show.id, targetSeats);

        // 2. Persist booking
        store.createBooking(bookingRecord);

        // 3. Save to user session if available
        if (req.session) {
            req.session.userEmail = customerEmail;
            req.session.lastConfirmedBooking = bookingRecord;
            delete req.session.pendingOrder;
            req.session.save(() => {
                res.redirect(`/success?id=${bookingId}`);
            });
        } else {
            res.redirect(`/success?id=${bookingId}`);
        }

        // 4. Notify WebSocket connected clients
        websocketService.notifySeatStatusChanged(
            show.id,
            seatService.getSeatsStatus(show.id).occupiedSeats,
            seatService.getSeatsStatus(show.id).blockedSeats
        );

        // 5. Send asynchronous confirmation email
        bookingRecord.ticketUrl = `http://${req.headers.host || 'localhost:3001'}/ticket/${bookingId}`;
        emailService.sendBookingConfirmation(bookingRecord).catch(err => {
            console.error('Non-blocking email error:', err.message);
        });

    } catch (error) {
        console.error('Process Payment Error:', error);
        res.status(500).render('error', {
            title: 'Payment Processing Failed',
            error: 'Failed to finalize your ticket booking. Please try again.'
        });
    }
};

// 8. Booking Confirmation Screen
const getSuccessPage = (req, res) => {
    try {
        const bookingId = req.query.id;
        let booking = null;

        if (bookingId) {
            booking = store.getBookingById(bookingId);
        }

        if (!booking && req.session.lastConfirmedBooking) {
            booking = req.session.lastConfirmedBooking;
        }

        if (!booking) {
            return res.redirect('/dashboard');
        }

        res.render('success', {
            booking,
            userEmail: req.session.userEmail || booking.email
        });
    } catch (error) {
        console.error('Success Page Error:', error);
        res.status(500).render('error', {
            title: 'Error',
            error: 'Failed to display booking confirmation.'
        });
    }
};

// 9. Web E-Ticket View (Mobile-Friendly Live Pass)
const getDigitalTicketPage = (req, res) => {
    try {
        const bookingId = req.params.id;
        const booking = store.getBookingById(bookingId);

        if (!booking) {
            return res.status(404).render('error', {
                title: 'Ticket Not Found',
                error: 'Could not find the requested digital ticket pass.'
            });
        }

        res.render('ticket-view', {
            booking,
            userEmail: req.session.userEmail || booking.email
        });
    } catch (error) {
        console.error('Digital Ticket Error:', error);
        res.status(500).render('error', {
            title: 'Error',
            error: 'Failed to load digital ticket.'
        });
    }
};

// 10. Download High-Res PDF Ticket
const downloadTicketPdf = async (req, res) => {
    try {
        const bookingId = req.params.bookingId || req.params.id;
        const booking = store.getBookingById(bookingId);

        if (!booking) {
            return res.status(404).render('error', {
                title: 'Ticket Not Found',
                error: 'Booking record not found for PDF download.'
            });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="CineVerse-Ticket-${booking.id || booking._id}.pdf"`);

        await ticketService.generateTicket(booking, res);
    } catch (error) {
        console.error('PDF Ticket Download Error:', error);
        res.status(500).render('error', {
            title: 'PDF Generation Failed',
            error: 'Could not generate PDF ticket file.'
        });
    }
};

module.exports = {
    getSeatBookingPage,
    postLockSeats,
    postReleaseSeats,
    postPrepareCheckout,
    getCheckoutPage,
    postApplyCoupon,
    postProcessPayment,
    getSuccessPage,
    getDigitalTicketPage,
    downloadTicketPdf
};
