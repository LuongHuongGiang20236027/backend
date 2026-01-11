# EduHub Backend

Backend API server cho hệ thống học tập EduHub, được xây dựng bằng Node.js + Express.

## Công nghệ sử dụng

- **Node.js** + **Express.js** - Web framework
- **PostgreSQL** (via Neon) - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing

## Cài đặt

1. Di chuyển vào thư mục backend:
```bash
cd backend
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```

4. Cập nhật các biến môi trường trong `.env`:
   - `DATABASE_URL`: Connection string PostgreSQL/Neon
   - `JWT_SECRET`: Secret key cho JWT (đổi thành chuỗi random)
   - `FRONTEND_URL`: URL của frontend (mặc định http://localhost:3000)

5. Chạy SQL scripts để tạo database schema:
   - Kết nối tới database và chạy file `scripts/001-create-enums-and-tables.sql`
   - Chạy file `scripts/002-seed-data.sql` để thêm dữ liệu mẫu

6. Chạy server:
```bash
# Development mode với auto-reload
npm run dev

# Production mode
npm start
```

Server sẽ chạy tại `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký tài khoản
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user hiện tại
- `POST /api/auth/logout` - Đăng xuất

### Assignments
- `GET /api/assignments` - Lấy danh sách bài tập
- `GET /api/assignments/:id` - Lấy chi tiết bài tập
- `POST /api/assignments/submit` - Nộp bài tập
- `GET /api/assignments/:id/submissions` - Lấy danh sách bài nộp (teacher only)

### Documents
- `GET /api/documents` - Lấy danh sách tài liệu
- `GET /api/documents/:id` - Lấy chi tiết tài liệu
- `POST /api/documents/like` - Like/Unlike tài liệu

### User
- `PUT /api/user/update` - Cập nhật thông tin user

## Cấu trúc thư mục

```
backend/
├── db/
│   └── database.js          # Database connection
├── lib/
│   └── auth.js             # Authentication utilities
├── routes/
│   ├── auth.js             # Auth routes
│   ├── assignments.js      # Assignment routes
│   ├── documents.js        # Document routes
│   └── user.js             # User routes
├── server.js               # Main server file
├── package.json
└── .env
