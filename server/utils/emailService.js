import nodemailer from 'nodemailer';

// Lazy initialize Nodemailer transporter to avoid crash when config is not set
let transporter = null;

/**
 * Get or create Nodemailer transporter instance
 * Supports Gmail and custom SMTP configurations
 */
const getTransporter = () => {
  if (!transporter) {
    // Check if email is configured
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;

    if (!emailUser || !emailPassword) {
      console.warn('\n⚠️  WARNING: Email configuration not found in .env file!');
      console.warn('📧 Email notifications will NOT be sent.');
      console.warn('📝 To enable emails, add to .env:');
      console.warn('   EMAIL_USER=your-email@gmail.com');
      console.warn('   EMAIL_PASSWORD=your-app-password');
      console.warn('   EMAIL_FROM=Oncademy <your-email@gmail.com>');
      console.warn('   FRONTEND_URL=http://localhost:5173');
      console.warn('\n💡 For Gmail:');
      console.warn('   1. Enable 2-factor authentication');
      console.warn('   2. Generate App Password: https://myaccount.google.com/apppasswords');
      console.warn('   3. Use that App Password in EMAIL_PASSWORD\n');
      return null;
    }

    // Create transporter with Gmail or custom SMTP settings
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = process.env.SMTP_PORT || 587;
    const smtpSecure = process.env.SMTP_SECURE === 'true';

    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure, // true for 465, false for other ports
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });

    // Email transporter initialized
  }

  return transporter;
};

/**
 * Override email recipient in development mode
 * Set EMAIL_TEST_RECIPIENT in .env to override recipient in development
 */
const getRecipientEmail = (userEmail) => {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const testEmail = process.env.EMAIL_TEST_RECIPIENT;

  if (isDevelopment && testEmail) {
    return testEmail;
  }

  return userEmail;
};

/**
 * Send course enrollment confirmation email
 * @param {Object} params - Email parameters
 * @param {string} params.userEmail - Recipient email address
 * @param {string} params.userName - User's name
 * @param {string} params.courseTitle - Title of the enrolled course
 * @param {string} params.courseId - Course ID for generating link
 * @returns {Promise<Object>} Email sending result with success status and messageId
 */
