import 'dotenv/config';

console.log('\n🔍 Checking Email Configuration...\n');

// Check EMAIL_USER
if (!process.env.EMAIL_USER) {
    console.error('❌ EMAIL_USER: NOT SET');
    console.log('\n📝 You need to:');
    console.log('1. Use your email account (Gmail recommended)');
    console.log('2. Add to server/.env:');
    console.log('   EMAIL_USER=your-email@gmail.com\n');
} else {
    console.log('✅ EMAIL_USER:', process.env.EMAIL_USER);
}

// Check EMAIL_PASSWORD
if (!process.env.EMAIL_PASSWORD) {
    console.error('❌ EMAIL_PASSWORD: NOT SET');
    console.log('\n📝 For Gmail:');
    console.log('1. Enable 2-Factor Authentication');
    console.log('2. Generate App Password: https://myaccount.google.com/apppasswords');
    console.log('3. Add to server/.env:');
    console.log('   EMAIL_PASSWORD=your-16-char-app-password\n');
} else {
    console.log('✅ EMAIL_PASSWORD: Configured (hidden for security)');
}

// Check EMAIL_FROM
if (!process.env.EMAIL_FROM) {
    console.error('❌ EMAIL_FROM: NOT SET');
    console.log('   Add to .env: EMAIL_FROM=Oncademy <your-email@gmail.com>');
} else {
    console.log('✅ EMAIL_FROM:', process.env.EMAIL_FROM);
}

// Check FRONTEND_URL
if (!process.env.FRONTEND_URL) {
    console.error('❌ FRONTEND_URL: NOT SET');
    console.log('   Add to .env: FRONTEND_URL=http://localhost:5173');
} else {
    console.log('✅ FRONTEND_URL:', process.env.FRONTEND_URL);
}

// Check optional SMTP settings
console.log('\n📧 SMTP Settings (Optional - defaults to Gmail):');
console.log('   SMTP_HOST:', process.env.SMTP_HOST || 'smtp.gmail.com (default)');
console.log('   SMTP_PORT:', process.env.SMTP_PORT || '587 (default)');
console.log('   SMTP_SECURE:', process.env.SMTP_SECURE || 'false (default)');

console.log('\n' + '━'.repeat(60));

// Check if all required vars are set
const allSet = process.env.EMAIL_USER &&
    process.env.EMAIL_PASSWORD &&
    process.env.EMAIL_FROM &&
    process.env.FRONTEND_URL;

if (allSet) {
    console.log('🎉 All email configuration is ready!');
    console.log('✅ You can now run: node test-email.js');
} else {
    console.log('⚠️  Email configuration is incomplete.');
    console.log('\n📖 Required .env variables:');
    console.log('   EMAIL_USER=your-email@gmail.com');
    console.log('   EMAIL_PASSWORD=your-app-password');
    console.log('   EMAIL_FROM=Oncademy <your-email@gmail.com>');
    console.log('   FRONTEND_URL=http://localhost:5173');
}

console.log('');
