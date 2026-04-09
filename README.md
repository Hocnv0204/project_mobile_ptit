# Project Mobile PTIT

Repo gồm 2 phần:

- `frontend/`: Ứng dụng **Expo / React Native**
- `backend/`: **Spring Boot (Maven, Java 21)**

## Yêu cầu môi trường

### Frontend

- Node.js (khuyến nghị Node 18+; máy bạn đang dùng Node 20 là OK)
- npm hoặc yarn
- Expo CLI (không bắt buộc cài global, có thể dùng `npx`)
- Android Studio (Android Emulator) hoặc điện thoại thật (Expo Go)

### Backend

- Java **21**
- Maven

## Chạy Backend (Spring Boot)

### 0) Chuẩn bị database (PostgreSQL)

Backend mặc định kết nối PostgreSQL theo cấu hình trong `backend/src/main/resources/application.yaml`:

- **DB name**: `mobile_app_db`
- **Username**: `postgres`
- **Password**: `postgres`
- **JDBC URL**: `jdbc:postgresql://localhost:5432/mobile_app_db`

Bạn cần tạo database trước khi chạy:

```bash
createdb -U postgres mobile_app_db
```

Hoặc dùng `psql`:

```bash
psql -U postgres -c "CREATE DATABASE mobile_app_db;"
```

Nếu bạn muốn chạy PostgreSQL bằng Docker (nhanh, gọn), khuyên dùng lệnh sau (tạo sẵn DB `mobile_app_db`):

```bash
docker run -d --name mobile_app -p 5432:5432 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=mobile_app_db \
  postgres:latest
```

Kiểm tra container đang chạy:

```bash
docker ps | grep mobile_app
```

Nếu bạn đã chạy container theo lệnh **không có** `POSTGRES_DB`, bạn có thể tạo DB thủ công:

```bash
docker exec -it mobile_app psql -U postgres -c "CREATE DATABASE mobile_app_db;"
```

### 1) Cài dependencies

Tại thư mục `backend/`:

```bash
mvn -v
mvn clean install
```

### 2) Chạy dev

```bash
cd backend
mvn spring-boot:run
```

- Mặc định Spring Boot chạy ở cổng **8080** (nếu bạn không cấu hình `server.port`).
- File cấu hình chính: `backend/src/main/resources/application.yaml`.

### 3) Build jar (tuỳ chọn)

```bash
cd backend
mvn clean package
java -jar target/*.jar
```

## Chạy Frontend (Expo / React Native)

### 1) Cài dependencies

```bash
cd frontend
npm install
```

### 2) Cấu hình biến môi trường

Frontend hiện có sẵn file `frontend/.env` với các biến ví dụ:

- `EXPO_PUBLIC_API_URL` (API backend)
- `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID`

Lưu ý cấu hình `EXPO_PUBLIC_API_URL`:

- **Android Emulator**: dùng `http://10.0.2.2:8080/api` (đã có sẵn trong `.env`)
- **iOS Simulator**: thường dùng `http://localhost:8080/api`
- **Điện thoại thật**: dùng IP LAN của máy chạy backend, ví dụ `http://192.168.1.10:8080/api`

### 3) Chạy ứng dụng

```bash
cd frontend
npm run start
```

Các lệnh nhanh khác:

```bash
npm run android
npm run ios
npm run web
```

## Luồng chạy đề xuất

1. Chạy backend ở `http://localhost:8080`
2. Cập nhật `frontend/.env` trỏ đúng `EXPO_PUBLIC_API_URL`
3. Chạy frontend bằng `npm run start`, sau đó mở bằng Android Emulator / Expo Go

## Troubleshooting

- **Gọi API từ Android Emulator bị lỗi**: đảm bảo dùng `10.0.2.2` thay vì `localhost`.
- **Điện thoại thật không gọi được API**:
  - backend phải bind ra mạng LAN (mặc định OK)
  - dùng đúng IP LAN của máy chạy backend
  - kiểm tra firewall/port 8080
- **Port 8080 đang bị chiếm**: đổi `server.port` trong `backend/src/main/resources/application.yaml` và cập nhật lại `EXPO_PUBLIC_API_URL`.

