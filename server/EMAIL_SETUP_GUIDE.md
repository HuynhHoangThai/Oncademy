# 📧 Hướng dẫn cài đặt Email với Nodemailer

Dự án Oncademy sử dụng **Nodemailer** để gửi email thông báo cho người dùng. Hệ thống hỗ trợ nhiều nhà cung cấp email như Gmail, Outlook, hoặc SMTP tùy chỉnh.

## 🚀 Cài đặt nhanh với Gmail

### Bước 1: Bật xác thực 2 yếu tố (2FA)

1. Truy cập [Google Account Security](https://myaccount.google.com/security)
2. Bật **2-Step Verification**

### Bước 2: Tạo App Password

1. Truy cập [App Passwords](https://myaccount.google.com/apppasswords)
2. Chọn **Mail** và **Other (Custom name)**
3. Đặt tên: `Oncademy`
4. Nhấn **Generate**
5. Sao chép mật khẩu 16 ký tự (không có khoảng trắng)

### Bước 3: Cấu hình .env

Thêm vào file `server/.env`:

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=abcdabcdabcdabcd  # App Password từ bước 2
EMAIL_FROM=Oncademy <your-email@gmail.com>
FRONTEND_URL=http://localhost:5173
```

### Bước 4: Kiểm tra cấu hình

```bash
cd server
node check-email-config.js
```

Nếu tất cả đều ✅, bạn đã sẵn sàng!

### Bước 5: Test gửi email

```bash
node test-email.js
```

Script này sẽ gửi 3 email test:
- ✅ Email xác nhận đăng ký khóa học
- 🎉 Email chấp nhận giảng viên
- 📧 Email từ chối giảng viên

## 🔧 Cấu hình nâng cao

### Sử dụng SMTP khác (Outlook, Custom)

Thêm vào `.env`:

```env
# Email Configuration
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
EMAIL_FROM=Oncademy <your-email@outlook.com>

# SMTP Settings
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
```

### Override recipient trong development mode

Để test mà không gửi email đến người dùng thật:

```env
NODE_ENV=development
EMAIL_TEST_RECIPIENT=your-test-email@gmail.com
```

Tất cả email sẽ được gửi đến `EMAIL_TEST_RECIPIENT` thay vì địa chỉ thật.

## 📚 Các biến môi trường

| Biến | Bắt buộc | Mô tả |
|------|----------|-------|
| `EMAIL_USER` | ✅ | Email đăng nhập SMTP |
| `EMAIL_PASSWORD` | ✅ | Mật khẩu/App Password |
| `EMAIL_FROM` | ✅ | Địa chỉ gửi email (tên + email) |
| `FRONTEND_URL` | ✅ | URL frontend để tạo link trong email |
| `SMTP_HOST` | ❌ | SMTP server (mặc định: smtp.gmail.com) |
| `SMTP_PORT` | ❌ | SMTP port (mặc định: 587) |
| `SMTP_SECURE` | ❌ | SSL/TLS (mặc định: false) |
| `EMAIL_TEST_RECIPIENT` | ❌ | Override email nhận trong dev mode |
| `NODE_ENV` | ❌ | Environment (development/production) |

## 🐛 Xử lý lỗi thường gặp

### Lỗi: "Invalid login"

- ✅ Kiểm tra EMAIL_USER và EMAIL_PASSWORD đúng
- ✅ Với Gmail: Đảm bảo đã tạo App Password
- ✅ Không dùng mật khẩu Gmail thông thường

### Lỗi: "Connection timeout"

- ✅ Kiểm tra SMTP_HOST và SMTP_PORT
- ✅ Kiểm tra firewall/antivirus
- ✅ Đảm bảo internet kết nối

### Email không nhận được

- ✅ Kiểm tra spam folder
- ✅ Kiểm tra EMAIL_FROM có đúng format
- ✅ Kiểm tra console log để xem email có gửi thành công

## 📖 Tích hợp trong code

Email service đã được tích hợp sẵn:

```javascript
import { sendCourseEnrollmentEmail } from './utils/emailService.js';

// Gửi email khi user đăng ký khóa học
await sendCourseEnrollmentEmail({
  userEmail: user.email,
  userName: user.name,
  courseTitle: course.title,
  courseId: course._id
});
```

## 🎯 Email templates có sẵn

1. **sendCourseEnrollmentEmail** - Xác nhận đăng ký khóa học thành công
2. **sendEducatorApprovalEmail** - Thông báo đơn giảng viên được chấp nhận
3. **sendEducatorRejectionEmail** - Thông báo đơn giảng viên bị từ chối

## 💡 Lưu ý bảo mật

- ⚠️ **KHÔNG** commit file `.env` lên Git
- ⚠️ **KHÔNG** share App Password với ai
- ⚠️ Sử dụng App Password thay vì mật khẩu Gmail thật
- ✅ Revoke App Password khi không cần thiết

## 🔄 Migration từ Resend

Nếu bạn đang migrate từ Resend:

1. Xóa `RESEND_API_KEY` từ `.env`
2. Thêm cấu hình Nodemailer như hướng dẫn trên
3. Chạy `node check-email-config.js` để kiểm tra
4. Test với `node test-email.js`

---

**Cần hỗ trợ?** Tham khảo [Nodemailer Documentation](https://nodemailer.com/)
