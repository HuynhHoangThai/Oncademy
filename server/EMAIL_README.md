# 📧 Quick Start: Nodemailer Email Setup

## ⚡ Cài đặt nhanh (5 phút)

### 1. Cài đặt dependencies
```bash
cd server
npm install nodemailer
```

### 2. Cấu hình Gmail

**Bật 2FA và tạo App Password:**
1. Truy cập: https://myaccount.google.com/apppasswords
2. Tạo App Password cho "Mail"
3. Copy mật khẩu 16 ký tự

**Cập nhật `.env`:**
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM=Oncademy <your-email@gmail.com>
FRONTEND_URL=http://localhost:5173
```

### 3. Kiểm tra cấu hình
```bash
node check-email-config.js
```

### 4. Test gửi email
```bash
# Sửa TEST_EMAIL trong test-email.js trước
node test-email.js
```

## 📚 Chi tiết

Xem [EMAIL_SETUP_GUIDE.md](./EMAIL_SETUP_GUIDE.md) để biết:
- Cấu hình SMTP tùy chỉnh (Outlook, etc.)
- Override recipient trong development
- Xử lý lỗi thường gặp
- API documentation

## 🎯 Email Templates

- `sendCourseEnrollmentEmail()` - Đăng ký khóa học thành công
- `sendEducatorApprovalEmail()` - Chấp nhận đơn giảng viên
- `sendEducatorRejectionEmail()` - Từ chối đơn giảng viên

## 🔧 Cấu hình nâng cao

**Override recipient (development):**
```env
NODE_ENV=development
EMAIL_TEST_RECIPIENT=test@example.com
```

**Custom SMTP:**
```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
```

---

✅ **Đã migrate từ Resend sang Nodemailer** - Linh hoạt hơn, hỗ trợ nhiều provider!
