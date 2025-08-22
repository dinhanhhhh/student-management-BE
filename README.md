# Student Management API

Hệ thống quản lý sinh viên dùng **Node.js + Express + MongoDB (Mongoose)**. Hỗ trợ xác thực JWT, phân quyền, CRUD sinh viên và bộ seed dữ liệu.

> **Repo:** https://github.com/dinhanhhhh/student-management

## 🚀 Tech stack
- Runtime: Node.js
- Framework: Express
- DB: MongoDB (Mongoose)
- Auth: JWT (Access/Refresh)
- Docs/Test: Postman Collection (`student-management.postman_collection.json`)

## 📦 Yêu cầu
- Node.js >= 18
- MongoDB URI

## 🔧 Cấu hình môi trường
Tạo file `.env` (đừng commit). Tham khảo mẫu dưới và tạo thêm một file `.env.example` để chia sẻ cấu hình không-bí-mật.

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority

JWT_ACCESS_SECRET=change_me
JWT_REFRESH_SECRET=change_me
ACCESS_TOKEN_EXPIRES=15m
REFRESH_TOKEN_EXPIRES=7d
COOKIE_NAME_AT=access_token
COOKIE_NAME_RT=refresh_token

npm install
npm run dev        # nếu bạn có nodemon
# hoặc
npm start
Cấu trúc thư mục (rút gọn)
.
├─ config/           # cấu hình (db, …)
├─ controllers/      # controller cho route
├─ middlewares/      # middleware (auth, error, …)
├─ models/           # schema Mongoose
├─ routes/           # định nghĩa endpoint
├─ seed/             # script seed dữ liệu
├─ utils/            # helper
├─ app.js            # entry Express
└─ package.json
Triển khai (Render)

Build Command: npm install

Start Command: npm start

Environment: thêm các biến trong mục Environment của Render.

Lưu ý trong code lắng nghe cổng:
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
Scripts gợi ý
{
  "scripts": {
    "dev": "nodemon app.js",
    "start": "node app.js",
    "seed": "node seed/index.js"
  }
}
License

---

# 3) Gỡ `.env` và `node_modules` ra khỏi repo (đang bị track)

Vì bạn **đã lỡ commit `.env` và `node_modules/`**, ta cần:
1) Thêm `.gitignore` như trên.
2) Ngừng theo dõi (untrack) các mục đã commit:
```bash
# Từ thư mục gốc repo local đã clone
git pull
# Tạo/ghi file .gitignore như trên, rồi:
git rm -r --cached node_modules .env
git add .gitignore
git commit -m "chore: add .gitignore and untrack env/node_modules"
git push
