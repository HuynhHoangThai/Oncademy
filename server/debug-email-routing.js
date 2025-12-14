import 'dotenv/config';

console.log('\n🔍 Email Configuration Debug\n');
console.log('━'.repeat(60));

// 1. Check environment variables
console.log('\n📋 Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV || '(not set)');
console.log('EMAIL_TEST_RECIPIENT:', process.env.EMAIL_TEST_RECIPIENT || '(not set)');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);

// 2. Test the getRecipientEmail logic
console.log('\n🧪 Testing getRecipientEmail Logic:');

const isDevelopment = process.env.NODE_ENV !== 'production';
const testEmail = process.env.EMAIL_TEST_RECIPIENT;

console.log('isDevelopment:', isDevelopment);
console.log('testEmail:', testEmail || '(not set)');
console.log('Override active?:', isDevelopment && testEmail ? 'YES ⚠️' : 'NO ✅');

// 3. Test with sample emails
console.log('\n📧 Email Routing Test:');

const getRecipientEmail = (userEmail) => {
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const testEmail = process.env.EMAIL_TEST_RECIPIENT;

    if (isDevelopment && testEmail) {
        console.log(`🔧 [DEV MODE] Overriding recipient: ${userEmail} → ${testEmail}`);
        return testEmail;
    }

    return userEmail;
};

const testCases = [
    'mthuc949@gmail.com',
    'user123@example.com',
    'educator@test.com'
];

testCases.forEach(email => {
    const recipient = getRecipientEmail(email);
    const status = recipient === email ? '✅' : '❌';
    console.log(`${status} Input: ${email} → Output: ${recipient}`);
});

console.log('\n━'.repeat(60));

// 4. Conclusion
if (isDevelopment && testEmail) {
    console.log('\n⚠️  WARNING: Email override is ACTIVE!');
    console.log('All emails will be sent to:', testEmail);
    console.log('\n💡 To fix:');
    console.log('1. Add to .env: NODE_ENV=production');
    console.log('2. OR remove EMAIL_TEST_RECIPIENT from .env');
} else if (isDevelopment && !testEmail) {
    console.log('\n⚠️  INFO: Running in development mode');
    console.log('But no EMAIL_TEST_RECIPIENT set → Emails will go to actual users ✅');
} else {
    console.log('\n✅ Production mode active');
    console.log('Emails will be sent to actual user addresses ✅');
}

console.log('');
