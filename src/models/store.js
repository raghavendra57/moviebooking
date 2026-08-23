const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../../data');
const moviesFile = path.join(dataDir, 'movies.json');
const showsFile = path.join(dataDir, 'shows.json');
const bookingsFile = path.join(dataDir, 'bookings.json');
const couponsFile = path.join(dataDir, 'coupons.json');
const snacksFile = path.join(dataDir, 'snacks.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initial Movie Catalog with rich metadata and showtimes
const initialMovies = [
    {
        id: 'mov-1',
        title: 'Oppenheimer',
        tagline: 'The world forever changes.',
        genre: ['Biography', 'Drama', 'History'],
        language: 'English (Dolby Atmos)',
        rating: 8.9,
        duration: '3h 00m',
        releaseDate: '2023-07-21',
        certification: 'A (18+)',
        director: 'Christopher Nolan',
        cast: ['Cillian Murphy', 'Emily Blunt', 'Matt Damon', 'Robert Downey Jr.'],
        synopsis: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
        posterUrl: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
        backdropUrl: 'https://image.tmdb.org/t/p/original/fm6K9vYqq0YQ23Q29z8ecJ09LRU.jpg',
        trailerYoutubeId: 'uYPbbksJxIg',
        formats: ['IMAX 70mm', 'Dolby Atmos', '4DX', '2D'],
        featured: true,
        basePrice: 280
    },
    {
        id: 'mov-2',
        title: 'Dune: Part Two',
        tagline: 'Long live the fighters.',
        genre: ['Sci-Fi', 'Adventure', 'Action'],
        language: 'English / Hindi',
        rating: 8.6,
        duration: '2h 46m',
        releaseDate: '2024-03-01',
        certification: 'UA 16+',
        director: 'Denis Villeneuve',
        cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Javier Bardem'],
        synopsis: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
        posterUrl: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
        backdropUrl: 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5200fr.jpg',
        trailerYoutubeId: 'Way9Dexny3w',
        formats: ['IMAX 3D', '4DX', 'Dolby Atmos'],
        featured: true,
        basePrice: 320
    },
    {
        id: 'mov-3',
        title: 'Interstellar',
        tagline: 'Mankind was born on Earth. It was never meant to die here.',
        genre: ['Sci-Fi', 'Drama', 'Adventure'],
        language: 'English',
        rating: 8.7,
        duration: '2h 49m',
        releaseDate: '2014-11-07',
        certification: 'UA',
        director: 'Christopher Nolan',
        cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain', 'Michael Caine'],
        synopsis: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.',
        posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
        backdropUrl: 'https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
        trailerYoutubeId: 'zSWdZVtXT7E',
        formats: ['IMAX 3D', 'Dolby Atmos', '2D'],
        featured: true,
        basePrice: 260
    },
    {
        id: 'mov-4',
        title: 'The Dark Knight',
        tagline: 'Welcome to a world without rules.',
        genre: ['Action', 'Crime', 'Drama'],
        language: 'English / Hindi',
        rating: 9.0,
        duration: '2h 32m',
        releaseDate: '2008-07-18',
        certification: 'UA',
        director: 'Christopher Nolan',
        cast: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart', 'Michael Caine'],
        synopsis: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
        posterUrl: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
        backdropUrl: 'https://image.tmdb.org/t/p/original/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg',
        trailerYoutubeId: 'EXeTwQWrcwY',
        formats: ['IMAX 2D', 'Dolby Atmos', '2D'],
        featured: false,
        basePrice: 250
    },
    {
        id: 'mov-5',
        title: 'Inception',
        tagline: 'Your mind is the scene of the crime.',
        genre: ['Action', 'Sci-Fi', 'Thriller'],
        language: 'English',
        rating: 8.8,
        duration: '2h 28m',
        releaseDate: '2010-07-16',
        certification: 'UA',
        director: 'Christopher Nolan',
        cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Elliot Page', 'Tom Hardy'],
        synopsis: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
        posterUrl: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
        backdropUrl: 'https://image.tmdb.org/t/p/original/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
        trailerYoutubeId: 'YoHD9XEInc0',
        formats: ['IMAX 2D', 'Dolby Atmos', '2D'],
        featured: false,
        basePrice: 240
    },
    {
        id: 'mov-6',
        title: 'Spider-Man: Across the Spider-Verse',
        tagline: 'It\'s how you wear the mask that matters.',
        genre: ['Animation', 'Action', 'Adventure'],
        language: 'English / Hindi / Tamil',
        rating: 8.7,
        duration: '2h 20m',
        releaseDate: '2023-06-02',
        certification: 'U',
        director: 'Joaquim Dos Santos, Kemp Powers',
        cast: ['Shameik Moore', 'Hailee Steinfeld', 'Oscar Isaac', 'Daniel Kaluuya'],
        synopsis: 'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.',
        posterUrl: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
        backdropUrl: 'https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg',
        trailerYoutubeId: 'cqGjhVJWtEg',
        formats: ['3D 4DX', 'Dolby Atmos', '2D'],
        featured: true,
        basePrice: 290
    }
];

// Available Showtimes for all theaters
const generateInitialShows = () => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const dayAfter = new Date(Date.now() + 172800000).toISOString().split('T')[0];
    const dates = [today, tomorrow, dayAfter];
    
    const theaters = [
        { name: 'CineVerse IMAX Laser - Screen 1', type: 'IMAX 3D', multiplier: 1.35 },
        { name: 'CineVerse Atmos Prime - Screen 2', type: 'Dolby Atmos', multiplier: 1.15 },
        { name: 'CineVerse 4DX Motion - Screen 3', type: '4DX 3D', multiplier: 1.45 },
        { name: 'CineVerse Classic - Screen 4', type: 'Digital 2D', multiplier: 1.0 }
    ];

    const timeSlots = [
        { time: '10:15 AM', label: 'Morning Show', discountMultiplier: 0.85 },
        { time: '01:45 PM', label: 'Matinee', discountMultiplier: 0.95 },
        { time: '05:30 PM', label: 'Evening Prime', discountMultiplier: 1.1 },
        { time: '09:15 PM', label: 'Night Show', discountMultiplier: 1.2 }
    ];

    const shows = [];
    let showCount = 1;

    initialMovies.forEach(movie => {
        dates.forEach((date, dateIdx) => {
            theaters.forEach((theater, theaterIdx) => {
                const slots = (dateIdx + theaterIdx) % 2 === 0 ? [timeSlots[0], timeSlots[2]] : [timeSlots[1], timeSlots[3]];
                slots.forEach(slot => {
                    const finalPrice = Math.round(movie.basePrice * theater.multiplier * slot.discountMultiplier);
                    shows.push({
                        id: `show-${showCount++}`,
                        movieId: movie.id,
                        movieTitle: movie.title,
                        date: date,
                        time: slot.time,
                        slotLabel: slot.label,
                        theater: theater.name,
                        screenType: theater.type,
                        basePrice: finalPrice,
                        tierPrices: {
                            vip: Math.round(finalPrice * 1.5),
                            premium: Math.round(finalPrice * 1.15),
                            standard: finalPrice
                        }
                    });
                });
            });
        });
    });

    return shows;
};

