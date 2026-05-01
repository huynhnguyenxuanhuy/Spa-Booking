# HuyDebug

HuyDebug là một MVP gọi video kiểu Google Meet/Zoom, dùng WebRTC để gọi thật giữa các trình duyệt và một server Node nhỏ để signaling.

## Tính năng

- Tạo/vào phòng bằng mã phòng.
- Gọi video/audio thật bằng WebRTC.
- Bật/tắt mic, camera và chia sẻ màn hình.
- Copy link mời vào phòng.
- Chat trong phòng theo thời gian thực.
- Tải ảnh đại diện, lưu trong trình duyệt và hiển thị trong phòng.
- Host controls: khóa/mở phòng, duyệt người chờ, kick người tham gia, yêu cầu tắt mic/camera và gửi yêu cầu bật mic/camera có xác nhận ở máy người nhận.

## Bảo mật

- Production phục vụ asset từ `public-dist` đã minify bằng `npm run build`.
- API dùng peer token bí mật sau khi join phòng; chat, signaling, heartbeat và host controls đều yêu cầu token.
- Room ID dùng 12 ký tự hex ngẫu nhiên để khó đoán hơn.
- Server bật CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy và Permissions-Policy.
- API có kiểm tra Origin và rate limit cơ bản để giảm spam/lạm dụng.

## Chạy local

```bash
npm start
```

Mở `http://localhost:8080`, tạo phòng, copy link `/r/<ma-phong>` rồi gửi cho người khác.

## Ghi chú quan trọng

- Camera/mic chỉ hoạt động trên `localhost` hoặc website HTTPS.
- Gọi trong cùng Wi-Fi/LAN thường chạy ngay.
- Gọi xuyên mạng thật sự có thể cần TURN server. Hiện app đã có STUN public của Google, nhưng STUN không đảm bảo vượt được mọi NAT/firewall.
- Server signaling không lưu video/audio. Luồng media đi qua WebRTC giữa trình duyệt với trình duyệt.

Nếu có TURN server, cấu hình thêm:

```bash
TURN_URL=turn:your-turn-domain:3478
TURN_USERNAME=your-user
TURN_CREDENTIAL=your-password
npm start
```

## Deploy

Deploy lên Render/Fly/Railway/VPS đều được vì app chỉ cần Node >= 18:

```bash
npm start
```

Sau khi deploy HTTPS, gửi link phòng cho người khác để gọi.