export const sendCourseEnrollmentEmail = async ({ userEmail, userName, courseTitle, courseId }) => {
  try {
    const transporter = getTransporter();

    // Skip sending if transporter is not configured
    if (!transporter) {
      return { success: false, error: 'Email credentials not configured' };
    }

    // Validate required parameters from database
    if (!userEmail || !userName || !courseTitle || !courseId) {
      throw new Error('Missing required parameters: userEmail, userName, courseTitle, or courseId');
    }

    // Validate FRONTEND_URL is configured
    if (!process.env.FRONTEND_URL) {
      throw new Error('FRONTEND_URL environment variable is not set');
    }

    const courseUrl = `${process.env.FRONTEND_URL}/player/${courseId}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Đăng ký khóa học thành công</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #667eea; padding: 40px 30px; text-align: center; border-bottom: 4px solid #5568d3;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                        ✓ Đăng ký thành công
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                        Xin chào <strong>${userName}</strong>,
                      </p>
                      
                      <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                        Bạn đã đăng ký thành công khóa học:
                      </p>
                      
                      <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px;">
                        <h2 style="margin: 0; color: #667eea; font-size: 20px; font-weight: 600;">
                          ${courseTitle}
                        </h2>
                      </div>
                      
                      <p style="margin: 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                        Thanh toán của bạn đã được xác nhận thành công. Bây giờ bạn có thể bắt đầu học ngay!
                      </p>
                      
                      <!-- CTA Button -->
                      <table role="presentation" style="margin: 30px 0;">
                        <tr>
                          <td align="center">
                            <a href="${courseUrl}" style="display: inline-block; padding: 14px 40px; background-color: #667eea; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 6px;">
                              → Bắt đầu học ngay
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 20px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                        Chúc bạn học tập hiệu quả!
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                      <p style="margin: 0 0 10px; color: #999999; font-size: 14px;">
                        © ${new Date().getFullYear()} Oncademy. All rights reserved.
                      </p>
                      <p style="margin: 0; color: #999999; font-size: 12px;">
                        Email này được gửi tự động, vui lòng không trả lời.
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    // Validate required env variables
    if (!process.env.EMAIL_FROM) {
      throw new Error('EMAIL_FROM environment variable is not set');
    }

    const recipientEmail = getRecipientEmail(userEmail);
    console.log('📧 [ENROLLMENT] Sending email to:', recipientEmail, '(original:', userEmail, ')');

    // Send email with Nodemailer
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: recipientEmail,
      subject: `✅ Đăng ký thành công khóa học: ${courseTitle}`,
      html: emailHtml,
    });

    console.log('✅ [ENROLLMENT] Email sent successfully! MessageId:', info.messageId);

    return { success: true, data: { messageId: info.messageId } };

  } catch (error) {
    console.error('❌ Error in sendCourseEnrollmentEmail:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send educator approval notification email
 * @param {Object} params - Email parameters
 * @param {string} params.userEmail - Recipient email address
 * @param {string} params.userName - User's name
 * @returns {Promise<Object>} Email sending result with success status and messageId
 */
export const sendEducatorApprovalEmail = async ({ userEmail, userName }) => {
  try {
    const transporter = getTransporter();

    // Skip sending if transporter is not configured
    if (!transporter) {
      return { success: false, error: 'Email credentials not configured' };
    }

    // Validate required parameters from database
    if (!userEmail || !userName) {
      throw new Error('Missing required parameters: userEmail or userName');
    }

    // Validate FRONTEND_URL is configured
    if (!process.env.FRONTEND_URL) {
      throw new Error('FRONTEND_URL environment variable is not set');
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Đơn giảng viên được chấp nhận</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="background-color: #10b981; padding: 40px 30px; text-align: center; border-bottom: 4px solid #059669;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px;">
                        ✓ Đơn giảng viên được chấp nhận
                      </h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="margin: 0 0 20px; color: #333333; font-size: 16px;">
                        Xin chào <strong>${userName}</strong>,
                      </p>
                      <p style="margin: 0 0 20px; color: #333333; font-size: 16px;">
                        Đơn đăng ký làm giảng viên của bạn đã được <strong style="color: #10b981;">CHẤP NHẬN</strong>!
                      </p>
                      <p style="margin: 0 0 20px; color: #333333; font-size: 16px;">
                        Bây giờ bạn có thể bắt đầu tạo và quản lý các khóa học của riêng mình.
                      </p>
                      <table role="presentation" style="margin: 30px 0;">
                        <tr>
                          <td align="center">
                            <a href="${process.env.FRONTEND_URL}/educator" style="display: inline-block; padding: 14px 40px; background-color: #10b981; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 6px;">
                              → Đi tới Dashboard Giảng viên
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 30px; text-align: center;">
                      <p style="margin: 0; color: #999999; font-size: 14px;">
                        © ${new Date().getFullYear()} Oncademy
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    // Validate required env variables
    if (!process.env.EMAIL_FROM) {
      throw new Error('EMAIL_FROM environment variable is not set');
    }

    const recipientEmail = getRecipientEmail(userEmail);
    console.log('📧 [APPROVAL] Sending email to:', recipientEmail, '(original:', userEmail, ')');

    // Send email with Nodemailer
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: recipientEmail,
      subject: 'Đơn giảng viên được chấp nhận - Oncademy',
      html: emailHtml,
    });

    console.log('✅ [APPROVAL] Email sent successfully! MessageId:', info.messageId);

    return { success: true, data: { messageId: info.messageId } };

  } catch (error) {
    console.error('❌ Error in sendEducatorApprovalEmail:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send educator rejection notification email
 * @param {Object} params - Email parameters
 * @param {string} params.userEmail - Recipient email address
 * @param {string} params.userName - User's name
 * @returns {Promise<Object>} Email sending result with success status and messageId
 */
export const sendEducatorRejectionEmail = async ({ userEmail, userName }) => {
  try {
    const transporter = getTransporter();

    // Skip sending if transporter is not configured
    if (!transporter) {
      return { success: false, error: 'Email credentials not configured' };
    }

    // Validate required parameters from database
    if (!userEmail || !userName) {
      throw new Error('Missing required parameters: userEmail or userName');
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Thông báo đơn giảng viên</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="background-color: #ef4444; padding: 40px 30px; text-align: center; border-bottom: 4px solid #dc2626;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px;">
                        Thông báo đơn đăng ký
                      </h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="margin: 0 0 20px; color: #333333; font-size: 16px;">
                        Xin chào <strong>${userName}</strong>,
                      </p>
                      <p style="margin: 0 0 20px; color: #333333; font-size: 16px;">
                        Rất tiếc, đơn đăng ký làm giảng viên của bạn chưa được chấp nhận lúc này.
                      </p>
                      <p style="margin: 0 0 20px; color: #333333; font-size: 16px;">
                        Bạn có thể nộp đơn lại sau hoặc liên hệ với chúng tôi để biết thêm chi tiết.
                      </p>
                      <p style="margin: 20px 0 0; color: #666666; font-size: 14px;">
                        Cảm ơn bạn đã quan tâm đến Oncademy! 
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 30px; text-align: center;">
                      <p style="margin: 0; color: #999999; font-size: 14px;">
                        © ${new Date().getFullYear()} Oncademy
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    // Validate required env variables
    if (!process.env.EMAIL_FROM) {
      throw new Error('EMAIL_FROM environment variable is not set');
    }

    const recipientEmail = getRecipientEmail(userEmail);
    console.log('📧 [REJECTION] Sending email to:', recipientEmail, '(original:', userEmail, ')');

    // Send email with Nodemailer
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: recipientEmail,
      subject: 'Thông báo đơn đăng ký giảng viên - Oncademy',
      html: emailHtml,
    });

    console.log('✅ [REJECTION] Email sent successfully! MessageId:', info.messageId);

    return { success: true, data: { messageId: info.messageId } };

  } catch (error) {
    console.error('❌ Error in sendEducatorRejectionEmail:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send pathway enrollment confirmation email
 * @param {Object} params - Email parameters
 * @param {string} params.userEmail - Recipient email address
 * @param {string} params.userName - User's name
 * @param {string} params.pathwayTitle - Title of the enrolled pathway
 * @param {string} params.pathwayId - Pathway ID for generating link
 * @returns {Promise<Object>} Email sending result with success status and messageId
 */
export const sendPathwayEnrollmentEmail = async ({ userEmail, userName, pathwayTitle, pathwayId }) => {
  try {
    const transporter = getTransporter();

    // Skip sending if transporter is not configured
    if (!transporter) {
      return { success: false, error: 'Email credentials not configured' };
    }

    // Validate required parameters from database
    if (!userEmail || !userName || !pathwayTitle || !pathwayId) {
      throw new Error('Missing required parameters: userEmail, userName, pathwayTitle, or pathwayId');
    }

    // Validate FRONTEND_URL is configured
    if (!process.env.FRONTEND_URL) {
      throw new Error('FRONTEND_URL environment variable is not set');
    }

    const pathwayUrl = `${process.env.FRONTEND_URL}/pathway-player/${pathwayId}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Đăng ký Combo khóa học thành công</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #0d9488; padding: 40px 30px; text-align: center; border-bottom: 4px solid #0f766e;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                        ✓ Đăng ký Combo thành công
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                        Xin chào <strong>${userName}</strong>,
                      </p>
                      
                      <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                        Bạn đã đăng ký thành công Combo khóa học:
                      </p>
                      
                      <div style="background-color: #f0fdfa; border-left: 4px solid #0d9488; padding: 20px; margin: 20px 0; border-radius: 4px;">
                        <h2 style="margin: 0; color: #0d9488; font-size: 20px; font-weight: 600;">
                          ${pathwayTitle}
                        </h2>
                      </div>
                      
                      <p style="margin: 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                        Thanh toán của bạn đã được xác nhận thành công. Bạn có thể truy cập toàn bộ lộ trình học tập ngay bây giờ!
                      </p>
                      
                      <!-- CTA Button -->
                      <table role="presentation" style="margin: 30px 0;">
                        <tr>
                          <td align="center">
                            <a href="${pathwayUrl}" style="display: inline-block; padding: 14px 40px; background-color: #0d9488; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 6px;">
                              → Bắt đầu học ngay
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 20px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                        Chúc bạn học tập hiệu quả!
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                      <p style="margin: 0 0 10px; color: #999999; font-size: 14px;">
                        © ${new Date().getFullYear()} Oncademy. All rights reserved.
                      </p>
                      <p style="margin: 0; color: #999999; font-size: 12px;">
                        Email này được gửi tự động, vui lòng không trả lời.
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    // Validate required env variables
    if (!process.env.EMAIL_FROM) {
      throw new Error('EMAIL_FROM environment variable is not set');
    }

    const recipientEmail = getRecipientEmail(userEmail);
    console.log('📧 [PATHWAY ENROLLMENT] Sending email to:', recipientEmail, '(original:', userEmail, ')');

    // Send email with Nodemailer
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: recipientEmail,
      subject: `✅ Đăng ký thành công Combo: ${pathwayTitle}`,
      html: emailHtml,
    });

    console.log('✅ [PATHWAY ENROLLMENT] Email sent successfully! MessageId:', info.messageId);

    return { success: true, data: { messageId: info.messageId } };

  } catch (error) {
    console.error('❌ Error in sendPathwayEnrollmentEmail:', error);
    return { success: false, error: error.message };
  }
};
