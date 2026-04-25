# 🚀 LinguaBoost — PTIT Mobile English

<p align="left">
  <img src="https://img.shields.io/badge/Platform-iOS%20%7C%20Android-000020?logo=expo&logoColor=white" alt="Platform">
  <img src="https://img.shields.io/badge/Client-React%20Native-61DAFB?logo=react&logoColor=black" alt="React Native">
  <img src="https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Backend-Spring%20Boot-6DB33F?logo=springboot&logoColor=white" alt="Spring Boot">
  <img src="https://img.shields.io/badge/Architecture-REST%20%2B%20Layered%20API-blue" alt="Architecture">
  <img src="https://img.shields.io/badge/DB-PostgreSQL-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Cache-Redis-DC382D?logo=redis&logoColor=white" alt="Redis">
</p>

<p align="center">
  <img src="frontend/assets/icon.png" alt="LinguaBoost" width="120">
</p>

Ứng dụng học tiếng Anh đa nền tảng (Expo / React Native), backend **Spring Boot** và **CMS web** tuỳ chọn. Tập trung lộ trình từ vựng, ôn tập tương tác, nghe — viết — đọc, có tích hợp **AI** (Groq / Gemini) cho nội dung và xử lý từ.

---

## 🎯 1. Chức năng

LinguaBoost hướng tới ba nhóm mục tiêu:

- ⚡ **Học có cấu trúc:** bài từ vựng theo level / topic, quiz — flashcard — điền chỗ trống, theo dõi tiến độ và thống kê trên Home.
- 📚 **Nghe — nói — viết:** dictation (nghe chép), podcast theo chủ đề / level, bài writing có chấm điểm và lịch sử.
- 🤖 **AI đồng hành:** sinh / format từ vựng, hỗ trợ luồng nội dung phía admin (CMS) và API podcast / bài học tùy cấu hình.

---

## 🌟 2. Tính năng cụ thể

### 🧭 Authentication

- Đăng ký, xác minh **OTP email**, đăng nhập, **đăng nhập Google**, làm mới token.
- Quên mật khẩu (OTP), đặt mật khẩu mới, đổi mật khẩu khi đã đăng nhập.

### 🏠 Home & điều hướng

- **Home** tổng quan, thống kê từ vựng (`home-stats`).
- **Streak (chuỗi học tập)**: hiển thị số ngày học liên tiếp, xem màn chi tiết dạng lịch và nhắc học qua push notification.
- Điều hướng theo module: từ vựng, dictation, podcast, writing, hồ sơ.

### 🔥 Streak (Chuỗi học tập)

- Theo dõi chuỗi ngày học liên tiếp: `currentStreak`, `longestStreak`, `lastActivityDate`, `alreadyCheckedInToday`.
- API: `GET /api/streaks` (xem streak), `POST /api/streaks/check-in` (điểm danh trong ngày — idempotent).
- Streak tự được cập nhật khi người dùng hoàn thành hoạt động học ở các module (quiz/flashcard/dictation/podcast/writing).
- Scheduler nhắc học qua push mặc định 20:00 mỗi ngày (Asia/Ho_Chi_Minh), điều hướng `StreakDetailsScreen`.

### 📖 Vocabulary Module

- Danh sách bài học từ vựng, chi tiết bài, thêm từ (kể cả luồng gợi ý **AI**).
- **Flashcard** (phiên ôn, gửi kết quả review).
- **Quiz** (trắc nghiệm) và **Fill blank** (điền chỗ trống).
- Thống kê trên màn từ vựng / Home.

### 🎧 Dictation Module

- Danh sách bài dictation, phát theo đoạn (segment).
- Đồng bộ tiến độ, đánh dấu hoàn thành, nộp từng đoạn.

### 🎙️ Podcast Module

- Khám phá podcast theo level / topic, phát nội dung.
- Lịch sử nghe; API hỗ trợ sinh nội dung (AI) phía server.

### ✍️ Writing Module

