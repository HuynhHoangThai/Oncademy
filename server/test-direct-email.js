import 'dotenv/config';
import { sendEducatorApprovalEmail } from './utils/emailService.js';

/**
 * Test gửi email trực tiếp đến một email cụ thể
 */

const TARGET_EMAIL = 'huynhhoangthai1603.forwork@gmail.com';
const TARGET_NAME = 'Test User';

async function testDirectEmail() {
    console.log('\n📧 Testing Direct Email Send...');
    console.log('━'.repeat(60));
    console.log(`Sending to: ${TARGET_EMAIL}\n`);

    try {
        const result = await sendEducatorApprovalEmail({
            userEmail: TARGET_EMAIL,
            userName: TARGET_NAME
        });

        if (result.success) {
            console.log('\n✅ Email sent successfully!');
            console.log('Message ID:', result.data.messageId);
            console.log('\n📬 IMPORTANT:');
            console.log('1. Check inbox of:', TARGET_EMAIL);
            console.log('2. CHECK SPAM FOLDER!');
            console.log('3. Search for "Oncademy" in All Mail');
            console.log('4. Check Promotions/Updates tabs');
            console.log('\n💡 Email may take 1-2 minutes to arrive');
        } else {
            console.error('\n❌ Failed to send email');
            console.error('Error:', result.error);
        }
    } catch (error) {
        console.error('\n💥 Error:', error.message);
    }

    console.log('\n' + '━'.repeat(60));
}

testDirectEmail();
