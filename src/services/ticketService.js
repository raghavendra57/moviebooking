const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

// Generate high-resolution, cinema-grade PDF ticket pass
const generateTicket = async (booking, stream) => {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 40,
                info: {
                    Title: `CineVerse Ticket - ${booking.id || booking._id}`,
                    Author: 'CineVerse Pro Entertainment',
                    Subject: `Movie Ticket for ${booking.movieTitle || booking.movie}`
                }
            });

            doc.pipe(stream);

            // Background & Border Accent
            doc.rect(20, 20, 555, 800)
                .lineWidth(2)
                .strokeColor('#1e3c72')
                .stroke();

            // Header Banner
            doc.rect(22, 22, 551, 85)
                .fill('#0d1b2a');

            doc.fontSize(24)
                .fillColor('#6feaf6')
                .font('Helvetica-Bold')
                .text('🎬 CINEVERSE PRO', 40, 42, { align: 'left' });

            doc.fontSize(10)
                .fillColor('#a0aec0')
                .font('Helvetica')
                .text('PREMIUM CINEMAS & IMAX EXPERIENCE', 40, 72, { align: 'left' });

            doc.fontSize(12)
                .fillColor('#ffffff')
                .font('Helvetica-Bold')
                .text('OFFICIAL E-TICKET PASS', 350, 55, { align: 'right' });

            // Movie Title & Format Tag
            doc.moveDown(3);
            doc.rect(40, 125, 515, 70)
                .fill('#1e293b');

            doc.fontSize(20)
                .fillColor('#ffffff')
                .font('Helvetica-Bold')
                .text(booking.movieTitle || booking.movie, 55, 140);

            const formatText = `${booking.theater || 'Screen 1'} • ${booking.screenType || 'IMAX 3D'}`;
            doc.fontSize(11)
                .fillColor('#38bdf8')
                .font('Helvetica')
                .text(formatText, 55, 168);

            // Show & Customer Details Table
            doc.rect(40, 210, 515, 200)
                .fill('#f8fafc');

            doc.rect(40, 210, 515, 200)
                .lineWidth(1)
                .strokeColor('#cbd5e1')
                .stroke();

            const rows = [
                ['Booking ID', `#${booking.id || booking._id}`, 'Date & Time', `${booking.showDate || booking.date || 'Today'} | ${booking.showTime || booking.time || '07:30 PM'}`],
                ['Customer Name', booking.name || 'Guest User', 'Seats Booked', Array.isArray(booking.seats) ? booking.seats.join(', ') : booking.seats],
                ['Customer Email', booking.email || 'N/A', 'Total Paid', `₹${booking.finalAmount || booking.amount} (Paid via ${booking.paymentMethod || 'Online'})`],
                ['Snacks / F&B', booking.snackSummary || (booking.snacks && booking.snacks.length > 0 ? `${booking.snacks.length} Combo Items` : 'None'), 'Booking Status', 'CONFIRMED (VALID)']
            ];

            let yPos = 225;
            rows.forEach(row => {
                // Col 1 label & value
                doc.fontSize(10).fillColor('#64748b').font('Helvetica').text(row[0], 55, yPos);
                doc.fontSize(10).fillColor('#0f172a').font('Helvetica-Bold').text(row[1], 155, yPos);

                // Col 2 label & value
                doc.fontSize(10).fillColor('#64748b').font('Helvetica').text(row[2], 310, yPos);
                doc.fontSize(10).fillColor('#0f172a').font('Helvetica-Bold').text(row[3], 405, yPos);

                yPos += 45;
            });

            // Dashed Divider line
            doc.moveTo(40, 425)
                .lineTo(555, 425)
                .dash(5, { space: 4 })
                .strokeColor('#94a3b8')
                .stroke();
            doc.undash();

            // QR Code Generation & Verification Box
            const qrPayload = JSON.stringify({
                id: booking.id || booking._id,
                movie: booking.movieTitle || booking.movie,
                seats: booking.seats,
                verified: true,
                ts: Date.now()
            });

            const qrBuffer = await QRCode.toBuffer(qrPayload, {
                width: 140,
                margin: 1,
                color: {
                    dark: '#0f172a',
                    light: '#ffffff'
                }
            });

            doc.image(qrBuffer, 55, 445, { width: 130 });

            doc.fontSize(12)
                .fillColor('#0f172a')
                .font('Helvetica-Bold')
                .text('GATE ENTRY SCANNER', 210, 455);

            doc.fontSize(9)
                .fillColor('#475569')
                .font('Helvetica')
                .text('Present this QR code at the usher kiosk. Digital verification takes under 3 seconds. Valid for single entry only.', 210, 475, { width: 330 });

            doc.fontSize(10)
                .fillColor('#0284c7')
                .font('Helvetica-Bold')
                .text(`Pass Code: ${booking.id || booking._id}`, 210, 520);

            // Cinema Rules & Instructions Box
            doc.rect(40, 595, 515, 140)
                .fill('#f1f5f9');

            doc.fontSize(11)
                .fillColor('#0f172a')
                .font('Helvetica-Bold')
                .text('IMPORTANT CINEMA GUIDELINES:', 55, 608);

            const rules = [
                '• Please arrive at the cinema lobby at least 15 minutes before showtime.',
                '• Outside food, glass bottles, and alcoholic beverages are strictly prohibited.',
                '• 3D glasses (if applicable) are sanitized and distributed at the screen entrance.',
                '• Cancellations or reschedules are accepted up to 2 hours prior to showtime.',
                '• In case of issues, contact CineVerse Concierge at support@cineverse.io or call 1800-CINEMA.'
            ];

            let ruleY = 628;
            rules.forEach(rule => {
                doc.fontSize(8.5)
                    .fillColor('#334155')
                    .font('Helvetica')
                    .text(rule, 55, ruleY);
                ruleY += 18;
            });

            // Footer
            doc.fontSize(8)
                .fillColor('#94a3b8')
                .font('Helvetica')
                .text(`© ${new Date().getFullYear()} CineVerse Pro Entertainment Ltd. All rights reserved. Generated automatically.`, 40, 785, { align: 'center' });

            if (stream && typeof stream.on === 'function') {
                stream.on('finish', () => resolve());
                stream.on('error', (err) => reject(err));
            } else {
                doc.on('end', () => resolve());
            }

            doc.end();
        } catch (error) {
            console.error('PDF Generation Error:', error);
            reject(error);
        }
    });
};

module.exports = {
    generateTicket
};