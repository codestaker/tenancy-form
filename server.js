const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware to parse JSON and serve static files
app.use(express.json());

// Serve static files from the 'templates' and 'signatures' directories
app.use('/images', express.static(path.join(__dirname, 'templates', 'images')));
app.use('/signatures', express.static(path.join(__dirname, 'templates', 'signatures')));
app.use(express.static(path.join(__dirname, 'templates'), { index: false }));

// --- Routes to serve your HTML files ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'homepage.html'));
});


app.get('/tenant.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'tenant.html'));
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

// Function to capitalize the first letter of a string
const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
};

// --- API endpoint for form submission ---
app.post('/submit', async (req, res) => {
    try {
        const formData = req.body;
        const { fullName, signature } = formData;

        if (!fullName) {
            return res.status(400).json({ success: false, message: 'Missing form data.' });
        }

        // --- Capitalize the radio button answers ---
        const marriedAnswer = capitalizeFirstLetter(formData.married);
        const petsAnswer = capitalizeFirstLetter(formData.pets);
        const carAnswer = capitalizeFirstLetter(formData.car);
        const applicationFeeAnswer = capitalizeFirstLetter(formData.applicationFee);
        const paymentMethodAnswer = capitalizeFirstLetter(formData.paymentMethod);
        
        // --- Email sending logic ---
        const transporter = nodemailer.createTransport({
            host: 'mail.noahaffordablerentals.com.ng',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SENDER_EMAIL,
                pass: process.env.APP_PASSWORD
            }
        });

        let emailHtml = fs.readFileSync(path.join(__dirname, 'nodejs-backend', 'emailTemplate.html'), 'utf8');
        const replacements = {
            fullName: formData.fullName || 'Not provided',
            phoneNumber: formData.phoneNumber || 'Not provided',
            email: formData.email || 'Not provided',
            dob: formData.dob || 'Not provided',
            address: formData.address || 'Not provided',
            city: formData.city || 'Not provided',
            state: formData.state || 'Not provided',
            zip: formData.zip || 'Not provided',
            occupation: formData.occupation || 'Not provided',
            income: formData.income || 'Not provided',
            rent: formData.rent || 'Not provided',
            married: marriedAnswer || 'Not provided',
            pets: petsAnswer || 'Not provided',
            car: carAnswer || 'Not provided',
            keysDate: formData.keysDate || 'Not provided',
            stayDate: formData.stayDate || 'Not provided',
            leaseDuration: formData.leaseDuration || 'Not provided',
            moveInDate: formData.moveInDate || 'Not provided',
            securityDeposit: formData.securityDeposit || 'Not provided',
            rentPayment: formData.rentPayment || 'Not provided',
            applicationFee: applicationFeeAnswer || 'Not provided',
            paymentMethod: paymentMethodAnswer || 'Not provided'
        };

        for (const key in replacements) {
            emailHtml = emailHtml.replace(new RegExp(`{{${key}}}`, 'g'), replacements[key]);
        }

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: process.env.RECEIVER_EMAIL,
            subject: `New Tenant Application from ${fullName}`,
            html: emailHtml,
            attachments: signature ? [{
                filename: 'signature.png',
                content: signature.split(';base64,').pop(),
                encoding: 'base64',
                cid: 'uniqueSig@nodemailer.com'
            }] : []
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: 'Application submitted successfully!' });

    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).json({ success: false, message: 'Failed to submit application.' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
