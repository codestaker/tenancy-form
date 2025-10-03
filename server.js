const express = require('express');
const { Resend } = require('resend');
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
        const apiKey = process.env.RESEND_API_KEY;
        console.log('Using Resend API Key:', apiKey ? `${apiKey.substring(0, 5)}...` : 'Not Found');
        const resend = new Resend(apiKey);

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
            from: 'onboarding@resend.dev',
            to: process.env.RECEIVER_EMAIL,
            subject: `New Tenant Application from ${fullName}`,
            html: emailHtml,
            attachments: signature ? [{
                filename: 'signature.png',
                content: Buffer.from(signature.split(';base64,').pop(), 'base64')
            }] : []
        };

        const { data, error } = await resend.emails.send(mailOptions);

        if (error) {
            console.error('Resend Error:', error);
            return res.status(400).json({ success: false, message: 'Failed to send email.', error });
        }

        console.log('Resend Success:', data);
        res.status(200).json({ success: true, message: 'Application submitted successfully!' });

    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).json({ success: false, message: 'Failed to submit application.' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