- Chọn chủ đề / bài writing, luyện viết, **chấm điểm**, xem lịch sử và tiến độ.

### 👤 Profile & Settings

- Xem / cập nhật thông tin, **cấp độ (level)** người học.
- Đổi mật khẩu, giao diện tối (dark) theo cấu hình app (`app.json`).

### 🖥️ CMS 

- **`frontend_cms`:** Vite + React + Ant Design — quản trị dictation, topic, lesson (admin), v.v. qua REST API.

---

## 🏗️ 3. Kiến trúc & tổ chức

Dự án tách **client di động**, **CMS web** và **API** rõ ràng.

### Tổng thể hệ thống

```text
┌──────────────────────┐     ┌──────────────────────┐
│   LinguaBoost App    │     │    frontend_cms      │
│  (Expo / RN + TS)    │     │  (Vite + React + UI) │
└──────────┬───────────┘     └──────────┬───────────┘
           │    HTTPS / REST           │
           └─────────────┬─────────────┘
                         ▼
              ┌──────────────────────┐
              │   Spring Boot API    │
              │  Security · JWT ·    │
              │  JPA · Flyway        │
              └──────────┬───────────┘
           ┌─────────────┼─────────────┐
           ▼             ▼             ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │PostgreSQL│  │  Redis   │  │ AI / Mail│
    │          │  │ OTP·JWT  │  │ Cloudinary│
    └──────────┘  └──────────┘  └──────────┘
```

### Luồng phía mobile (UI → API)

```text
┌───────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐
│  Screens  │───►│ store /   │───►│   api/    │───►│  Axios    │
│ (React    │    │ hooks     │    │ (REST)    │    │  client   │
│ Native)   │    │           │    │           │    │           │
└───────────┘    └───────────┘    └───────────┘    └─────┬─────┘
       ▲                                                  │
       │                                                  ▼
       │                                         ┌─────────────────┐
       └─────────────────────────────────────────┤  Spring Boot    │
                                                 │  /api/**        │
                                                 └─────────────────┘
```

### Luồng phía backend (layered)

```text
┌───────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐
│Controller │───►│ Service   │───►│Repository │───►│PostgreSQL │
│  (REST)   │    │ (nghiệp vụ)│   │   (JPA)   │    │           │
└───────────┘    └───────────┘    └───────────┘    └───────────┘
       │                 │
       │                 └──► Redis (OTP, refresh token)
       └──► Spring Security + JWT / OAuth (Google)
```

---

## 🛠️ 4. Công nghệ chính

### Mobile (`frontend`)

- ⚛️ **React 19** + **React Native** (Expo ~54)
- 🧭 **React Navigation** (stack, tab, drawer)
- 🎨 **React Native Paper**, **Expo** (Secure Store, Audio, Video, Notifications, Image Picker, …)
- 📡 **Axios**, **Zustand** / **Redux Toolkit**
- 📝 **react-hook-form** + **Zod**
- 🔐 **Google Sign-In** (`@react-native-google-signin/google-signin`)

### CMS (`frontend_cms`)

- ⚡ **Vite 8**, **React 19**, **Ant Design 6**
- 🔄 **TanStack Query**, **Zustand**, **Axios**

### Backend (`backend`)

- ☕ **Java 21**, **Spring Boot 3.2.5**
- 🔒 **Spring Security**, **JWT** (jjwt), **OAuth2** (Google)
- 🗄️ **Spring Data JPA**, **PostgreSQL**, **Flyway**
- 📮 **Redis** (OTP, refresh token), **Spring Mail**
- ☁️ **Cloudinary**, **OpenFeign**, **MapStruct**, **Lombok**
- 📘 **Springdoc OpenAPI** (Swagger UI)

### AI & tích hợp

- 🤖 **Groq** / **Google Gemini** (cấu hình `application.yaml`, biến môi trường)

---

## 🗂️ 5. Cấu trúc thư mục (chi tiết)