// Initial Snack Combos (Food & Beverage)
const initialSnacks = [
    {
        id: 'snack-1',
        name: 'Jumbo Caramel Popcorn',
        category: 'Popcorn',
        description: 'Warm, crispy, freshly popped gourmet caramel popcorn (120g)',
        price: 180,
        image: '🍿',
        badge: 'Bestseller'
    },
    {
        id: 'snack-2',
        name: 'Loaded Cheese Nachos',
        category: 'Snacks',
        description: 'Crispy corn tortilla chips with hot melted cheddar & jalapenos',
        price: 210,
        image: '🧀',
        badge: 'Popular'
    },
    {
        id: 'snack-3',
        name: 'Chilled Pepsi Zero (600ml)',
        category: 'Beverage',
        description: 'Ice cold carbonated soft drink served in cinema cup',
        price: 120,
        image: '🥤',
        badge: ''
    },
    {
        id: 'snack-4',
        name: 'Ultimate Couple Movie Combo',
        category: 'Combo',
        description: '1 Large Popcorn + 2 Cold Drinks + 1 Nachos Platter (Save ₹120)',
        price: 390,
        image: '🎬',
        badge: 'Save 25%'
    }
];

// Initial Promo Codes / Discount Coupons
const initialCoupons = [
    {
        code: 'CINEMA50',
        discountType: 'flat',
        amount: 50,
        minOrder: 300,
        description: 'Flat ₹50 OFF on all ticket bookings above ₹300'
    },
    {
        code: 'SUPER20',
        discountType: 'percentage',
        amount: 20,
        maxDiscount: 150,
        minOrder: 400,
        description: '20% OFF up to ₹150 for CineVerse members'
    },
    {
        code: 'STUDENT15',
        discountType: 'percentage',
        amount: 15,
        maxDiscount: 100,
        minOrder: 250,
        description: '15% Student Discount with verified ID'
    },
    {
        code: 'POPCORNFREE',
        discountType: 'flat',
        amount: 100,
        minOrder: 600,
        description: 'Flat ₹100 Snack discount on bookings above ₹600'
    }
];

