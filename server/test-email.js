import 'dotenv/config';
import {
    sendCourseEnrollmentEmail,
    sendEducatorApprovalEmail,
    sendEducatorRejectionEmail
} from './utils/emailService.js';

/**
 * Script để test email service với Nodemailer
 * 
 * Cách chạy:
 * 1. Đảm bảo đã setup EMAIL_USER và EMAIL_PASSWORD trong .env
 * 2. Thay đổi TEST_EMAIL thành email của bạn
 * 3. Chạy: node test-email.js
 */

// ⚠️ THAY ĐỔI EMAIL NÀY THÀNH EMAIL CỦA BẠN ĐỂ NHẬN TEST EMAIL
const TEST_EMAIL = 'hunhhongthi1412@gmail.com';
const TEST_NAME = 'Huỳnh Hoàng Thái';

async function testEnrollmentEmail() {
    console.log('\n📧 Testing Course Enrollment Email...');

    try {
        const result = await sendCourseEnrollmentEmail({
            userEmail: TEST_EMAIL,
            userName: TEST_NAME,
            courseTitle: 'React Advanced - Xây dựng ứng dụng thực tế',
            courseId: 'test_course_123'
        });

        if (result.success) {
            console.log('✅ Enrollment email sent successfully!');
            console.log('📬 Check your inbox:', TEST_EMAIL);
        } else {
            console.error('❌ Failed to send enrollment email');
            console.error('Error:', result.error);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

async function testEducatorApprovalEmail() {
    console.log('\n📧 Testing Educator Approval Email...');

    try {
        const result = await sendEducatorApprovalEmail({
            userEmail: TEST_EMAIL,
            userName: TEST_NAME
        });

        if (result.success) {
            console.log('✅ Approval email sent successfully!');
            console.log('📬 Check your inbox:', TEST_EMAIL);
        } else {
            console.error('❌ Failed to send approval email');
            console.error('Error:', result.error);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

async function testEducatorRejectionEmail() {
    console.log('\n📧 Testing Educator Rejection Email...');

    try {
        const result = await sendEducatorRejectionEmail({
            userEmail: TEST_EMAIL,
            userName: TEST_NAME
        });

        if (result.success) {
            console.log('✅ Rejection email sent successfully!');
            console.log('📬 Check your inbox:', TEST_EMAIL);
        } else {
            console.error('❌ Failed to send rejection email');
            console.error('Error:', result.error);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

async function runAllTests() {
    console.log('🚀 Starting Email Service Tests...');
    console.log('📮 Test emails will be sent to:', TEST_EMAIL);
    console.log('━'.repeat(50));

    // Check if email config is set
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.error('\n❌ ERROR: EMAIL_USER or EMAIL_PASSWORD not set in .env file!');
        console.log('\n📝 Steps to fix:');
        console.log('1. For Gmail:');
        console.log('   - Enable 2-Factor Authentication');
        console.log('   - Generate App Password: https://myaccount.google.com/apppasswords');
        console.log('2. Add to server/.env:');
        console.log('   EMAIL_USER=your-email@gmail.com');
        console.log('   EMAIL_PASSWORD=your-16-char-app-password');
        console.log('   EMAIL_FROM=Oncademy <your-email@gmail.com>');
        console.log('   FRONTEND_URL=http://localhost:5173');
        console.log('\n💡 For other email providers:');
        console.log('   Add SMTP_HOST, SMTP_PORT, SMTP_SECURE to .env\n');
        process.exit(1);
    }

    // Check if test email is set
    if (TEST_EMAIL === 'your-email@example.com') {
        console.error('\n❌ ERROR: Please change TEST_EMAIL in this file to your actual email address!');
        console.log('Edit line 15 in test-email.js\n');
        process.exit(1);
    }

    // Run tests sequentially
    await testEnrollmentEmail();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between emails

    await testEducatorApprovalEmail();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await testEducatorRejectionEmail();

    console.log('\n━'.repeat(50));
    console.log('✅ All tests completed!');
    console.log('📬 Check your email:', TEST_EMAIL);
    console.log('\n💡 Tips:');
    console.log('- Check spam folder if you don\'t see emails');
    console.log('- If using Gmail, check "Promotions" or "Updates" tab');
    console.log('- Verify EMAIL_USER and EMAIL_PASSWORD are correct\n');
}

// Run tests
runAllTests().catch(error => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
});
