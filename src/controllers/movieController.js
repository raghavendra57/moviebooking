const store = require('../models/store');

const getHomePage = (req, res) => {
    try {
        const movies = store.getMovies();
        const genreFilter = req.query.genre || 'all';
        const searchQuery = (req.query.q || '').trim().toLowerCase();

        let filteredMovies = movies;

        if (genreFilter !== 'all') {
            filteredMovies = filteredMovies.filter(m => 
                m.genre && m.genre.some(g => g.toLowerCase() === genreFilter.toLowerCase())
            );
        }

        if (searchQuery) {
            filteredMovies = filteredMovies.filter(m => 
                m.title.toLowerCase().includes(searchQuery) ||
                (m.director && m.director.toLowerCase().includes(searchQuery)) ||
                (m.cast && m.cast.some(c => c.toLowerCase().includes(searchQuery)))
            );
        }

        // Collect all distinct genres
        const allGenres = Array.from(new Set(movies.flatMap(m => m.genre || [])));
        const featuredMovies = movies.filter(m => m.featured);

        res.render('index', {
            movies: filteredMovies,
            featuredMovies: featuredMovies.length > 0 ? featuredMovies : movies.slice(0, 3),
            allGenres,
            currentGenre: genreFilter,
            searchQuery,
            userEmail: req.session.userEmail || null
        });
    } catch (error) {
        console.error('Home Page Error:', error);
        res.status(500).render('error', {
            title: 'Server Error',
            error: 'Failed to load movie catalog.'
        });
    }
};

const getMovieDetails = (req, res) => {
    try {
        const movieId = req.params.id;
        const movie = store.getMovieById(movieId);

        if (!movie) {
            return res.status(404).render('error', {
                title: 'Movie Not Found',
                error: 'The requested movie could not be found in our cinema database.'
            });
        }

        // Get shows for this movie
        const shows = store.getShowsByMovieId(movieId);

        // Group shows by Date -> Theater -> Showtimes
        const showsByDate = {};
        shows.forEach(show => {
            if (!showsByDate[show.date]) {
                showsByDate[show.date] = {};
            }
            if (!showsByDate[show.date][show.theater]) {
                showsByDate[show.date][show.theater] = {
                    screenType: show.screenType,
                    shows: []
                };
            }
            showsByDate[show.date][show.theater].shows.push(show);
        });

        res.render('movie-details', {
            movie,
            showsByDate,
            availableDates: Object.keys(showsByDate).sort(),
            userEmail: req.session.userEmail || null
        });
    } catch (error) {
        console.error('Movie Details Error:', error);
        res.status(500).render('error', {
            title: 'Error',
            error: 'Failed to load movie details.'
        });
    }
};

module.exports = {
    getHomePage,
    getMovieDetails
};
