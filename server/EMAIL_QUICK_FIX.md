# 🔧 Quick Fix: Email Configuration

## ❌ Vấn đề

Email không được gửi vì thiếu cấu hình:
- ❌ `EMAIL_USER` chưa set
- ❌ `EMAIL_PASSWORD` chưa set

## ✅ Giải pháp (5 phút)

### Bước 1: Tạo Gmail App Password

1. **Bật 2-Factor Authentication:**
   - Vào: https://myaccount.google.com/security
   - Tìm "2-Step Verification"
   - Bật nó lên

2. **Tạo App Password:**
   - Vào: https://myaccount.google.com/apppasswords
   - Chọn "Mail" và "Other (Custom name)"
   - Đặt tên: `Oncademy Server`
   - Click **Generate**
   - **Copy mật khẩu 16 ký tự** (không có khoảng trắng)

### Bước 2: Cập nhật file `.env`

Mở `server/.env` và thêm/cập nhật:

```env
# Email Configuration (Nodemailer)
EMAIL_USER=your-actual-email@gmail.com
EMAIL_PASSWORD=abcdabcdabcdabcd
EMAIL_FROM=Oncademy <your-actual-email@gmail.com>
FRONTEND_URL=http://localhost:5173
```

**Lưu ý:**
- Thay `your-actual-email@gmail.com` bằng Gmail của bạn
- Thay `abcdabcdabcdabcd` bằng App Password 16 ký tự vừa tạo
- Cập nhật cả `EMAIL_FROM` để dùng cùng email

### Bước 3: Restart Server

```bash
# Dừng server hiện tại (Ctrl+C)
# Chạy lại
npm run server
```

### Bước 4: Verify Configuration

```bash
node check-email-config.js
```

Kết quả mong đợi: Tất cả ✅ xanh

### Bước 5: Test Lại

1. Vào Admin Dashboard
2. Approve một educator application
3. ✅ Email sẽ được gửi!

## 🔍 Kiểm tra Server Log

Khi approve, server sẽ log:
```
✅ Email transporter initialized (smtp.gmail.com:587)
📧 Approval email sent to user@example.com
✅ Educator approval email sent successfully: <message-id>
```

Nếu thấy:
```
⚠️  WARNING: Email configuration not found in .env file!
⏭️  Skipping approval email - Email not configured
```
→ Cấu hình chưa đúng, check lại `.env`

## 🎯 Test Email Nhanh

Nếu muốn test nhanh trước:
```bash
node test-email.js
```

Sẽ gửi 3 email test để verify configuration.

---

**Need help?** Xem [EMAIL_SETUP_GUIDE.md](./EMAIL_SETUP_GUIDE.md)
