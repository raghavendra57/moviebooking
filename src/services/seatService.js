const occupiedSeatsMap = new Map(); // showId -> Set of seat IDs
const lockedSeatsMap = new Map();   // showId -> Map(seatId -> { timestamp, sessionId, user })
const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes lock TTL

// Generate predefined theater seating layout
const ROWS_CONFIG = [
    { row: 'A', tier: 'vip', name: 'VIP Recliner', seatsCount: 8, priceMultiplier: 1.5 },
    { row: 'B', tier: 'vip', name: 'VIP Recliner', seatsCount: 8, priceMultiplier: 1.5 },
    { row: 'C', tier: 'premium', name: 'Premium Club', seatsCount: 10, priceMultiplier: 1.15 },
    { row: 'D', tier: 'premium', name: 'Premium Club', seatsCount: 10, priceMultiplier: 1.15 },
    { row: 'E', tier: 'premium', name: 'Premium Club', seatsCount: 10, priceMultiplier: 1.15 },
    { row: 'F', tier: 'standard', name: 'Executive Standard', seatsCount: 10, priceMultiplier: 1.0 },
    { row: 'G', tier: 'standard', name: 'Executive Standard', seatsCount: 10, priceMultiplier: 1.0 },
    { row: 'H', tier: 'standard', name: 'Executive Standard', seatsCount: 10, priceMultiplier: 1.0 }
];

// Initialize sample occupied seats for realistic demo
const seedOccupiedSeats = (showId) => {
    if (!occupiedSeatsMap.has(showId)) {
        const preOccupied = new Set(['C4', 'C5', 'D7', 'D8', 'F3', 'F4', 'G8']);
        occupiedSeatsMap.set(showId, preOccupied);
    }
};

const cleanupExpiredLocks = (showId) => {
    if (!lockedSeatsMap.has(showId)) return;
    const locks = lockedSeatsMap.get(showId);
    const now = Date.now();

    for (const [seatId, lockInfo] of locks.entries()) {
        if (now - lockInfo.timestamp > LOCK_TIMEOUT_MS) {
            locks.delete(seatId);
        }
    }

    if (locks.size === 0) {
        lockedSeatsMap.delete(showId);
    }
};

const getSeatTier = (seatId) => {
    const row = seatId.charAt(0).toUpperCase();
    const config = ROWS_CONFIG.find(r => r.row === row);
    return config ? config.tier : 'standard';
};

const getSeatPrice = (seatId, basePrice) => {
    const row = seatId.charAt(0).toUpperCase();
    const config = ROWS_CONFIG.find(r => r.row === row);
    const multiplier = config ? config.priceMultiplier : 1.0;
    return Math.round(basePrice * multiplier);
};

const getSeatLayout = (showId, basePrice = 250) => {
    seedOccupiedSeats(showId);
    cleanupExpiredLocks(showId);

    const occupied = occupiedSeatsMap.get(showId) || new Set();
    const locks = lockedSeatsMap.get(showId) || new Map();

    const layout = ROWS_CONFIG.map(rowConfig => {
        const seats = [];
        for (let i = 1; i <= rowConfig.seatsCount; i++) {
            const seatId = `${rowConfig.row}${i}`;
            let status = 'available';

            if (occupied.has(seatId)) {
                status = 'occupied';
            } else if (locks.has(seatId)) {
                status = 'locked';
            }

            seats.push({
                id: seatId,
                row: rowConfig.row,
                number: i,
                tier: rowConfig.tier,
                tierName: rowConfig.name,
                price: Math.round(basePrice * rowConfig.priceMultiplier),
                status,
                isWheelchair: (rowConfig.row === 'H' && (i === 1 || i === 10))
            });
        }
        return {
            row: rowConfig.row,
            tier: rowConfig.tier,
            tierName: rowConfig.name,
            seats
        };
    });

    const totalSeats = ROWS_CONFIG.reduce((acc, curr) => acc + curr.seatsCount, 0);
    const occupiedCount = occupied.size;
    const lockedCount = locks.size;
    const occupancyRate = Math.round(((occupiedCount + lockedCount) / totalSeats) * 100);

    return {
        layout,
        totalSeats,
        occupiedSeats: Array.from(occupied),
        lockedSeats: Array.from(locks.keys()),
        availableCount: totalSeats - occupiedCount - lockedCount,
        occupancyRate
    };
};

const checkSeatsAvailability = (showId, seats) => {
    seedOccupiedSeats(showId);
    cleanupExpiredLocks(showId);

    const occupied = occupiedSeatsMap.get(showId) || new Set();
    const locks = lockedSeatsMap.get(showId) || new Map();

    return seats.every(seat => !occupied.has(seat) && !locks.has(seat));
};

const lockSeats = (showId, seats, sessionId) => {
    seedOccupiedSeats(showId);
    cleanupExpiredLocks(showId);

    const occupied = occupiedSeatsMap.get(showId) || new Set();
    if (!lockedSeatsMap.has(showId)) {
        lockedSeatsMap.set(showId, new Map());
    }
    const locks = lockedSeatsMap.get(showId);

    // Check if any seat is already occupied or locked by someone else
    const conflict = seats.some(seat => {
        if (occupied.has(seat)) return true;
        if (locks.has(seat) && locks.get(seat).sessionId !== sessionId) return true;
        return false;
    });

    if (conflict) {
        return { success: false, message: 'One or more selected seats are no longer available.' };
    }

    const now = Date.now();
    seats.forEach(seat => {
        locks.set(seat, { timestamp: now, sessionId });
    });

    return {
        success: true,
        lockedSeats: seats,
        expiresIn: LOCK_TIMEOUT_MS / 1000
    };
};

const releaseSeats = (showId, seats, sessionId = null) => {
    if (!lockedSeatsMap.has(showId)) return true;
    const locks = lockedSeatsMap.get(showId);

    seats.forEach(seat => {
        if (!sessionId || (locks.has(seat) && locks.get(seat).sessionId === sessionId)) {
            locks.delete(seat);
        }
    });

    if (locks.size === 0) {
        lockedSeatsMap.delete(showId);
    }
    return true;
};

const confirmSeats = (showId, seats) => {
    seedOccupiedSeats(showId);
    if (!occupiedSeatsMap.has(showId)) {
        occupiedSeatsMap.set(showId, new Set());
    }
    const occupied = occupiedSeatsMap.get(showId);

    seats.forEach(seat => {
        occupied.add(seat);
    });

    // Remove from locks
    if (lockedSeatsMap.has(showId)) {
        const locks = lockedSeatsMap.get(showId);
        seats.forEach(seat => locks.delete(seat));
        if (locks.size === 0) lockedSeatsMap.delete(showId);
    }

    return true;
};

const releaseOccupiedSeats = (showId, seats) => {
    if (occupiedSeatsMap.has(showId)) {
        const occupied = occupiedSeatsMap.get(showId);
        seats.forEach(seat => occupied.delete(seat));
    }
    return true;
};

// Backward compatibility helper
const getSeatsStatus = (showId) => {
    seedOccupiedSeats(showId);
    cleanupExpiredLocks(showId);
    return {
        occupiedSeats: Array.from(occupiedSeatsMap.get(showId) || []),
        blockedSeats: Array.from(lockedSeatsMap.get(showId)?.keys() || [])
    };
};

module.exports = {
    ROWS_CONFIG,
    getSeatLayout,
    getSeatTier,
    getSeatPrice,
    checkSeatsAvailability,
    lockSeats,
    releaseSeats,
    confirmSeats,
    releaseOccupiedSeats,
    getSeatsStatus
};