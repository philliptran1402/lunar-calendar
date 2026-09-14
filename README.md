<div align="center">

# 🌙 âm lịch

**The Vietnamese lunar calendar — a from-scratch SDK and a web app**

### [→ lunar-calendar-web-ten.vercel.app](https://lunar-calendar-web-ten.vercel.app)

[![live](https://img.shields.io/badge/demo-live-brightgreen)](https://lunar-calendar-web-ten.vercel.app)
[![npm](https://img.shields.io/npm/v/@lunar-calendar/sdk)](https://www.npmjs.com/package/@lunar-calendar/sdk)
[![license](https://img.shields.io/npm/l/@lunar-calendar/sdk)](LICENSE)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](https://www.npmjs.com/package/@lunar-calendar/sdk)

</div>

[![Calendar view](img/calendar.png)](https://lunar-calendar-web-ten.vercel.app)

Look up lunar dates, sexagenary pillars (can chi), solar terms (tiết khí), auspicious hours and Vietnamese holidays. Everything runs in the browser — install it and it works **offline**, with nine editor colour themes and a Vietnamese/English interface.

## Terminal mode

For people who would rather type than click: command history with `↑↓`, `Tab` completion, `Ctrl+L`, and a resizable window that remembers its size. Press **`` ` ``** to toggle — or [try it in the browser](https://lunar-calendar-web-ten.vercel.app).

![Terminal mode](img/terminal.png)

```
amlich ~ $ amlich 20/10          # lunar date → solar date + countdown
20/10/2026 âm → 28/11/2026 dương lịch (Thứ Bảy)
còn 75 ngày nữa · 10.7 tuần · khoảng 2.5 tháng

amlich ~ $ tet 2027              # when is Lunar New Year, and how far away
amlich ~ $ cal 2 2026            # ASCII month calendar, solar above lunar
amlich ~ $ leap 2025             # which month is doubled in a leap year
amlich ~ $ info 17/2/2026        # everything about one day
```

## The SDK

```bash
npm i @lunar-calendar/sdk
```

```ts
import { solarToLunar, lunarToSolar, getDayInfo, CHINA_TIMEZONE } from '@lunar-calendar/sdk';

solarToLunar(17, 2, 2026);        // { day:1, month:1, year:2026, leap:false, uncertain:false }
lunarToSolar(15, 8, 2025);        // { day:6, month:10, year:2025 }   ← Mid-Autumn Festival
getDayInfo(17, 2, 2026);          // pillars, solar term, auspicious hours, holidays…

lunarToSolar(1, 1, 1968);                        // 29 Jan — Tết in Vietnam
lunarToSolar(1, 1, 1968, false, CHINA_TIMEZONE); // 30 Jan — China, one day apart
```

The astronomy is **implemented from primary sources** rather than borrowed from an existing library: the complete Meeus chapter 49 new-moon series (25 periodic terms plus 14 planetary corrections), a truncated VSOP87 series for the Sun's **apparent** longitude, and Espenak–Meeus ΔT blended with measured IERS values. Measured result: new-moon instants agree with NASA's tables to **about one second on average**.

What sets it apart: when a new moon falls within seconds of local midnight — the case where **no implementation can honestly be certain** — the SDK returns `uncertain: true` instead of quietly guessing.

📖 Algorithm details, measured accuracy and an analysis of all 122 divergent days: **[packages/sdk/README.md](packages/sdk/README.md)**

## Running with Docker

No Node or pnpm on your machine? Clone and run:

```bash
git clone https://github.com/philliptran1402/lunar-calendar.git
cd lunar-calendar
docker compose up            # → http://localhost:5173, with hot reload
```

Editing files on your host updates the browser immediately — the source tree is
bind-mounted, and `node_modules` lives in the container so your host stays clean.

```bash
docker compose --profile prod up      # → http://localhost:8080, nginx + production build
docker compose --profile test run --rm test   # run the full suite in a clean environment
```

If those ports are taken, override them (or copy `.env.example` to `.env`):

```bash
DEV_PORT=5199 PROD_PORT=8099 docker compose up
```

The production image is a **50 MB** nginx-alpine serving only static files. Its
config sets `Cache-Control: immutable` on hashed assets and, importantly,
`no-store` on `sw.js` — otherwise a stale service worker pins visitors to an old
build forever.

## Deploying

The live site runs on Vercel with **Root Directory** set to `apps/web`. The web
package builds the SDK first (`pnpm --filter @lunar-calendar/sdk build && …`),
because `packages/sdk/dist/` is not committed and nothing else would build it.

## Layout

```
packages/sdk/   @lunar-calendar/sdk — engine and calendar rules, zero dependencies
apps/web/       Vite + React PWA, consuming the SDK through a workspace link
docker/         nginx config for the production image
```

Or natively, with Node ≥ 20 and pnpm ≥ 9:

```bash
pnpm install
pnpm test        # 23 tests: astronomical accuracy, historical cases, 73,414-day regression
pnpm dev         # web app
pnpm build
```

## Reliability

Every figure below is an **executable test**, not a claim:

| Check | Result |
|---|---|
| New moons of 2026 vs NASA/Espenak tables | ~1s mean deviation |
| Solstices and equinoxes 2020–2050 vs NASA | −11s mean deviation |
| Six years where Vietnam's Tết differs from China's (1968, 1985…) | all six reproduced by changing the timezone alone |
| 73,414 days (1900–2100) vs the widely used implementation | 99.83% agreement; all 122 divergences **traced to a root cause** |
| Metonic cycle (7 leap months per 19 years), 29- or 30-day months | ✅ |

## A note on tradition

Day officers (trực) and auspicious hours are presented as **traditional knowledge, for reference** — not as advice or fortune-telling.

## License

[MIT](LICENSE)
