const store = require('../models/store');
const analyticsService = require('../services/analyticsService');

const getAdminDashboard = (req, res) => {
    try {
        const metrics = analyticsService.getDashboardMetrics();
        res.render('admin/dashboard', {
            kpis: metrics.kpis,
            charts: metrics.charts,
            recentBookings: metrics.recentBookings
        });
    } catch (error) {
        console.error('Admin Dashboard Error:', error);
        res.status(500).render('error', {
            title: 'Admin Error',
            error: 'Failed to load admin analytics.'
        });
    }
};

const getAdminMovies = (req, res) => {
    try {
        const movies = store.getMovies();
        const shows = store.getShows();
        res.render('admin/movies', { movies, shows });
    } catch (error) {
        console.error('Admin Movies Error:', error);
        res.status(500).render('error', {
            title: 'Admin Error',
            error: 'Failed to load movie management.'
        });
    }
};

const postAddMovie = (req, res) => {
    try {
        const { title, genre, rating, duration, basePrice, director, posterUrl, trailerYoutubeId, synopsis, certification } = req.body;

        if (!title || !basePrice) {
            return res.status(400).json({ success: false, message: 'Movie title and base price are required.' });
        }

        const newMovie = {
            id: `mov-${Date.now()}`,
            title,
            genre: typeof genre === 'string' ? genre.split(',').map(g => g.trim()) : (genre || ['Action']),
            rating: parseFloat(rating) || 8.0,
            duration: duration || '2h 15m',
            basePrice: parseInt(basePrice) || 250,
            director: director || 'Director',
            posterUrl: posterUrl || 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
            backdropUrl: 'https://image.tmdb.org/t/p/original/fm6K9vYqq0YQ23Q29z8ecJ09LRU.jpg',
            trailerYoutubeId: trailerYoutubeId || 'uYPbbksJxIg',
            synopsis: synopsis || 'An exciting new cinematic blockbuster experience.',
            certification: certification || 'UA',
            formats: ['IMAX 3D', 'Dolby Atmos', '2D'],
            featured: false
        };

        store.addMovie(newMovie);
        res.redirect('/admin/movies?success=movie_added');
    } catch (error) {
        console.error('Add Movie Error:', error);
        res.status(500).redirect('/admin/movies?error=add_failed');
    }
};

const postDeleteMovie = (req, res) => {
    try {
        const movieId = req.params.id;
        store.deleteMovie(movieId);
        res.json({ success: true, message: 'Movie deleted successfully' });
    } catch (error) {
        console.error('Delete Movie Error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete movie' });
    }
};

const getAdminBookings = (req, res) => {
    try {
        const bookings = store.getBookings();
        const searchQuery = (req.query.q || '').toLowerCase();
        const statusFilter = req.query.status || 'all';

        let filtered = bookings;
        if (statusFilter !== 'all') {
            filtered = filtered.filter(b => b.status === statusFilter);
        }
        if (searchQuery) {
            filtered = filtered.filter(b => 
                (b.id && b.id.toLowerCase().includes(searchQuery)) ||
                (b.name && b.name.toLowerCase().includes(searchQuery)) ||
                (b.email && b.email.toLowerCase().includes(searchQuery)) ||
                (b.movieTitle && b.movieTitle.toLowerCase().includes(searchQuery)) ||
                (b.movie && b.movie.toLowerCase().includes(searchQuery))
            );
        }

        res.render('admin/bookings', {
            bookings: filtered,
            searchQuery,
            statusFilter
        });
    } catch (error) {
        console.error('Admin Bookings Error:', error);
        res.status(500).render('error', {
            title: 'Admin Error',
            error: 'Failed to load booking logs.'
        });
    }
};

const exportBookingsCsv = (req, res) => {
    try {
        const bookings = store.getBookings();

        // CSV Header
        let csvContent = 'Booking ID,Customer Name,Email,Movie Title,Theater,Date,Time,Seats,Amount (INR),Payment Method,Status,Created At\n';

        bookings.forEach(b => {
            const seatsStr = Array.isArray(b.seats) ? `"${b.seats.join(', ')}"` : `"${b.seats || ''}"`;
            const nameStr = `"${(b.name || '').replace(/"/g, '""')}"`;
            const movieStr = `"${(b.movieTitle || b.movie || '').replace(/"/g, '""')}"`;
            const theaterStr = `"${(b.theater || '').replace(/"/g, '""')}"`;

            csvContent += `${b.id || b._id},${nameStr},${b.email || ''},${movieStr},${theaterStr},${b.showDate || ''},${b.showTime || ''},${seatsStr},${b.finalAmount || b.amount || 0},${b.paymentMethod || 'Online'},${b.status || 'Confirmed'},${b.createdAt || b.timestamp || ''}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="CineVerse-Bookings-${Date.now()}.csv"`);
        res.status(200).send(csvContent);
    } catch (error) {
        console.error('CSV Export Error:', error);
        res.status(500).send('Error generating CSV export.');
    }
};

module.exports = {
    getAdminDashboard,
    getAdminMovies,
    postAddMovie,
    postDeleteMovie,
    getAdminBookings,
    exportBookingsCsv
};