// Helper read/write methods
const readJSON = (file, defaultVal) => {
    try {
        if (!fs.existsSync(file)) {
            fs.writeFileSync(file, JSON.stringify(defaultVal, null, 2), 'utf8');
            return defaultVal;
        }
        const data = fs.readFileSync(file, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        console.error(`Error reading ${file}:`, e);
        return defaultVal;
    }
};

const writeJSON = (file, data) => {
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (e) {
        console.error(`Error writing ${file}:`, e);
        return false;
    }
};

// Initialize default files if needed
const initStore = () => {
    if (!fs.existsSync(moviesFile)) writeJSON(moviesFile, initialMovies);
    if (!fs.existsSync(showsFile)) writeJSON(showsFile, generateInitialShows());
    if (!fs.existsSync(snacksFile)) writeJSON(snacksFile, initialSnacks);
    if (!fs.existsSync(couponsFile)) writeJSON(couponsFile, initialCoupons);
    if (!fs.existsSync(bookingsFile)) writeJSON(bookingsFile, []);
};

initStore();

module.exports = {
    // Movies
    getMovies: () => readJSON(moviesFile, initialMovies),
    getMovieById: (id) => readJSON(moviesFile, initialMovies).find(m => m.id === id || String(m.id) === String(id)),
    addMovie: (movie) => {
        const movies = readJSON(moviesFile, initialMovies);
        movies.unshift(movie);
        writeJSON(moviesFile, movies);
        return movie;
    },
    updateMovie: (id, updatedFields) => {
        const movies = readJSON(moviesFile, initialMovies);
        const idx = movies.findIndex(m => m.id === id || String(m.id) === String(id));
        if (idx !== -1) {
            movies[idx] = { ...movies[idx], ...updatedFields };
            writeJSON(moviesFile, movies);
            return movies[idx];
        }
        return null;
    },
    deleteMovie: (id) => {
        let movies = readJSON(moviesFile, initialMovies);
        movies = movies.filter(m => m.id !== id && String(m.id) !== String(id));
        writeJSON(moviesFile, movies);
        return true;
    },

    // Shows
    getShows: () => {
        let shows = readJSON(showsFile, []);
        const today = new Date().toISOString().split('T')[0];
        if (!shows || shows.length === 0 || (shows[0] && shows[0].date < today)) {
            shows = generateInitialShows();
            writeJSON(showsFile, shows);
        }
        return shows;
    },
    getShowsByMovieId: (movieId) => {
        const shows = module.exports.getShows();
        return shows.filter(s => s.movieId === movieId || String(s.movieId) === String(movieId));
    },
    getShowById: (showId) => {
        const shows = module.exports.getShows();
        return shows.find(s => s.id === showId || String(s.id) === String(showId));
    },
    addShow: (show) => {
        const shows = readJSON(showsFile, []);
        shows.push(show);
        writeJSON(showsFile, shows);
        return show;
    },

    // Snacks
    getSnacks: () => readJSON(snacksFile, initialSnacks),

    // Coupons
    getCoupons: () => readJSON(couponsFile, initialCoupons),
    getCouponByCode: (code) => {
        if (!code) return null;
        const normalized = code.trim().toUpperCase();
        return readJSON(couponsFile, initialCoupons).find(c => c.code === normalized);
    },

    // Bookings
    getBookings: () => readJSON(bookingsFile, []),
    getBookingById: (id) => readJSON(bookingsFile, []).find(b => b.id === id || b._id === id),
    getBookingsByEmail: (email) => {
        if (!email) return [];
        const normalized = email.trim().toLowerCase();
        return readJSON(bookingsFile, []).filter(b => b.email && b.email.toLowerCase() === normalized);
    },
    createBooking: (booking) => {
        const bookings = readJSON(bookingsFile, []);
        bookings.unshift(booking);
        writeJSON(bookingsFile, bookings);
        return booking;
    },
    updateBookingStatus: (id, status) => {
        const bookings = readJSON(bookingsFile, []);
        const booking = bookings.find(b => b.id === id || b._id === id);
        if (booking) {
            booking.status = status;
            writeJSON(bookingsFile, bookings);
            return booking;
        }
        return null;
    }
};
