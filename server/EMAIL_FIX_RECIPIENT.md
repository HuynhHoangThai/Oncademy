# 🔧 Fix: Email Gửi Đến Đúng Người Dùng

## ❌ Vấn đề

Email đang gửi cố định đến `hunhhongthi1412@gmail.com` thay vì email thực của user.

**Nguyên nhân:** Development mode override đang active.

---

## ✅ Giải pháp

### Cách 1: Tắt Development Override (Recommended)

Mở file `server/.env` và kiểm tra:

#### 1. Tìm dòng `EMAIL_TEST_RECIPIENT`
```env
# Nếu có dòng này:
EMAIL_TEST_RECIPIENT=hunhhongthi1412@gmail.com

# → XÓA hoặc COMMENT nó:
# EMAIL_TEST_RECIPIENT=hunhhongthi1412@gmail.com
```

#### 2. Kiểm tra `NODE_ENV`
```env
# Nếu có dòng này:
NODE_ENV=development

# → ĐỔI thành production HOẶC XÓA dòng này:
NODE_ENV=production
```

**Sau khi sửa, restart server:**
```bash
# Ctrl+C để dừng server
npm run server
```

---

### Cách 2: Chỉ Xóa EMAIL_TEST_RECIPIENT (Nhanh)

Nếu chỉ muốn giữ `NODE_ENV=development` nhưng vẫn gửi email đúng user:

Trong `.env`, **xóa hoặc comment** dòng:
```env
# EMAIL_TEST_RECIPIENT=hunhhongthi1412@gmail.com
```

**Logic:** Email chỉ override khi **CẢ HAI** điều kiện đúng:
- `NODE_ENV !== 'production'` **VÀ**
- `EMAIL_TEST_RECIPIENT` được set

→ Nếu xóa `EMAIL_TEST_RECIPIENT`, email sẽ gửi đến đúng user ngay cả trong dev mode.

---

## 🧪 Test Lại

### 1. Restart Server
```bash
npm run server
```

### 2. Test Approve Educator

1. Admin approve educator có email `mthuc949@gmail.com`
2. Check server log:
   ```
   # TRƯỚC (SAI):
   🔧 [DEV MODE] Overriding recipient: mthuc949@gmail.com → hunhhongthi1412@gmail.com
   
   # SAU (ĐÚNG):
   📧 Approval email sent to mthuc949@gmail.com
   ✅ Educator approval email sent successfully
   ```

3. Kiểm tra inbox của `mthuc949@gmail.com` → Email sẽ đến đúng!

---

## 📝 File .env Nên Có

```env
# Database
MONGO_URI=your_mongodb_uri

# Clerk
CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...

# Stripe
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...

# Email (Nodemailer)
EMAIL_USER=hunhhongthi1412@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Oncademy <hunhhongthi1412@gmail.com>

# Frontend
FRONTEND_URL=http://localhost:5173

# Environment (tùy chọn)
NODE_ENV=production

# ❌ XÓA dòng này nếu có:
# EMAIL_TEST_RECIPIENT=hunhhongthi1412@gmail.com
```

---

## ✅ Kết Quả Mong Đợi

Sau khi fix:
- User A có email `usera@gmail.com` apply educator → Email gửi đến `usera@gmail.com` ✅
- User B có email `userb@gmail.com` đăng ký khóa học → Email gửi đến `userb@gmail.com` ✅
- Admin email vẫn là `hunhhongthi1412@gmail.com` (chỉ để GỬI, không phải NHẬN)

---

**Sau khi sửa, hãy restart server và test lại!**
