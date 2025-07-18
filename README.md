# Oncademy - Online Learning Platform

Oncademy là một nền tảng học trực tuyến hiện đại được xây dựng bằng React.js, cung cấp trải nghiệm học tập tương tác cho cả học viên và giảng viên.

## 🚀 Tính năng chính

### Dành cho Học viên:
- Duyệt và tìm kiếm khóa học
- Xem chi tiết khóa học với preview video
- Quản lý khóa học yêu thích
- Theo dõi lịch sử xem
- Đăng ký và theo dõi tiến độ học tập
- Hệ thống đánh giá và nhận xét

### Dành cho Giảng viên:
- Dashboard quản lý khóa học
- Tạo và chỉnh sửa khóa học
- Upload video và tài liệu
- Theo dõi học viên đăng ký
- Thống kê và báo cáo

## 🛠️ Công nghệ sử dụng

- **Frontend:** React.js, Vite
- **Styling:** Tailwind CSS
- **Router:** React Router DOM
- **Authentication:** Clerk
- **Video Player:** React YouTube
- **Icons & Assets:** SVG icons, Custom assets

## 📋 Yêu cầu hệ thống

- Node.js (v16.0.0 hoặc cao hơn)
- npm hoặc yarn
- Git

## 🚀 Hướng dẫn cài đặt và chạy

### Bước 1: Clone repository

```bash
git clone https://github.com/HuynhHoangThai/Oncademy.git
cd Oncademy
```

### Bước 2: Di chuyển vào thư mục client

```bash
cd client
```

### Bước 3: Cài đặt dependencies

```bash
npm install
```

Hoặc nếu bạn sử dụng yarn:

```bash
yarn install
```

### Bước 4: Cấu hình môi trường

Tạo file `.env` trong thư mục `client` và thêm các biến môi trường cần thiết:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

### Bước 5: Chạy development server

```bash
npm run dev
```

Hoặc với yarn:

```bash
yarn dev
```

### Bước 6: Mở ứng dụng

Mở trình duyệt và truy cập: `http://localhost:5173`

## 📁 Cấu trúc thư mục

```
Oncademy/
├── client/
│   ├── public/
│   │   ├── icon.svg
│   │   └── vite.svg
│   ├── src/
│   │   ├── assets/           # Hình ảnh, icons, logo
│   │   ├── components/       # React components
│   │   │   ├── educator/     # Components cho giảng viên
│   │   │   └── students/     # Components cho học viên
│   │   ├── context/          # React Context
│   │   ├── pages/            # Các trang chính
│   │   │   ├── educator/     # Trang giảng viên
│   │   │   └── students/     # Trang học viên
│   │   ├── App.jsx          # Component chính
│   │   ├── main.jsx         # Entry point
│   │   └── index.css        # Global styles
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
└── README.md
```

## 🔧 Scripts có sẵn

Trong thư mục `client`, bạn có thể chạy:

- `npm run dev` - Chạy development server
- `npm run build` - Build project cho production
- `npm run preview` - Preview bản build
- `npm run lint` - Kiểm tra lỗi code với ESLint

## 🌐 Định tuyến (Routes)

### Học viên:
- `/` - Trang chủ
- `/course-list` - Danh sách khóa học
- `/course/:id` - Chi tiết khóa học
- `/my-enrollments` - Khóa học đã đăng ký
- `/favorites` - Khóa học yêu thích
- `/view-history` - Lịch sử xem
- `/player/:courseId` - Trình phát video

### Giảng viên:
- `/educator` - Trang chính giảng viên
- `/educator/dashboard` - Dashboard
- `/educator/add-course` - Thêm khóa học mới
- `/educator/my-courses` - Quản lý khóa học
- `/educator/students-enrolled` - Học viên đã đăng ký

## 🎨 Styling

Project sử dụng Tailwind CSS cho styling. Cấu hình Tailwind được đặt trong `tailwind.config.js`.

### Theme colors:
- Primary: Blue (blue-600, blue-700)
- Secondary: Cyan (cyan-100)
- Accent: Red (for favorites), Green (for success)
- Text: Gray scale (gray-600, gray-800)

## 🔐 Authentication

Project sử dụng Clerk để xác thực người dùng. Đảm bảo bạn đã:
1. Tạo tài khoản Clerk
2. Tạo application mới
3. Copy publishable key vào file `.env`

## 📱 Responsive Design

Ứng dụng được thiết kế responsive với các breakpoints:
- `sm:` >= 640px
- `md:` >= 768px
- `lg:` >= 1024px
- `xl:` >= 1280px

## 🐛 Troubleshooting

### Lỗi thường gặp:

1. **Node modules không cài đặt được:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Port 5173 đã được sử dụng:**
   ```bash
   npm run dev -- --port 3000
   ```

3. **Lỗi Clerk authentication:**
   - Kiểm tra VITE_CLERK_PUBLISHABLE_KEY trong file .env
   - Đảm bảo domain được cấu hình đúng trong Clerk dashboard

## 📞 Hỗ trợ

Nếu bạn gặp vấn đề, vui lòng:
1. Kiểm tra [Issues](https://github.com/HuynhHoangThai/Oncademy/issues)
2. Tạo issue mới nếu chưa có
3. Liên hệ qua email: your-email@example.com

## 🤝 Đóng góp

1. Fork project
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📄 License

Project này được phân phối dưới MIT License. Xem file `LICENSE` để biết thêm chi tiết.

## 👨‍💻 Tác giả

**Huỳnh Hoàng Thái**
- GitHub: [@HuynhHoangThai](https://github.com/HuynhHoangThai)

---

⭐ Nếu project này hữu ích, hãy cho một star trên GitHub nhé!
