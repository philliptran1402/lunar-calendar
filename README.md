# 🌙 âm lịch — Lịch Âm Việt Nam

[![npm](https://img.shields.io/npm/v/@lunar-calendar/sdk)](https://www.npmjs.com/package/@lunar-calendar/sdk)

SDK lịch âm Việt Nam + web app tra cứu.

```bash
npm i @lunar-calendar/sdk
``` Dark theme lấy cảm hứng từ **Tokyo Night** — tông màu quen thuộc của dân lập trình.

```
packages/sdk/    @lunar-calendar/sdk — SDK tự xây, độ chính xác cao, ZERO dependency
                 → đã publish npm, xem packages/sdk/README.md
packages/core/   engine cũ — CHỈ giữ làm oracle sinh dữ liệu đối chiếu, không dùng runtime
apps/web/        Vite + React PWA — chạy hoàn toàn client-side, dùng @lunar-calendar/sdk
```

## Chạy

```bash
corepack pnpm install
corepack pnpm test          # 15 test đối chiếu ngày Tết thật 2020–2028
corepack pnpm dev           # web app
corepack pnpm build
```

## Engine (`@lunar-calendar/sdk`)

Tự xây từ đầu: Meeus ch.49 đầy đủ (25 số hạng + 14 hiệu chỉnh hành tinh), VSOP87 rút gọn cho kinh độ **biểu kiến** của Mặt Trời, ΔT Espenak–Meeus + bảng đo thực IERS. Chi tiết và số đo độ chính xác: [packages/sdk/README.md](packages/sdk/README.md). Điểm khác biệt sống còn: **múi giờ GMT+7**, không phải GMT+8 của Trung Quốc. Cùng một kỳ trăng mới, lệch múi giờ có thể đẩy sang ngày khác ⇒ **tháng nhuận và ngày Tết lệch nhau**. Đừng bao giờ dùng thư viện lịch âm Trung Quốc cho lịch Việt.

```ts
import { solarToLunar, lunarToSolar, getDayInfo, getMonthGrid } from '@lunar-calendar/sdk';

solarToLunar(17, 2, 2026);        // { day: 1, month: 1, year: 2026, leap: false }  ← Tết Bính Ngọ
lunarToSolar(15, 8, 2025);        // { day: 6, month: 10, year: 2025 }              ← Trung Thu
lunarToSolar(1, 5, 2024, true);   // null — 2024 không có tháng 5 nhuận (không đoán bừa)
getDayInfo(14, 9, 2026);          // can chi, tiết khí, giờ hoàng đạo, ngày lễ, JD...
getMonthGrid(9, 2026);            // 42 ô, tuần bắt đầu Thứ Hai (chuẩn VN)
```

| API | Việc |
|---|---|
| `solarToLunar` / `lunarToSolar` | Chuyển đổi hai chiều, có cờ tháng nhuận |
| `getLeapMonth(year)` | Năm đó nhuận tháng mấy (null = không nhuận) |
| `lunarMonthLength` | Tháng thiếu (29) hay tháng đủ (30) |
| `canChiYear/Month/Day`, `conGiapYear` | Can chi & con giáp |
| `solarTermOf`, `isSolarTermStart` | 24 tiết khí |
| `luckyHours`, `dayQuality` | Giờ hoàng đạo, trực thần |
| `holidaysOf` | Lễ dương lịch + âm lịch, đánh dấu ngày nghỉ chính thức |
| `getDayInfo`, `getMonthGrid` | Gộp tất cả cho UI |

## PWA — cài lên máy, chạy offline

App tính toán **100% client-side** nên offline là thật chứ không phải "cache tạm": cài xong thì không cần mạng nữa, kể cả lần mở đầu tiên trong ngày.

- **Cài đặt**: Android/Chrome/Edge hiện nút cài; iOS Safari hiện hướng dẫn *Chia sẻ → Thêm vào MH chính* (iOS không có API cài đặt — và sẽ không bao giờ có)
- **Service worker** precache toàn bộ app shell (~356KB), font Google cache riêng theo `CacheFirst`
- Chạy ở chế độ `standalone` (không thanh trình duyệt), có icon maskable cho Android, apple-touch-icon cho iOS
- **Thanh trạng thái hệ điều hành đổi màu theo theme** đang chọn
- Mất mạng thì hiện huy hiệu `offline` ở header — app vẫn dùng bình thường

## Tuỳ biến

**9 bảng màu** quen thuộc với dân lập trình: Tokyo Night (mặc định), Dracula, Catppuccin Mocha, Nord, One Dark, Gruvbox Dark, Rosé Pine, Solarized Dark, và Catppuccin Latte (nền sáng). **2 ngôn ngữ**: Tiếng Việt / English. Cả hai đều nhớ lại giữa các lần mở.

> Về tương phản: `--muted` trong mọi theme đã được làm sáng hơn bản gốc để đạt WCAG AA (4.5) vì nó dùng cho chữ **có nghĩa**. Ngược lại, **accent đặc trưng giữ nguyên bản gốc** — Nord và Solarized vốn tương phản thấp là chủ ý thiết kế của chúng; sửa đi thì không còn là Nord nữa. Ai cần đạt AA tuyệt đối: dùng **Tokyo Night, Dracula, Mocha, Rosé Pine** hoặc **Latte**.

Tiếng Anh dịch cả dữ liệu lịch — tiết khí (`Bạch lộ` → `White Dew`), ngày lễ (`Tết Trung Thu` → `Mid-Autumn Festival`), con giáp, thứ. Can chi và trực giữ nguyên phiên âm tiếng Việt (danh từ riêng văn hoá).

## Web app — hai chế độ

Layout kiểu **dashboard: khoá chiều cao theo màn hình** — lịch tự giãn lấp đầy chỗ trống, không bao giờ phải cuộn trang trên laptop (màn hẹp ≤920px mới trả về luồng cuộn tự nhiên).

**`lịch`** — tra cứu tháng, chi tiết ngày, chuyển đổi hai chiều. Điều khiển bằng bàn phím: `←→` ngày · `↑↓` tuần · `PgUp/PgDn` tháng · `T` hôm nay · **`` ` ``** đổi chế độ.

**`terminal`** — gõ lệnh thay vì bấm chuột (dành cho dân dev): lịch sử lệnh `↑↓`, `Tab` gợi ý, `Ctrl+L` xoá màn hình. **Kéo cạnh phải / cạnh dưới / góc để đổi kích thước** — kích thước được nhớ lại giữa các lần mở, nháy đúp tay kéo (hoặc bấm `reset`) để về mặc định. Title bar hiện số cột × dòng thật, cập nhật ngay khi kéo.

```
amlich ~ $ amlich 20/10
20/10/2026 âm → 28/11/2026 dương lịch (Thứ Bảy)
còn 75 ngày nữa · 10.7 tuần · khoảng 2.5 tháng
năm Bính Ngọ (Ngựa) · Bính Ngọ [hoàng đạo]

amlich ~ $ tet 2027
Tết Đinh Mùi · mùng 1 nhằm 6/2/2027 (Thứ Bảy)
còn 145 ngày nữa

amlich ~ $ cal 2 2026          ┌─────────────────────────────┐
amlich ~ $ leap 2025           │ Tháng 2/2026           Ất Tỵ│
amlich ~ $ s2l 25/9/2026       ├─────────────────────────────┤
amlich ~ $ l2s 15/8/2025 -l    │  T2  T3  T4  T5  T6  T7  CN │
amlich ~ $ info 17/2/2026      │  16  17  18  19  20  21  22 │
amlich ~ $ hours               │  29 1/1   2   3   4   5   6 │
amlich ~ $ json 1/1/2027       └─────────────────────────────┘
```

| Lệnh | Việc |
|---|---|
| **`amlich <dd/mm>`** | **Ngày âm → ngày dương + còn bao nhiêu ngày** (giỗ chạp, rằm). Không ghi năm thì lấy **lần tới sắp đến**; thêm `-l` cho tháng nhuận |
| `today` · `info <ngày>` | Thông tin đầy đủ một ngày |
| `cal [mm] [yyyy]` | Lịch tháng ASCII, dương trên – âm dưới |
| `s2l` · `l2s [-l]` | Chuyển đổi hai chiều (`-l` = tháng nhuận) |
| `tet [yyyy]` · `leap [yyyy]` | Ngày Tết & đếm ngược · năm nhuận tháng mấy |
| `hours` · `json` | Giờ hoàng đạo · dữ liệu thô |
| `help` · `clear` · `gui` | Trợ giúp · xoá màn hình · về giao diện lịch |

Màu có nghĩa, không trang trí: **tím** = âm lịch · **cam** = mùng 1 · **vàng** = tiết khí · **đỏ** = ngày lễ · **xanh lá** = hoàng đạo · **xanh dương** = hôm nay.

## Độ tin cậy

15 test tự động đối chiếu dữ liệu kiểm chứng được:
- **9 ngày Tết thật 2020–2028** (cả hai chiều chuyển đổi)
- Tháng nhuận: 2023 nhuận tháng 2, 2025 nhuận tháng 6, 2024 không nhuận
- Trung Thu 2025, Giỗ Tổ Hùng Vương 2026
- Julian Day đi–về không mất mát, kể cả mốc chuyển lịch 15/10/1582

## Ghi chú văn hoá

Trực thần / giờ hoàng đạo là **tri thức truyền thống, trình bày để tham khảo** — không phải lời khuyên hay phán mệnh.
