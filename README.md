# HuyDeBug Spa

Website SPA co kem backend Node de khach co the van hanh that tren server.

## Chay local de test

```bash
npm install
npm run server
npm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:8080/api

## Chay production

```bash
npm install
npm start
```

Lenh `npm start` se build frontend vao `dist` va chay server o cong `8080`. Khi do mo:

```text
http://localhost:8080
```

## Du lieu van hanh

Backend luu du lieu tap trung tai:

```text
server/storage/database.json
```

File nay gom tai khoan, dich vu, booking, khach hang va OTP tam thoi. Khi deploy that, can backup file nay dinh ky. Neu doi VPS/server, chuyen kem file nay de giu du lieu.

## Tai khoan admin

Admin mac dinh:

```text
xuanhuy132005@gmail.com
```

Mat khau khong hien thi trong UI va khong luu text thuong trong source. Neu can doi mat khau production, tao hash SHA-256 moi va thay `ADMIN_PASSWORD_HASH` trong `server/server.js`.

## Dang ky khach hang va OTP

Man hinh khach hang hien dang cho dang ky/dang nhap khong chan OTP de khach vao su dung duoc ngay khi ban giao. Backend van giu san API OTP tai `/api/auth/otp/request` va luong xac thuc OTP de sau nay noi SMTP, SendGrid, Twilio hoac Zalo OA neu chu spa muon bat xac minh that.

Ham gui OTP nam trong `notifyOtp` cua `server/server.js`. Hien tai ham nay chi log ma OTP tren server cho test noi bo, khong gui SMS/email that vi chua co tai khoan nha cung cap OTP.

## Luu y ban giao

- Nen dat `TOKEN_SECRET` rieng khi deploy:

```bash
TOKEN_SECRET="chuoi-bi-mat-rieng" npm start
```

- Khong xoa thu muc `server/storage` neu muon giu du lieu.
- Nen chay sau reverse proxy HTTPS nhu Nginx/Caddy khi ban cho khach dung that.
