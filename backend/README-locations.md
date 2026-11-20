# Dữ liệu tỉnh/thành, quận/huyện

File: `src/locations/data/vn-locations.json` — nạp bằng `npm run seed:locations` (chạy lại không tạo trùng, upsert theo mã).

## Nguồn và giới hạn

- Nguồn: bộ dữ liệu hành chính công khai provinces.open-api.vn (cấu trúc trước 2025: tỉnh/thành, quận/huyện; mã theo Tổng cục Thống kê, GSO).
- **Hiện chỉ có 3 thành phố, đủ toàn bộ quận/huyện của mỗi nơi:** Hà Nội (01, 30 quận/huyện), Đà Nẵng (48, 8), TP. Hồ Chí Minh (79, 22).
- Chưa có 60 tỉnh/thành còn lại: môi trường làm việc không tải được cả bộ dữ liệu, và mã không được đoán. Muốn thêm: bổ sung mục cùng dạng vào file JSON rồi chạy lại `npm run seed:locations`.
- Mã tỉnh 2 chữ số, mã quận/huyện 3 chữ số, dạng chuỗi (vd "01", "765"). Quận/huyện đã sáp nhập trước đó (vd mã 762, 763 của TP. HCM) không còn trong nguồn.
