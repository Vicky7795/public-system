require('dotenv').config({ path: './server/.env' });
const nodemailer = require('nodemailer');

console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set (' + process.env.EMAIL_PASS.length + ' chars)' : '❌ NOT SET');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.log('\n❌ SMTP CONNECTION FAILED:');
        console.log(error.message);
    } else {
        console.log('\n✅ SMTP Connection Successful! Sending test email...');
        transporter.sendMail({
            from: `"PGRS Test" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: 'PGRS Email Test',
            text: 'Email is working correctly!'
        }, (err, info) => {
            if (err) {
                console.log('❌ Send Failed:', err.message);
            } else {
                console.log('✅ Email sent! Message ID:', info.messageId);
            }
        });
    }
});
