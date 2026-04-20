# Authentication API Documentation
## PTIT English App — Backend

- **Base URL**: `http://localhost:8080`
- **Content-Type**: `application/json`
- **Auth**: Bearer Token (JWT) cho các endpoint có 🔒

---

## Response Format chung

Mọi response đều có cấu trúc:

```json
{
  "code": 200,
  "message": "Success",
  "data": { ... }
}
```

| Field | Type | Mô tả |
|---|---|---|
| `code` | `Long` | HTTP-like status code |
| `message` | `String` | Mô tả kết quả |
| `data` | `Object` | Payload (null nếu không có data) |

---

## Error Codes

| Code | Tên | Mô tả |
|---|---|---|
| `5001` | EMAIL_ALREADY_EXISTS | Email đã được đăng ký |
| `5002` | USERNAME_ALREADY_EXISTS | Username đã tồn tại |
| `5003` | INVALID_CREDENTIALS | Sai username hoặc mật khẩu |
| `5004` | TOKEN_EXPIRED | Access token đã hết hạn |
| `5005` | TOKEN_INVALID | Token không hợp lệ |
| `5006` | TOKEN_NOT_FOUND | Refresh token không tồn tại hoặc đã bị thu hồi |
| `5007` | USER_NOT_FOUND | Không tìm thấy user |
| `5008` | USER_INACTIVE | Tài khoản bị vô hiệu hoá |
| `5009` | USER_EMAIL_NOT_VERIFIED | Email chưa được xác thực |
| `6001` | OTP_INVALID | Mã OTP không đúng |
| `6002` | OTP_EXPIRED | OTP đã hết hạn (quá 5 phút) |
| `6003` | OTP_RESEND_TOO_SOON | Gửi lại OTP quá sớm (phải đợi 60 giây) |
| `6004` | USER_ALREADY_VERIFIED | Email đã được xác thực rồi |
| `6005` | REGISTRATION_PENDING | Tài khoản đang chờ xác thực OTP — OTP mới đã được gửi lại |
| `7001` | GOOGLE_TOKEN_INVALID | Google ID Token không hợp lệ hoặc đã hết hạn |
| `7002` | GOOGLE_TOKEN_AUDIENCE_MISMATCH | Token không khớp với Client ID của ứng dụng |
| `7003` | GOOGLE_EMAIL_NOT_VERIFIED | Email Google chưa được xác thực |

---

## AuthResponse Object

