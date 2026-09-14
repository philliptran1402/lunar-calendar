# @lunar-calendar/sdk

SDK lịch âm–dương **tự xây**, độ chính xác thiên văn cao, zero dependency.

> **Nói rõ trước:** lịch âm Việt Nam là **quy tắc được định nghĩa sẵn** (Quyết định 121/CP 1967, Điều 3: tính theo giờ chính thức VN = kinh tuyến 105°Đ). Không ai được phép "sáng tạo" ra ngày khác. Vì vậy mục tiêu của SDK này **không phải ra ngày khác**, mà là: cài đặt quy tắc đó **chính xác hơn**, **minh bạch hơn**, và **trung thực về chỗ không chắc chắn**.

## Vì sao viết lại thay vì dùng bản phổ biến

Bản `amlich-hnd.js` (Hồ Ngọc Đức, 2006) là chuẩn de-facto ở VN. Sau khi đọc mã nguồn và đo đạc, đây là ba điểm yếu thật:

| | Bản phổ biến | SDK này |
|---|---|---|
| **Trăng mới** | Meeus *Astronomical Formulae for Calculators* (1982), mốc 1900, **13 số hạng** | Meeus *Astronomical Algorithms* ch.49, mốc J2000, **25 số hạng + 14 hiệu chỉnh hành tinh A1–A14** |
| **Kinh độ Mặt Trời** | Ch.24 độ chính xác thấp (3 số hạng), dùng kinh độ **hình học** | **VSOP87 rút gọn** (~90 số hạng) + FK5 + chương sai + tinh sai → kinh độ **biểu kiến** |
| **ΔT (TT→UT)** | Đa thức tự chế, **âm ở thế kỷ 20** (−29.8s năm 1944 trong khi thực tế +26.6s) | Espenak–Meeus (2006) + **bảng đo thực IERS** cho thời hiện đại, có vùng pha trộn, cho phép nạp nguồn riêng |

Bỏ A1–A14 gây sai tới **112 giây**; dùng kinh độ hình học thay vì biểu kiến sai tới **~15 phút**; ΔF sai lệch làm **lệch ngày một cách hệ thống**. Cả ba đều chỉ lộ ra khi sự kiện rơi sát nửa đêm — nhưng khi lộ thì sai cả tháng lịch.

## Độ chính xác — đo được, không phải tuyên bố

Đối chiếu với bảng NASA/Espenak (`astropixels.com/ephemeris`):

```
Trăng mới 2026 (12 kỳ)     : lệch trung bình  ~1s,  tối đa 35s
Điểm chí/phân 2020–2050    : lệch trung bình −11s,  tối đa 57s
Công thức độ chính xác thấp: lệch 5.0″ ≈ 121s  ← lý do phải dùng VSOP87
```

Lưu ý trung thực: bảng NASA làm tròn đến **phút** (±30s) và được tính bằng chính mô hình ΔT của Espenak. Khi dùng cùng mô hình ΔT đó, sai lệch trăng mới trung bình còn **1.0 giây** — tức phần chênh còn lại là do mô hình ΔT chứ không phải thiên văn. SDK mặc định dùng **ΔT đo được** vì lịch dân dụng cần giờ UT thật.

## Đối chiếu 73.414 ngày (1900–2100)

```
Khớp : 73.292 / 73.414  (99,8338%)
Lệch : 122 ngày = 6 đoạn
```

Phân tích từng đoạn lệch:

| Đoạn | Nguyên nhân | Ai đúng |
|---|---|---|
| 1944, 1967, 2072, 2077 | Sóc cách nửa đêm **2–72 giây**; ΔT của bản cũ lệch 56–145s đẩy sang ngày khác | SDK này có ΔT đúng hơn, **nhưng 1967 chỉ cách 2 giây → không ai chắc được** |
| 2054, 2062 | Bản cũ trả về **ngày âm = 0** (`0/4/2054`) — lỗi off-by-one | SDK này (trả 30/3) |

## Tính năng riêng: đánh dấu ngày KHÔNG CHẮC CHẮN

Hệ quả trực tiếp của phân tích trên. Khi thời điểm sóc quá sát nửa đêm, **không cài đặt nào dám chắc** — ΔT tương lai phụ thuộc tốc độ quay của Trái Đất, không thể biết trước. Thay vì im lặng đoán bừa:

