# 🧪 Hướng Dẫn Test Email Trên Giao Diện

## 📧 Email Service Đã Được Tích Hợp

Hệ thống email đã được tích hợp sẵn vào 2 chức năng chính:

### 1. 🎓 Email Đăng Ký Khóa Học (Course Enrollment)
**Vị trí:** `controllers/webhooks.js` (dòng 129-134)

**Khi nào gửi:**
- Sau khi thanh toán Stripe thành công
- Stripe webhook `payment_intent.succeeded` được trigger

**Dữ liệu email:**
- `userEmail`: Email người dùng từ database
- `userName`: Tên người dùng
- `courseTitle`: Tên khóa học đã đăng ký
- `courseId`: ID khóa học (để tạo link)

---

### 2. 👨‍🏫 Email Phê Duyệt/Từ Chối Giảng Viên
**Vị trí:** `controllers/adminController.js`

**a) Email Chấp Nhận (dòng 54-57):**
- Hàm: `approveEducator()`
- Khi admin approve educator application

**b) Email Từ Chối (dòng 103-106):**
- Hàm: `rejectEducator()` 
- Khi admin reject educator application

---

## 🧪 Cách Test Trên Giao Diện

### ✅ Chuẩn Bị

1. **Setup Email Configuration:**
```bash
# Trong file .env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Oncademy <your-email@gmail.com>
FRONTEND_URL=http://localhost:5173
```

2. **Verify configuration:**
```bash
cd server
node check-email-config.js
```

3. **Start server:**
```bash
npm run server
```

---

## 🎯 Test Case 1: Email Đăng Ký Khóa Học

### Bước 1: Setup Stripe Webhook (Development)
```bash
# Cài Stripe CLI (nếu chưa có)
# Download: https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:4000/api/webhooks/stripe
```

### Bước 2: Test Payment Flow
1. Mở frontend: `http://localhost:5173`
2. Đăng nhập với tài khoản student
3. Chọn một khóa học
4. Click "Enroll Now" / "Đăng ký"
5. Thanh toán với test card Stripe:
   - Card: `4242 4242 4242 4242`
   - Expiry: Bất kỳ tháng/năm tương lai
   - CVC: Bất kỳ 3 số
   - ZIP: Bất kỳ

### Bước 3: Kiểm Tra Email
- ✅ Check console log: `📧 Enrollment email sent to [email]`
- ✅ Check email inbox (và spam folder)
- ✅ Email có subject: `✅ Đăng ký thành công khóa học: [Tên khóa học]`
- ✅ Email có button "Bắt đầu học ngay"

### 🐛 Troubleshooting
```bash
# Xem log server
# Nếu thấy: "⏭️ Skipping enrollment email - Email not configured"
# → Check lại .env configuration

# Nếu thấy error SMTP:
# → Kiểm tra EMAIL_USER và EMAIL_PASSWORD
# → Với Gmail: Đảm bảo đã tạo App Password
```

---

## 🎯 Test Case 2: Email Phê Duyệt Giảng Viên

### Bước 1: Tạo Educator Application
1. Đăng nhập với tài khoản student
2. Đi tới trang "Apply for Educator" / "Đăng ký làm giảng viên"
3. Điền form và submit
4. Application status = "pending"

### Bước 2: Login Admin
1. Đăng nhập với tài khoản admin
2. Đi tới Admin Dashboard
3. Vào mục "Pending Educator Applications"

### Bước 3: Test Approval Email
1. Click "Approve" cho một application
2. ✅ Check console: `📧 Approval email sent to [email]`
3. ✅ Check email inbox
4. ✅ Email có subject: `🎉 Đơn giảng viên được chấp nhận - Oncademy`
5. ✅ Email có button "Đi tới Dashboard Giảng viên"

### Bước 4: Test Rejection Email
1. Click "Reject" cho một application  
2. ✅ Check console: `📧 Rejection email sent to [email]`
3. ✅ Check email inbox
4. ✅ Email có subject: `Thông báo đơn đăng ký giảng viên - Oncademy`

---

## 📊 Test Overview Mode (Development)

Để test mà không spam email thật cho users:

### Option 1: Email Override (Recommended)
```env
# Trong .env
NODE_ENV=development
EMAIL_TEST_RECIPIENT=your-test-email@gmail.com
```

**Kết quả:** Tất cả email sẽ gửi đến `EMAIL_TEST_RECIPIENT` thay vì email thật của user.

### Option 2: Script Test (Nhanh)
```bash
# Test riêng email templates (không qua UI)
node test-email.js
```

---

## ✅ Checklist Test

### Email Enrollment
- [ ] Stripe payment thành công
- [ ] Webhook trigger đúng
- [ ] Email gửi đến đúng user
- [ ] Subject đúng format
- [ ] Button link đến `/player/:courseId`
- [ ] Template hiển thị đẹp

### Email Approval
- [ ] Admin approve application
- [ ] Email gửi đến educator
- [ ] Subject đúng format
- [ ] Button link đến `/educator`
- [ ] Template hiển thị đẹp

### Email Rejection
- [ ] Admin reject application
- [ ] Email gửi đến applicant
- [ ] Subject đúng format
- [ ] Nội dung lịch sự
- [ ] Template hiển thị đẹp

---

## 🔍 Debug Tips

### 1. Check Server Logs
```bash
# Console sẽ show:
✅ Email transporter initialized (smtp.gmail.com:587)
📧 Enrollment email sent to user@example.com
✅ Enrollment email sent successfully: <message-id>
```

### 2. Email Không Nhận Được
- ✅ Check spam folder
- ✅ Check "Promotions" tab (Gmail)
- ✅ Verify EMAIL_FROM format: `Name <email@domain.com>`
- ✅ Check EMAIL_USER và EMAIL_PASSWORD

### 3. SMTP Errors
```
Error: Invalid login
→ Kiểm tra EMAIL_PASSWORD (phải là App Password với Gmail)

Error: Connection timeout  
→ Kiểm tra firewall/antivirus
→ Thử đổi SMTP_PORT=465 và SMTP_SECURE=true

Error: Recipient address rejected
→ Kiểm tra EMAIL_FROM có đúng format
```

### 4. Xem Email HTML Preview
Mở file `email-preview.html` trong browser để xem template trước khi gửi thật.

---

## 📝 Quick Commands

```bash
# Check config
node check-email-config.js

# Test emails (script)
node test-email.js

# Start server
npm run server

# Stripe webhook (development)
stripe listen --forward-to localhost:4000/api/webhooks/stripe
```

---

## 🎉 Success Criteria

Email service hoạt động tốt khi:
1. ✅ Không crash server nếu email config sai
2. ✅ Log rõ ràng khi gửi email
3. ✅ Email đến inbox trong vài giây
4. ✅ Template hiển thị đẹp trên mọi email client
5. ✅ Button links hoạt động đúng

---

**Need help?** Xem [EMAIL_SETUP_GUIDE.md](./EMAIL_SETUP_GUIDE.md) để biết thêm chi tiết!