```text
project_mobile_ptit/
├── backend/
│   ├── src/main/java/com/ptit/mobile/backend/
│   │   ├── controller/          # REST: auth, vocab, quiz, flashcard, dictation, podcast, writing, topic, level, ai, ...
│   │   ├── service/             # Nghiệp vụ + impl
│   │   ├── repository/          # JPA + Redis helpers
│   │   ├── entity/, dto/, config/, security/, exception/, ...
│   │   └── ...
│   ├── src/main/resources/
│   │   ├── application.yaml
│   │   └── db/migration/        # Flyway
│   ├── pom.xml
│   └── docker/                  # (tuỳ dự án)
├── frontend/                    # LinguaBoost — Expo
│   ├── src/
│   │   ├── api/                 # Client REST theo module
│   │   ├── screens/
│   │   │   ├── auth/            # Login, Register, OTP, Forgot/Reset, Change password, Select level
│   │   │   ├── home/            # Home
│   │   │   ├── vocab/           # Vocabulary, lesson detail, flashcard, quiz, fill-blank, AI vocab
│   │   │   ├── dictation/       # Danh sách + player
│   │   │   ├── podcast/         # Danh sách + player + drawer
│   │   │   ├── writing/         # Topic/lesson, practice, history, active lessons
│   │   │   ├── profile/         # Profile
│   │   │   ├── WelcomeScreen.tsx
│   │   │   └── ...
│   │   ├── navigation/
│   │   ├── components/
│   │   ├── store/, hooks/, services/, types/, utils/, constants/, i18n/
│   │   └── config/
│   ├── assets/                  # icon, splash, fonts, animations
│   ├── app.json
│   └── package.json
├── frontend_cms/
│   ├── src/
│   │   ├── api/
│   │   ├── pages/
│   │   ├── layouts/
│   │   └── store/
│   ├── vite.config.ts
│   └── package.json
└── README.md
```

---

## ▶️ 6. Hướng dẫn chạy project

### 📌 Yêu cầu

- **Git**
- **Docker** (khuyến nghị) cho PostgreSQL + Redis
- **Java 21**, **Maven 3.8+**
- **Node.js 18+** (khuyến nghị 20+) cho `frontend` và `frontend_cms`
- **Android Studio** / **Xcode** (tuỳ nền) hoặc thiết bị + **Expo Go**

### 🧭 Các bước

1. Clone repository:

```bash
git clone https://github.com/Hocnv0204/project_mobile_ptit.git
cd project_mobile_ptit
```

2. **PostgreSQL** — tạo DB `mobile_app_db` (hoặc Docker):

```bash
docker run -d --name mobile_app_db -p 5432:5432 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=mobile_app_db \
  postgres:latest
```

3. **Redis** (bắt buộc cho OTP / refresh token):

```bash
docker run -d --name mobile_app_redis -p 6379:6379 redis:latest
```

4. Chạy **backend**:

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