Trả về sau khi đăng nhập hoặc xác thực OTP thành công:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "1:550e8400-e29b-41d4-a716-446655440000",
  "tokenType": "Bearer",
  "accessTokenExpiresIn": 900,
  "user": {
    "id": 1,
    "email": "user@gmail.com",
    "username": "johndoe",
    "fullName": "John Doe",
    "roles": ["ROLE_USER"]
  }
}
```

| Field | Type | Mô tả |
|---|---|---|
| `accessToken` | `String` | JWT — dùng trong `Authorization: Bearer` header |
| `refreshToken` | `String` | Opaque token format `{userId}:{uuid}` — dùng để refresh |
| `tokenType` | `String` | Luôn là `"Bearer"` |
| `accessTokenExpiresIn` | `Long` | Thời gian hết hạn accessToken (giây) — mặc định `900` (15 phút) |
| `user.id` | `Long` | ID người dùng |
| `user.email` | `String` | Email |
| `user.username` | `String` | Username |
| `user.fullName` | `String` | Họ và tên |
| `user.roles` | `String[]` | Danh sách vai trò |

---

## 1. Đăng ký tài khoản (Bước 1)

```
POST /api/auth/register
```

Tạo tài khoản mới và gửi OTP 6 số về email để xác thực.  
Tài khoản ở trạng thái **chưa kích hoạt** cho đến khi xác thực OTP.

### Request Body

```json
{
  "email": "user@gmail.com",
  "password": "mypassword123",
  "username": "johndoe",
  "fullName": "John Doe"
}
```

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `email` | `String` | ✅ | Email hợp lệ |
| `password` | `String` | ✅ | Tối thiểu 6 ký tự |
| `username` | `String` | ❌ | Username (không bắt buộc) |
| `fullName` | `String` | ❌ | Họ tên đầy đủ |

### Response — 201 Created

```json
{
  "code": 201,
  "message": "Registration successful. Please check your email for the OTP verification code.",
  "data": null
}
```

### Lỗi có thể xảy ra

| Code | Mô tả |
|---|---|
| `5001` | Email đã được đăng ký và đã xác thực |
| `5002` | Username đã tồn tại |
| `6005` | Email đã đăng ký nhưng chưa xác thực → OTP mới đã được gửi lại |

---

## 2. Xác thực OTP (Bước 2)

```
POST /api/auth/verify-otp
```

Nhập OTP 6 số nhận được qua email để kích hoạt tài khoản.  
Thành công → trả về tokens để đăng nhập ngay.

### Request Body

```json
{
  "email": "user@gmail.com",
  "otp": "482931"
}
```

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `email` | `String` | ✅ | Email đã đăng ký |
| `otp` | `String` | ✅ | Đúng 6 chữ số |

### Response — 200 OK

```json
{
  "code": 200,
  "message": "Success",
  "data": { /* AuthResponse */ }
}
```

### Lỗi có thể xảy ra

| Code | Mô tả |
|---|---|
| `5007` | Không tìm thấy email |
| `6001` | OTP sai |
| `6002` | OTP đã hết hạn (quá 5 phút) — cần gửi lại |
| `6004` | Email đã được xác thực rồi |

---

## 3. Gửi lại OTP

```
POST /api/auth/resend-otp
```

Gửi lại OTP mới. Giới hạn **1 lần / 60 giây**.

### Request Body

```json
{
  "email": "user@gmail.com"
}
```

### Response — 200 OK

```json
{
  "code": 200,
  "message": "A new OTP has been sent to your email.",
  "data": null
}
```

### Lỗi có thể xảy ra

| Code | Mô tả |
|---|---|
| `5007` | Email không tồn tại |
| `6003` | Gửi lại quá sớm (phải đợi 60 giây) |
| `6004` | Tài khoản đã được xác thực rồi |

---

## 4. Đăng nhập bằng Username + Password

```
POST /api/auth/login
```

### Request Body

```json
{
  "username": "johndoe",
  "password": "mypassword123"
}
```

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `username` | `String` | ✅ | Username (không dùng email) |
| `password` | `String` | ✅ | Mật khẩu |

### Response — 200 OK

```json
{
  "code": 200,
  "message": "Success",
  "data": { /* AuthResponse */ }
}
```

### Lỗi có thể xảy ra

| Code | Mô tả |
|---|---|
| `5003` | Sai username hoặc mật khẩu |
| `5008` | Tài khoản bị khoá |
| `5009` | Email chưa xác thực — cần xác thực OTP trước |

---

## 5. Đăng nhập bằng Google

```
POST /api/auth/google
```

Dùng Google Sign-In SDK trên Android để lấy `idToken`, sau đó gửi lên backend.  
Lần đầu đăng nhập → tự động tạo tài khoản, không cần OTP.

### Request Body

```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
}
```

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `idToken` | `String` | ✅ | Google ID Token (JWT) lấy từ `GoogleSignInAccount.getIdToken()` trên Android |

### Response — 200 OK

```json
{
  "code": 200,
  "message": "Success",
  "data": { /* AuthResponse */ }
}
```

### Lưu ý cho Android

```kotlin
// Lấy idToken từ Google Sign-In:
val account: GoogleSignInAccount = task.getResult(ApiException::class.java)
val idToken: String? = account.idToken  // ← Gửi cái này lên backend
```

### Lỗi có thể xảy ra

| Code | Mô tả |
|---|---|
| `7001` | Token không hợp lệ hoặc đã hết hạn — cần sign-in lại |
| `7002` | Token không thuộc về app này |
| `7003` | Email Google chưa xác thực |
| `5008` | Tài khoản bị khoá |

---

## 6. Làm mới Access Token

```
POST /api/auth/refresh
```

Dùng khi `accessToken` hết hạn (sau 15 phút). Không cần đăng nhập lại.

### Request Body

```json
{
  "refreshToken": "1:550e8400-e29b-41d4-a716-446655440000"
}
```

### Response — 200 OK

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "1:550e8400-e29b-41d4-a716-446655440000",
    "tokenType": "Bearer",
    "accessTokenExpiresIn": 900,
    "user": { ... }
  }
}
```

