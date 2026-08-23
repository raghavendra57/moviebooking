const nodemailer = require('nodemailer');

let transporter = null;
try {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER || process.env.SMTP_USER || 'demo@cineverse.io',
            pass: process.env.EMAIL_PASS || process.env.SMTP_PASS || 'demopass'
        },
        connectionTimeout: 5000,
        greetingTimeout: 5000
    });
} catch (e) {
    console.log('⚠️ Mail transporter initialized in offline simulation mode');
}

const sendBookingConfirmation = async (booking) => {
    console.log(`📧 Dispatching confirmation email for Booking ${booking.id || booking._id} to ${booking.email}`);

    const emailHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #334155;">
            <div style="background: linear-gradient(135deg, #1e3a8a, #0284c7); padding: 30px 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 26px; color: #ffffff; letter-spacing: 1px;">🎬 CineVerse Pro</h1>
                <p style="margin: 6px 0 0 0; color: #bae6fd; font-size: 14px;">Booking Confirmation & E-Ticket</p>
            </div>

            <div style="padding: 25px;">
                <h2 style="color: #38bdf8; margin-top: 0;">Hello ${booking.name || 'Movie Lover'},</h2>
                <p style="color: #cbd5e1; font-size: 15px; line-height: 1.5;">Your seats are confirmed for <strong>${booking.movieTitle || booking.movie}</strong>! Get ready for an extraordinary cinema experience.</p>

                <div style="background: #1e293b; border-radius: 8px; padding: 18px; margin: 20px 0; border: 1px solid #475569;">
                    <table style="width: 100%; border-collapse: collapse; color: #e2e8f0; font-size: 14px;">
                        <tr>
                            <td style="padding: 8px 0; color: #94a3b8;">Booking Reference:</td>
                            <td style="padding: 8px 0; font-weight: bold; color: #38bdf8; text-align: right;">#${booking.id || booking._id}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #94a3b8;">Theater & Screen:</td>
                            <td style="padding: 8px 0; font-weight: bold; text-align: right;">${booking.theater || 'Screen 1'} (${booking.screenType || 'IMAX 3D'})</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #94a3b8;">Date & Time:</td>
                            <td style="padding: 8px 0; font-weight: bold; text-align: right;">${booking.showDate || 'Today'} at ${booking.showTime || '07:30 PM'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #94a3b8;">Seats:</td>
                            <td style="padding: 8px 0; font-weight: bold; color: #4ade80; text-align: right;">${Array.isArray(booking.seats) ? booking.seats.join(', ') : booking.seats}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #94a3b8;">Total Amount:</td>
                            <td style="padding: 8px 0; font-weight: bold; font-size: 16px; color: #fbbf24; text-align: right;">₹${booking.finalAmount || booking.amount}</td>
                        </tr>
                    </table>
                </div>

                <div style="text-align: center; margin: 25px 0;">
                    <a href="${booking.ticketUrl || 'http://localhost:3001/dashboard'}" style="background: linear-gradient(135deg, #0284c7, #0369a1); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(2,132,199,0.4);">View Live Digital Pass</a>
                </div>

                <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 30px; border-top: 1px solid #334155; padding-top: 15px;">
                    Please present your QR code or booking ID at the cinema entrance.<br>
                    Need help? Contact support@cineverse.io
                </p>
            </div>
        </div>
    `;

    if (!transporter) {
        console.log('ℹ️ Email simulated (Transporter unavailable).');
        return { simulated: true };
    }

    try {
        const mailOptions = {
            from: `"CineVerse Pro" <${process.env.EMAIL_USER || 'no-reply@cineverse.io'}>`,
            to: booking.email,
            subject: `🎬 Confirmed: ${booking.movieTitle || booking.movie} (${booking.seats.join(', ')})`,
            html: emailHtml
        };

        const info = await Promise.race([
            transporter.sendMail(mailOptions),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Email timeout')), 4000))
        ]);
        console.log('✅ Confirmation email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (err) {
        console.log('⚠️ Live SMTP delivery skipped/failed:', err.message, '— falling back to virtual delivery.');
        return { success: true, fallback: true };
    }
};

module.exports = {
    sendBookingConfirmation
};