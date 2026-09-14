# @lunar-calendar/sdk

A from-scratch Vietnamese lunar calendar SDK with high astronomical precision and zero dependencies.

> **Stated plainly up front:** the Vietnamese lunar calendar is a **defined rule set**, not a matter of interpretation — Decree 121/CP (1967), Article 3 requires it to be computed on Vietnam's official time, the 105°E meridian. Nobody is entitled to invent different dates. The goal of this SDK is therefore not to produce *different* dates, but to implement that rule set **more precisely, more transparently, and more honestly about the cases nobody can be sure of**.

## Why reimplement instead of using the common port

`amlich-hnd.js` (Hồ Ngọc Đức, 2006) is the de-facto standard in Vietnam. After reading its source and measuring it, three weaknesses are real:

| | The common port | This SDK |
|---|---|---|
| **New moon** | Meeus, *Astronomical Formulae for Calculators* (1982), epoch 1900, **13 periodic terms** | Meeus, *Astronomical Algorithms* ch. 49, epoch J2000, **25 periodic terms + 14 planetary corrections A1–A14** |
| **Solar longitude** | ch. 24 low-accuracy path (3 terms), using **geometric** longitude | **Truncated VSOP87** (~90 terms) + FK5 + nutation + aberration → **apparent** longitude |
| **ΔT (TT→UT)** | an ad-hoc polynomial, **negative through the 20th century** (−29.8s for 1944, where the true value is +26.6s) | Espenak–Meeus (2006) blended with **measured IERS values**, with a user-supplied override hook |

Note the attribution: the file's header credits *Astronomical Algorithms* (1998), but the code is from Meeus's earlier 1982 book — a different, less accurate work.

Dropping A1–A14 costs up to **112 seconds**. Using geometric instead of apparent longitude costs up to **~15 minutes**. A biased ΔT shifts dates **systematically**. None of it matters until an event falls near local midnight — and then it moves a whole calendar month.

## Measured accuracy, not claimed

Compared against NASA/Espenak tables (`astropixels.com/ephemeris`):

```
New moons, 2026 (12 lunations)  : mean  ~1s, max 35s
Solstices/equinoxes, 2020–2050  : mean −11s, max 57s
The low-accuracy solar formula  : 5.0″ ≈ 121s   ← why VSOP87 is necessary
```

An honest caveat: NASA's published times are rounded to the **minute** (±30s) and are themselves computed with Espenak's own ΔT model. Using that same ΔT model, the mean new-moon deviation drops to **1.0 second** — meaning the remaining gap is the ΔT model, not the astronomy. The SDK defaults to **measured** ΔT, because civil calendars need real UT.

## Differential test: 73,414 days (1900–2100)

```
Agreement : 73,292 / 73,414  (99.8338%)
Divergent : 122 days, in 6 runs
```

Every run was traced to a cause:

| Run | Cause | Which is right |
|---|---|---|
| 1944, 1967, 2072, 2077 | New moon within **2–72 seconds** of midnight; the older port's ΔT is off by 56–145s and pushes it across the date line | This SDK has the better ΔT — **but 1967 is only 2 seconds away, so nobody can be sure** |
| 2054, 2062 | The older port returns **lunar day 0** (e.g. `0/4/2054`) — an off-by-one bug | This SDK (returns `30/3`) |

This comparison ships as a regression test, pinned to exactly 122 divergences: if a change makes that number move, the test fails and the change has to be explained.

## A distinguishing feature: flagging what cannot be known

A direct consequence of the analysis above. When the conjunction lands within seconds of midnight, **no implementation can be certain** — future ΔT depends on the Earth's rotation and is genuinely unknowable. Rather than guess silently:

```ts
const d = solarToLunar(7, 7, 1967);
// { day: 1, month: 6, year: 1967, leap: false, uncertain: true }
//   → conjunction at 23:59:58 local time — 2 seconds from midnight
```

The uncertainty threshold widens with distance from the measured era; see `uncertaintySeconds()`.

## Install

```bash
npm i @lunar-calendar/sdk
```

## Usage

```ts
import { solarToLunar, lunarToSolar, leapMonthOf, VN_TIMEZONE, CHINA_TIMEZONE } from '@lunar-calendar/sdk';

solarToLunar(17, 2, 2026);            // { day:1, month:1, year:2026, leap:false, uncertain:false }
lunarToSolar(1, 1, 1968);             // { day:29, month:1, year:1968 }  ← Tết Mậu Thân, Vietnam
lunarToSolar(1, 1, 1968, false, CHINA_TIMEZONE); // { day:30, … }        ← China, one day later
leapMonthOf(1985);                    // 2  (China doubled month 10 of 1984 → Tết a month apart)
```

Convenience layer:

```ts
import { getDayInfo, getMonthGrid } from '@lunar-calendar/sdk';

getDayInfo(17, 2, 2026);   // lunar date, pillars, solar term, auspicious hours, holidays
getMonthGrid(2, 2026);     // 42 cells, weeks starting Monday (Vietnamese convention)
```

Tree-shakeable subpath entry points: `@lunar-calendar/sdk/astro`, `/calendar`, `/vn`.

**The timezone is a parameter, not a constant** — the same engine reproduces the Chinese (UTC+8), Korean and Japanese calendars, and it accepts a `(jd) => offset` function for historical timezone changes.

## Historical validation

Six years where Vietnam's Lunar New Year differs from China's — **all six** reproduced by changing the timezone alone:

| Year | Vietnam (UTC+7) | China (UTC+8) |
|---|---|---|
| 1968 | 29 Jan | 30 Jan |
| 1969 | 16 Feb | 17 Feb |
| **1985** | **21 Jan** | **20 Feb** *(a month apart — leap-month placement)* |
| 2007 | 17 Feb | 18 Feb |
| 2030 | 2 Feb | 3 Feb |
| 2053 | 18 Feb | 19 Feb |

## Architecture

```
src/time/      julian.ts (JD, TT/UT kept apart) · deltat.ts (Espenak–Meeus + measured)
src/astro/     nutation.ts · sun.ts (VSOP87) · moon.ts (full Meeus 49) · search.ts (root finding)
src/calendar/  lunisolar.ts — the rules, timezone-parameterised, cached
src/vn/        canchi · solar-term · holiday · almanac — Vietnam-specific layers
```

`JdTT` and `JdUT` are **branded types**, so the compiler refuses to let the two time scales mix — the most common source of systematic error in calendar code.

Throughput: roughly 950,000 day conversions per second (cycle-level caching).

## Sources

Meeus, *Astronomical Algorithms*, 2nd ed. (ch. 22, 25, 47, 49) · Espenak & Meeus, [ΔT polynomials](https://eclipse.gsfc.nasa.gov/SEhelp/deltatpoly2004.html) · [NASA new-moon and solstice tables](https://astropixels.com/ephemeris/) · [Decree 121/CP](https://thuvienphapluat.vn/van-ban/Linh-vuc-khac/Quyet-dinh-121-CP-tinh-lich-quan-ly-lich-cua-Nha-nuoc-18212.aspx) · Trần Tiến Bình, *Lịch Việt Nam thế kỷ XX–XXI*.

## License

[MIT](LICENSE)
