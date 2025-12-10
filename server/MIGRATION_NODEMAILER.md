# Migration Summary: Resend → Nodemailer

## 🎯 Mục tiêu hoàn thành

✅ **Đã chuyển đổi từ Resend sang Nodemailer** để hỗ trợ nhiều nhà cung cấp email.

## 📦 Thay đổi

### 1. Dependencies
- ✅ Đã cài đặt `nodemailer`
- 📦 Package `resend` vẫn còn trong package.json (có thể xóa nếu muốn)

### 2. Files đã cập nhật

#### `utils/emailService.js` ⭐
- ❌ Xóa: `import { Resend } from 'resend'`
- ✅ Thêm: `import nodemailer from 'nodemailer'`
- 🔄 Đổi: `getResendInstance()` → `getTransporter()`
- 🔧 Cập nhật: API từ Resend sang Nodemailer
- ✅ Giữ nguyên: Tất cả email templates và validation

#### `check-email-config.js`
- 🔄 Đổi: Kiểm tra `RESEND_API_KEY` → `EMAIL_USER`, `EMAIL_PASSWORD`
- ✅ Thêm: Hiển thị SMTP settings (optional)

#### `test-email.js`
- 🔄 Đổi: Comments và error messages từ Resend → Nodemailer
- ✅ Giữ nguyên: Test logic cho 3 loại email

### 3. Files mới tạo

| File | Mô tả |
|------|-------|
| `.env.example` | Template cho biến môi trường |
| `EMAIL_SETUP_GUIDE.md` | Hướng dẫn chi tiết setup email |
| `EMAIL_README.md` | Quick start guide (5 phút) |

## 🔧 Biến môi trường

### Cũ (Resend):
```env
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=Oncademy <onboarding@resend.dev>
```

### Mới (Nodemailer):
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM=Oncademy <your-email@gmail.com>
```

### Optional (Nodemailer):
```env
SMTP_HOST=smtp.gmail.com  # default
SMTP_PORT=587             # default
SMTP_SECURE=false         # default
EMAIL_TEST_RECIPIENT=test@example.com  # dev mode override
```

## 📋 Các bước tiếp theo

### 1. Xóa cấu hình Resend cũ (nếu có)
```env
# Xóa dòng này từ .env
# RESEND_API_KEY=re_xxxxx
```

### 2. Thêm cấu hình Nodemailer
```bash
# Xem hướng dẫn trong EMAIL_README.md
# Quick: Bật 2FA Gmail → Tạo App Password → Copy vào .env
```

### 3. Kiểm tra cấu hình
```bash
cd server
node check-email-config.js
```

### 4. Test gửi email
```bash
# Cập nhật TEST_EMAIL trong test-email.js trước
node test-email.js
```

## ✨ Lợi ích

| Resend | Nodemailer |
|--------|------------|
| ❌ Chỉ hỗ trợ Resend | ✅ Hỗ trợ Gmail, Outlook, SMTP tùy chỉnh |
| ❌ Cần API key riêng | ✅ Dùng email có sẵn |
| ❌ Có giới hạn free tier | ✅ Không giới hạn (tùy provider) |
| ❌ Phụ thuộc bên thứ 3 | ✅ Kiểm soát hoàn toàn |

## 🔒 Bảo mật

- ⚠️ **KHÔNG** commit `.env` lên Git
- ⚠️ **KHÔNG** share App Password
- ✅ Dùng App Password thay vì mật khẩu thật
- ✅ Revoke App Password khi không dùng

## 🐛 Debug

Nếu gặp lỗi:
1. Kiểm tra `EMAIL_USER` và `EMAIL_PASSWORD` đúng
2. Với Gmail: Đảm bảo đã tạo App Password
3. Kiểm tra firewall/antivirus
4. Xem log chi tiết trong console

## 📖 Tài liệu

- [EMAIL_README.md](./EMAIL_README.md) - Quick start (5 phút)
- [EMAIL_SETUP_GUIDE.md](./EMAIL_SETUP_GUIDE.md) - Hướng dẫn chi tiết
- [Nodemailer Docs](https://nodemailer.com/) - Official documentation

---

**Migration Status:** ✅ HOÀN THÀNH