- API: **`http://localhost:8080`**
- **Swagger UI:** [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)
- **OpenAPI:** [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

5. Cấu hình **`frontend/.env`** (xem mục [Cấu hình nhanh](#cấu-hình-nhanh) bên dưới), sau đó:

```bash
cd frontend
npm install
npm run start
```

6. *(Tuỳ chọn)* CMS:

```bash
cd frontend_cms
npm install
npm run dev
```

---

## 🧪 7. User flow gợi ý để demo đầy đủ

1. Mở app → **Welcome** / chọn level nếu được hỏi.
2. **Đăng ký** → nhập **OTP email** → hoặc **Đăng nhập** / **Google**.
3. **Home:** xem tổng quan / thống kê từ vựng.
4. **Vocabulary:** mở bài học → **Flashcard** → **Quiz** → **Fill blank** → thử thêm từ (kể cả luồng AI nếu bật).
5. **Dictation:** chọn bài → nghe — chép — đồng bộ tiến độ.
6. **Podcast:** lọc theo level/topic → phát → xem lịch sử.
7. **Writing:** chọn đề → viết → **chấm điểm** → xem lịch sử.
8. **Profile:** cập nhật thông tin, **level**, đổi mật khẩu.
9. *(Admin)* Mở **frontend_cms**, đăng nhập API phù hợp → thao tác nội dung (dictation, topic, lesson, …).

---

## Cấu hình nhanh

### Backend (`backend/src/main/resources/application.yaml`)

Ghi đè bằng biến môi trường khi deploy; tiêu biểu:

| Biến | Mô tả |
|------|--------|
| `SPRING_DATASOURCE_*` | PostgreSQL |
| `SPRING_DATA_REDIS_*` | Redis |
| `JWT_SECRET` | Bắt buộc môi trường thật |
| `GOOGLE_CLIENT_ID`, `GOOGLE_ANDROID_CLIENT_ID` | Google |
| `SPRING_MAIL_*` | Gửi OTP |
| `GROQ_*`, `GEMINI_*`, `AI_PROVIDER` | AI |

### Mobile — `frontend/.env`

- `EXPO_PUBLIC_API_URL` — ví dụ `http://10.0.2.2:8080/api` (Android Emulator), `http://localhost:8080/api` (iOS Simulator), hoặc IP LAN cho máy thật.
- `EXPO_PUBLIC_CLOUDINARY_*`, `EXPO_PUBLIC_GOOGLE_CLIENT_ID` — tuỳ tính năng.

Đồng bộ thêm `extra` trong [`frontend/app.json`](frontend/app.json) nếu cần.

### CMS — `frontend_cms/.env`

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

---

## 📚 API Reference (tóm tắt)

Base: **`http://localhost:8080`**. Nhiều route cần **`Authorization: Bearer <access_token>`** — chi tiết schema tại **Swagger**.

| Nhóm | Base path | Ghi chú |
|------|-----------|---------|
| Auth | `/api/auth` | register, verify-otp, login, google, refresh, logout, forgot/reset password, me, … |
| User | `/api/users` | `/me/level` |
| Vocab / Lesson | `/api/vocab`, `/api/lesson-vocab` | CRUD bài học, từ, admin/system |
| Streak | `/api/streaks` | `GET /api/streaks` lấy streak; `POST /api/streaks/check-in` điểm danh |
| Flashcard | `/api/flashcard` | session, review |
| Quiz | `/api/quiz` | session, check, fill-blank |
| Dictation | `/api/dictations`, `/api/user/progress`, … | + `/api/admin/dictations` |
| Podcast | `/api/podcasts` | generate, list, history |
| Writing | `/api/lesson-writings`, `/api/admin/lessons` | grade, progress, AI admin |
| Topic / Level | `/api/topics`, `/api/admin/topics`, `/api/levels` | |
| AI | `/api/ai/terms/format` | Chuẩn hoá từ (Gemini) |

**Thử nhanh:**

```bash
curl -s -H "Authorization: Bearer <ACCESS_TOKEN>" \
  http://localhost:8080/api/auth/me
```

**Streak (thử nhanh):**

```bash
# Lấy streak hiện tại
curl -s -H "Authorization: Bearer <ACCESS_TOKEN>" \
  http://localhost:8080/api/streaks

# Điểm danh (idempotent trong ngày)
curl -s -X POST -H "Authorization: Bearer <ACCESS_TOKEN>" \
  http://localhost:8080/api/streaks/check-in
```

---

## 🔧 Troubleshooting

- **Android Emulator không gọi được API:** dùng `10.0.2.2` thay `localhost`.
- **Máy thật:** cùng Wi‑Fi, mở firewall cổng **8080**, dùng IP LAN của máy chạy backend.
- **OTP / đăng nhập lỗi:** kiểm tra **Redis** và cấu hình mail SMTP.
- **Port 8080 bận:** đổi `server.port` và cập nhật URL trên app + CMS.

---

*Badge CI / coverage: cập nhật sau khi gắn pipeline (GitHub Actions, v.v.).*