> `refreshToken` trong response là token CŨ (không thay đổi), chỉ `accessToken` được tạo mới.

### Lỗi có thể xảy ra

| Code | Mô tả |
|---|---|
| `5005` | Refresh token sai định dạng |
| `5006` | Refresh token không tồn tại hoặc đã bị thu hồi (đã logout) |
| `5007` | User không tồn tại |
| `5008` | Tài khoản bị khoá |

---

## 7. Đăng xuất

```
POST /api/auth/logout
```

Thu hồi `refreshToken` hiện tại. `accessToken` vẫn còn hiệu lực cho đến khi hết hạn tự nhiên.

### Request Body

```json
{
  "refreshToken": "1:550e8400-e29b-41d4-a716-446655440000"
}
```

### Response — 200 OK

```json
{
  "code": 200,
  "message": "Logged out successfully",
  "data": null
}
```

---

## 8. Đăng xuất tất cả thiết bị 🔒

```
POST /api/auth/logout-all
Authorization: Bearer {accessToken}
```

Thu hồi tất cả `refreshToken` của user (đăng xuất khỏi mọi thiết bị).

### Response — 200 OK

```json
{
  "code": 200,
  "message": "Logged out from all devices",
  "data": null
}
```

---

## 9. Lấy thông tin user hiện tại 🔒

```
GET /api/auth/me
Authorization: Bearer {accessToken}
```

### Response — 200 OK

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "id": 1,
    "email": "user@gmail.com",
    "username": "johndoe",
    "fullName": "John Doe"
  }
}
```

---

## Luồng hoàn chỉnh cho Android

### Đăng ký thông thường
```
1. POST /api/auth/register     → Gửi OTP về email
2. POST /api/auth/verify-otp   → Nhập OTP → nhận tokens
3. Lưu accessToken + refreshToken vào SharedPreferences/DataStore
```

### Đăng nhập thông thường
```
1. POST /api/auth/login        → Nhận tokens
2. Lưu accessToken + refreshToken
```

### Đăng nhập Google
```
1. Google Sign-In SDK          → Lấy idToken
2. POST /api/auth/google       → Nhận tokens
3. Lưu accessToken + refreshToken
```

### Xử lý token hết hạn (HTTP 401)
```
1. accessToken hết hạn → nhận 401
2. POST /api/auth/refresh      → Nhận accessToken mới
3. Retry request gốc với accessToken mới
4. Nếu refresh cũng lỗi 5006  → Redirect về màn hình Login
```

### Quản lý Token trong Android (khuyến nghị)
```kotlin
// Interceptor OkHttp tự động refresh token
class AuthInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        var response = chain.proceed(addToken(chain.request()))
        if (response.code == 401) {
            val newToken = refreshToken()  // POST /api/auth/refresh
            if (newToken != null) {
                response = chain.proceed(addToken(chain.request(), newToken))
            } else {
                navigateToLogin()
            }
        }
        return response
    }
}
```

---

## Thông tin kỹ thuật

| Thông số | Giá trị |
|---|---|
| Access Token TTL | 15 phút |
| Refresh Token TTL | 7 ngày |
| OTP TTL | 5 phút |
| OTP Resend Cooldown | 60 giây |
| OTP Length | 6 chữ số |
| Password Hashing | BCrypt strength 12 |
| Token Storage | Redis |
| Google Client ID | `35790031845-lg7v97e8m39912hadbctj60o1gv2qc3d.apps.googleusercontent.com` |
