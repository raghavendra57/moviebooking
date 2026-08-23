const crypto = require('crypto');
const store = require('../models/store');
const seatService = require('./seatService');

const CONVENIENCE_FEE = 35; // ₹35 fixed booking convenience fee
const GST_RATE = 0.18;      // 18% GST on convenience fee & F&B

// Calculate full order financial breakdown
const calculateOrderSummary = ({ show, seats, snacks = [], couponCode = null }) => {
    // 1. Calculate Seats Cost based on tier
    let seatsTotal = 0;
    const seatDetails = (seats || []).map(seatId => {
        const tier = seatService.getSeatTier(seatId);
        const price = seatService.getSeatPrice(seatId, show.basePrice);
        seatsTotal += price;
        return {
            id: seatId,
            tier,
            price
        };
    });

    // 2. Calculate F&B Snacks Cost
    let snacksTotal = 0;
    const snackDetails = [];
    if (Array.isArray(snacks) && snacks.length > 0) {
        const allSnacks = store.getSnacks();
        snacks.forEach(item => {
            const found = allSnacks.find(s => s.id === item.id);
            if (found && item.qty > 0) {
                const itemTotal = found.price * item.qty;
                snacksTotal += itemTotal;
                snackDetails.push({
                    id: found.id,
                    name: found.name,
                    price: found.price,
                    qty: item.qty,
                    total: itemTotal,
                    image: found.image
                });
            }
        });
    }

    const subtotal = seatsTotal + snacksTotal;

    // 3. Discount calculation
    let discountAmount = 0;
    let appliedCoupon = null;
    let couponMessage = '';

    if (couponCode) {
        const coupon = store.getCouponByCode(couponCode);
        if (coupon) {
            if (subtotal >= coupon.minOrder) {
                if (coupon.discountType === 'flat') {
                    discountAmount = coupon.amount;
                } else if (coupon.discountType === 'percentage') {
                    const rawDiscount = (subtotal * coupon.amount) / 100;
                    discountAmount = coupon.maxDiscount ? Math.min(rawDiscount, coupon.maxDiscount) : rawDiscount;
                }
                discountAmount = Math.round(discountAmount);
                appliedCoupon = {
                    code: coupon.code,
                    discountAmount,
                    description: coupon.description
                };
                couponMessage = `Promo code "${coupon.code}" applied successfully! You saved ₹${discountAmount}.`;
            } else {
                couponMessage = `Coupon "${coupon.code}" requires a minimum order of ₹${coupon.minOrder}.`;
            }
        } else {
            couponMessage = `Invalid promo code "${couponCode}".`;
        }
    }

    // 4. Taxes & Fees
    const convenienceFee = seats.length > 0 ? CONVENIENCE_FEE : 0;
    const gstAmount = Math.round((convenienceFee + (snacksTotal * 0.05)) * GST_RATE);
    const finalAmount = Math.max(0, subtotal - discountAmount + convenienceFee + gstAmount);

    return {
        seatsTotal,
        seatDetails,
        snacksTotal,
        snackDetails,
        subtotal,
        discountAmount,
        appliedCoupon,
        couponMessage,
        convenienceFee,
        gstAmount,
        finalAmount
    };
};

const generateBookingId = () => {
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    return `CV-${dateStr}-${randomHex}`;
};

module.exports = {
    CONVENIENCE_FEE,
    GST_RATE,
    calculateOrderSummary,
    generateBookingId
};