```ts
const d = solarToLunar(7, 7, 1967);
// { day: 1, month: 6, year: 1967, leap: false, uncertain: true }
//   → sóc lúc 23:59:58 giờ VN, cách nửa đêm 2 giây
```

Ngưỡng bất định tự nới theo thời gian (±20s trong kỳ có số đo, tăng dần khi ra xa) — xem `uncertaintySeconds()`.

## API tiện dụng

```ts
import { getDayInfo, getMonthGrid } from '@lunar-calendar/sdk';

getDayInfo(17, 2, 2026);   // âm lịch + can chi + tiết khí + giờ hoàng đạo + ngày lễ
getMonthGrid(2, 2026);     // 42 ô lịch tháng, tuần bắt đầu Thứ Hai (chuẩn VN)
```

## Cài

```bash
npm i @lunar-calendar/sdk
```

## Dùng

```ts
import { solarToLunar, lunarToSolar, leapMonthOf, VN_TIMEZONE, CHINA_TIMEZONE } from '@lunar-calendar/sdk';

solarToLunar(17, 2, 2026);            // { day:1, month:1, year:2026, leap:false, uncertain:false }
lunarToSolar(1, 1, 1968);             // { day:29, month:1, year:1968 }  ← Tết Mậu Thân (VN)
lunarToSolar(1, 1, 1968, false, CHINA_TIMEZONE); // { day:30, ... }      ← Trung Quốc, lệch 1 ngày
leapMonthOf(1985);                    // 2   (Trung Quốc nhuận tháng 10 của 1984 → Tết lệch cả tháng)
```

Điểm vào theo tầng (tree-shakeable): `@lunar-calendar/sdk/astro`, `/calendar`, `/vn`.

**Múi giờ là tham số, không phải hằng số cứng** — cùng thuật toán chạy được lịch Trung Quốc (UTC+8), Hàn, Nhật; và nhận cả hàm `(jd) => offset` cho lịch sử múi giờ.

## Kiểm chứng lịch sử (phép thử vàng)

6 năm Việt Nam ăn Tết lệch Trung Quốc — tái hiện đúng **cả 6** chỉ bằng đổi múi giờ:

| Năm | Việt Nam (UTC+7) | Trung Quốc (UTC+8) |
|---|---|---|
| 1968 | 29/1 | 30/1 |
| 1969 | 16/2 | 17/2 |
| **1985** | **21/1** | **20/2** *(lệch cả tháng — do vị trí tháng nhuận)* |
| 2007 | 17/2 | 18/2 |
| 2030 | 2/2 | 3/2 |
| 2053 | 18/2 | 19/2 |

## Kiến trúc

```
src/time/      julian.ts (JD, kiểu TT/UT tách bạch) · deltat.ts (Espenak–Meeus + đo thực)
src/astro/     nutation.ts · sun.ts (VSOP87) · moon.ts (Meeus 49 đầy đủ) · search.ts (dò nghiệm)
src/calendar/  lunisolar.ts — quy tắc lịch, múi giờ là tham số, có cache
src/vn/        canchi · solar-term · holiday — phần riêng của Việt Nam
```

Kiểu `JdTT` và `JdUT` được **branded** để trình biên dịch chặn việc lẫn hai thang thời gian — nguồn sai lệch hệ thống phổ biến nhất.

Hiệu năng: ~950.000 ngày/giây (có cache theo chu kỳ).

## Nguồn

Meeus, *Astronomical Algorithms* 2nd ed. (ch. 22, 25, 47, 49) · Espenak & Meeus, [ΔT polynomials](https://eclipse.gsfc.nasa.gov/SEhelp/deltatpoly2004.html) · [Bảng trăng mới & điểm chí NASA](https://astropixels.com/ephemeris/) · [Quyết định 121/CP](https://thuvienphapluat.vn/van-ban/Linh-vuc-khac/Quyet-dinh-121-CP-tinh-lich-quan-ly-lich-cua-Nha-nuoc-18212.aspx) · Trần Tiến Bình, *Lịch Việt Nam thế kỷ XX–XXI*.
