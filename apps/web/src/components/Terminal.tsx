import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  canChiYear,
  getDayInfo,
  leapMonthOf,
  getMonthGrid,
  integerJd,
  lunarMonthLength,
  lunarToSolar,
  solarToLunar,
  type DayInfo,
} from '@lunar-calendar/sdk';
import { useT } from '../settings';
import type { T } from '../i18n';

/* ------------------------------------------------------------------ utils */

const pad = (s: string | number, n: number) => String(s).padStart(n, ' ');
const today = new Date();
const TODAY = { d: today.getDate(), m: today.getMonth() + 1, y: today.getFullYear() };

const C = {
  dim: (t: ReactNode) => <span className="t-dim">{t}</span>,
  key: (t: ReactNode) => <span className="t-key">{t}</span>,
  val: (t: ReactNode) => <span className="t-val">{t}</span>,
  lun: (t: ReactNode) => <span className="t-lun">{t}</span>,
  warn: (t: ReactNode) => <span className="t-warn">{t}</span>,
  err: (t: ReactNode) => <span className="t-err">{t}</span>,
  ok: (t: ReactNode) => <span className="t-ok">{t}</span>,
};

/** Doc "14/9/2026" hoac "14-9-2026"; thieu thi lay hom nay. */
function parseDate(arg?: string): { d: number; m: number; y: number } | null {
  if (!arg) return TODAY;
  const p = arg.split(/[/\-.]/).map(Number);
  if (p.length !== 3 || p.some((n) => !Number.isFinite(n))) return null;
  return { d: p[0]!, m: p[1]!, y: p[2]! };
}

function kv(rows: Array<[string, ReactNode]>): ReactNode {
  const w = Math.max(...rows.map((r) => r[0].length));
  return (
    <>
      {rows.map(([k, v]) => (
        <div key={k}>
          {C.key(k.padEnd(w))} {C.dim('│')} {v}
        </div>
      ))}
    </>
  );
}

function dayBlock(info: DayInfo, T: T): ReactNode {
  const leap = info.lunar.leap ? ` ${T.t('term.word.leapParen')}` : '';
  return kv([
    [T.t('term.row.solar'), <>{`${info.solar.day}/${info.solar.month}/${info.solar.year}`} {C.dim(`· ${T.weekday(info.solar.weekdayIndex)}`)}</>],
    [T.t('term.row.lunar'), C.lun(`${info.lunar.day}/${info.lunar.month}${leap}/${info.lunar.year}`)],
    [T.t('term.row.canChi'), <>{info.canChi.day} {C.dim(`· ${T.t('term.word.month')}`)} {info.canChi.month} {C.dim(`· ${T.t('term.word.year')}`)} {info.canChi.year} ({T.zodiac(info.conGiapIndex, info.conGiap)})</>],
    [T.t('term.row.solarTerm'), C.warn(T.solarTerm(info.solarTerm.index, info.solarTerm.name) + (info.solarTerm.isStart ? `  ${T.t('term.start')}` : ''))],
    [T.t('term.row.truc'), <>{info.quality.star} {info.quality.auspicious ? C.ok(`[${T.t('quality.good')}]`) : C.dim(`[${T.t('quality.bad')}]`)}</>],
    [T.t('term.row.hours'), C.ok(info.luckyHours.filter((h) => h.auspicious).map((h) => h.chi).join(' '))],
    [T.t('term.row.holiday'), info.holidays.length ? C.err(info.holidays.map((h) => T.holiday(h.id, h.name)).join(', ')) : C.dim('—')],
    [T.t('term.row.julian'), C.dim(String(info.jd))],
  ]);
}

/** Lich ASCII: moi tuan 2 dong — duong lich va am lich ngay duoi. */
function asciiMonth(m: number, y: number, selJd: number, T: T): ReactNode {
  const cells = getMonthGrid(m, y);
  const weeks: DayInfo[][] = [];
  for (let i = 0; i < 42; i += 7) weeks.push(cells.slice(i, i + 7));
  const todayJd = integerJd(TODAY.d, TODAY.m, TODAY.y);

  // Moi o = 4 ky tu ("%3s "), 7 o = 28, cong 1 space dau => be rong trong khung.
  const W = 29;
  const bar = (l: string, mid: string, r: string) => C.dim(l + mid.repeat(W) + r);
  const title = ` ${T.monthName(m, y)}${T.lang === 'en' ? ' ' : '/'}${y}`;
  const canChi = canChiYear(solarToLunar(15, m, y).year);

  return (
    <div className="t-cal">
      <div>{bar('┌', '─', '┐')}</div>
      <div>
        {C.dim('│')}
        {title}
        {C.dim(canChi.padStart(W - title.length))}
        {C.dim('│')}
      </div>
      <div>{bar('├', '─', '┤')}</div>
      <div>
        {C.dim('│ ')}
        {/* Dung chung o 4ch nhu cac hang ngay — dem dau cach bang tay la lech. */}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <span key={i} className={`t-day ${i === 6 ? 't-err' : 't-key'}`}>
            {T.weekdayShort(i)}
          </span>
        ))}
        {C.dim('│')}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi}>
          <div>
            {C.dim('│ ')}
            {week.map((c) => {
              const out = c.solar.month !== m;
              const cls = [
                't-day',
                out ? 't-dim' : c.holidays.length ? 't-err' : 't-cur',
                c.jd === todayJd && 't-today',
                c.jd === selJd && 't-sel',
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <span key={c.jd} className={cls}>
                  {pad(c.solar.day, 3)}
                </span>
              );
            })}
            {C.dim('│')}
          </div>
          <div>
            {C.dim('│ ')}
            {week.map((c) => (
              <span
                key={c.jd}
                className={
                  't-day ' +
                  (c.solar.month !== m ? 't-dim' : c.lunar.day === 1 ? 't-first' : 't-lun')
                }
              >
                {pad(c.lunar.day === 1 ? `${c.lunar.day}/${c.lunar.month}` : c.lunar.day, 3)}
              </span>
            ))}
            {C.dim('│')}
          </div>
        </div>
      ))}
      <div>{bar('└', '─', '┘')}</div>
    </div>
  );
}

/* --------------------------------------------------------------- commands */

interface Ctx {
  setView: (m: number, y: number) => void;
  view: { m: number; y: number };
  selJd: number;
  clear: () => void;
  exit: () => void;
}

interface Command {
  usage: string;
  desc: string;
  run: (args: string[], ctx: Ctx) => ReactNode;
}

/** Lenh duoc dung THEO NGON NGU — desc va moi dong output deu qua T. */
function buildCommands(T: T): Record<string, Command> {
  const t = T.t;
  const leapParen = (leap: boolean) => (leap ? ` ${t('term.word.leapParen')}` : '');

  const cmds: Record<string, Command> = {
    help: {
      usage: 'help',
      desc: t('term.desc.help'),
      run: () => (
        <>
          {Object.values(cmds).map((c) => (
            <div key={c.usage}>
              {C.val(c.usage.padEnd(26))} {C.dim(c.desc)}
            </div>
          ))}
          <div>{C.dim(t('term.help.hint'))}</div>
        </>
      ),
    },
    today: {
      usage: 'today',
      desc: t('term.desc.today'),
      run: () => dayBlock(getDayInfo(TODAY.d, TODAY.m, TODAY.y), T),
    },
    cal: {
      usage: 'cal [mm] [yyyy]',
      desc: t('term.desc.cal'),
      run: (args, ctx) => {
        const m = args[0] ? Number(args[0]) : ctx.view.m;
        const y = args[1] ? Number(args[1]) : ctx.view.y;
        if (!(m >= 1 && m <= 12) || !Number.isFinite(y)) return C.err(t('term.err.month'));
        ctx.setView(m, y);
        return asciiMonth(m, y, ctx.selJd, T);
      },
    },
    info: {
      usage: 'info [dd/mm/yyyy]',
      desc: t('term.desc.info'),
      run: (args) => {
        const d = parseDate(args[0]);
        if (!d) return C.err(t('term.err.date'));
        return dayBlock(getDayInfo(d.d, d.m, d.y), T);
      },
    },
    s2l: {
      usage: 's2l <dd/mm/yyyy>',
      desc: t('term.desc.s2l'),
      run: (args) => {
        const d = parseDate(args[0]);
        if (!d) return C.err(t('term.err.dateShort'));
        const l = solarToLunar(d.d, d.m, d.y);
        return (
          <>
            {`${d.d}/${d.m}/${d.y}`} {C.dim('→')}{' '}
            {C.lun(`${l.day}/${l.month}${leapParen(l.leap)}/${l.year} ${t('term.word.lunar')}`)}
          </>
        );
      },
    },
    l2s: {
      usage: 'l2s <dd/mm/yyyy> [-l]',
      desc: t('term.desc.l2s'),
      run: (args) => {
        const d = parseDate(args[0]);
        if (!d) return C.err(t('term.err.dateShort'));
        const leap = args.includes('-l') || args.includes('--leap');
        const s = lunarToSolar(d.d, d.m, d.y, leap);
        if (!s) return C.err(t('term.err.noLeap', { y: d.y, m: d.m }));
        return (
          <>
            {C.lun(`${d.d}/${d.m}${leap ? 'N' : ''}/${d.y} ${t('term.word.lunarShort')}`)} {C.dim('→')}{' '}
            {C.val(`${s.day}/${s.month}/${s.year} ${t('term.word.solar')}`)}
          </>
        );
      },
    },
    amlich: {
      usage: 'amlich <dd/mm[/yyyy]> [-l]',
      desc: t('term.desc.amlich'),
      run: (args) => {
        if (!args[0]) {
          const l = solarToLunar(TODAY.d, TODAY.m, TODAY.y);
          return (
            <>
              {t('term.amlich.todayIs')}{' '}
              {C.lun(`${l.day}/${l.month}${leapParen(l.leap)}/${l.year} ${t('term.word.lunar')}`)}{' '}
              {C.dim(t('term.amlich.hint'))}
            </>
          );
        }

        const parts = args[0].split(/[/\-.]/).map(Number);
        if (parts.length < 2 || parts.some((n) => !Number.isFinite(n))) {
          return C.err(t('term.err.syntax'));
        }
        const [d, m] = parts as [number, number];
        const explicitYear = parts[2];
        const leap = args.includes('-l') || args.includes('--leap');
        if (m < 1 || m > 12 || d < 1 || d > 30) return C.err(t('term.err.range'));

        const todayJd = integerJd(TODAY.d, TODAY.m, TODAY.y);
        const lunarNow = solarToLunar(TODAY.d, TODAY.m, TODAY.y);

        // Khong ghi nam -> tim LAN TOI sap den (nam am lich hien tai, chua qua thi sang nam)
        let year = explicitYear ?? lunarNow.year;
        let solar = lunarToSolar(d, m, year, leap);
        if (explicitYear === undefined && solar) {
          if (integerJd(solar.day, solar.month, solar.year) < todayJd) {
            year += 1;
            solar = lunarToSolar(d, m, year, leap);
          }
        }

        if (!solar) {
          return leap ? C.err(t('term.err.noLeap', { y: year, m })) : C.err(t('term.err.convert'));
        }

        // Thang am lich chi co 29 hoac 30 ngay — bat loi thay vi tra ve ngay troi
        const len = lunarMonthLength(m, year, leap);
        if (d > len) {
          return (
            <>
              {C.err(t('term.amlich.short', { m, y: year, n: len }))}{' '}
              {C.dim(t('term.amlich.noSuchDay', { d }))}
            </>
          );
        }

        const jd = integerJd(solar.day, solar.month, solar.year);
        const diff = jd - todayJd;
        const info = getDayInfo(solar.day, solar.month, solar.year);
        const holiday = info.holidays[0];

        return (
          <>
            <div>
              {C.lun(`${d}/${m}${leap ? ` ${t('term.word.leap')}` : ''}/${year} ${t('term.word.lunarShort')}`)}{' '}
              {C.dim('→')} {C.val(`${solar.day}/${solar.month}/${solar.year} ${t('term.word.solar')}`)}{' '}
              {C.dim(`(${T.weekday(info.solar.weekdayIndex)})`)}
            </div>
            <div>
              {diff === 0 ? (
                C.ok(t('term.isToday'))
              ) : diff > 0 ? (
                <>
                  {C.ok(t('term.inDays', { n: diff }))}{' '}
                  {C.dim(
                    '· ' +
                      t('term.weeksMonths', {
                        w: (diff / 7).toFixed(1),
                        mo: (diff / 30.44).toFixed(1),
                      }),
                  )}
                </>
              ) : (
                C.dim(t('term.agoDays', { n: -diff }))
              )}
            </div>
            <div>
              {C.dim(t('term.word.year'))} {info.canChi.year} ({T.zodiac(info.conGiapIndex, info.conGiap)}){' '}
              {C.dim('·')} {info.canChi.day}{' '}
              {info.quality.auspicious ? C.ok(`[${t('quality.good')}]`) : C.dim(`[${t('quality.bad')}]`)}
              {holiday ? <> {C.dim('·')} {C.err(T.holiday(holiday.id, holiday.name))}</> : null}
            </div>
          </>
        );
      },
    },
    tet: {
      usage: 'tet [yyyy]',
      desc: t('term.desc.tet'),
      run: (args) => {
        const y = args[0] ? Number(args[0]) : TODAY.y;
        if (!Number.isFinite(y)) return C.err(t('term.err.year'));
        const s = lunarToSolar(1, 1, y);
        if (!s) return C.err(t('term.err.compute'));
        const info = getDayInfo(s.day, s.month, s.year);
        const days = integerJd(s.day, s.month, s.year) - integerJd(TODAY.d, TODAY.m, TODAY.y);
        return (
          <>
            <div>
              {C.val(t('term.tet.title', { cc: canChiYear(y) }))} {C.dim('·')} {t('term.tet.falls')}{' '}
              {C.ok(`${s.day}/${s.month}/${s.year}`)} {C.dim(`(${T.weekday(info.solar.weekdayIndex)})`)}
            </div>
            <div>
              {C.dim(
                days === 0
                  ? t('term.tet.isToday')
                  : days > 0
                    ? t('term.inDays', { n: days })
                    : t('term.agoDays', { n: -days }),
              )}
            </div>
          </>
        );
      },
    },
    leap: {
      usage: 'leap [yyyy]',
      desc: t('term.desc.leap'),
      run: (args) => {
        const y = args[0] ? Number(args[0]) : TODAY.y;
        const lm = leapMonthOf(y);
        if (lm === null)
          return (
            <>
              {t('term.leap.none', { y })} {C.dim(t('term.leap.noneTail'))} {C.dim(t('term.leap.months12'))}
            </>
          );
        return (
          <>
            {t('term.leap.has', { y })}
            {C.warn(t('term.leap.month', { m: lm }))}{' '}
            {C.dim(t('term.leap.days', { n: lunarMonthLength(lm, y, true) }))}
          </>
        );
      },
    },
    hours: {
      usage: 'hours [dd/mm/yyyy]',
      desc: t('term.desc.hours'),
      run: (args) => {
        const d = parseDate(args[0]);
        if (!d) return C.err(t('term.err.dateShort'));
        const info = getDayInfo(d.d, d.m, d.y);
        return (
          <>
            {info.luckyHours.map((h) => (
              <div key={h.chi}>
                {h.auspicious ? C.ok('●') : C.dim('○')} {(h.chi + '   ').slice(0, 4)}{' '}
                <span className={h.auspicious ? 't-ok' : 't-dim'}>{h.range}</span>{' '}
                {C.dim(h.auspicious ? t('quality.good') : t('quality.bad'))}
              </div>
            ))}
          </>
        );
      },
    },
    json: {
      usage: 'json [dd/mm/yyyy]',
      desc: t('term.desc.json'),
      run: (args) => {
        const d = parseDate(args[0]);
        if (!d) return C.err(t('term.err.dateShort'));
        return <span className="t-dim">{JSON.stringify(getDayInfo(d.d, d.m, d.y), null, 2)}</span>;
      },
    },
    clear: { usage: 'clear', desc: t('term.desc.clear'), run: (_a, ctx) => (ctx.clear(), null) },
    gui: { usage: 'gui', desc: t('term.desc.gui'), run: (_a, ctx) => (ctx.exit(), null) },
  };

  return cmds;
}


/* ---------------------------------------------------------------- resize */

const STORAGE_KEY = 'amlich.term.size';
const MIN_W = 420;
const MIN_H = 220;

interface Size { w: number | null; h: number | null }

/** Kich thuoc do nguoi dung keo, nho lai giua cac lan mo. null = tu gian day cho. */
function useResizable(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = useState<Size>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Size) : { w: null, h: null };
    } catch {
      return { w: null, h: null };
    }
  });

  const persist = useCallback((s: Size) => {
    setSize(s);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {
      /* private mode — khong luu duoc thi thoi, khong lam vo app */
    }
  }, []);

  const maxW = () => ref.current?.parentElement?.clientWidth ?? window.innerWidth;
  const maxH = () => {
    const top = ref.current?.getBoundingClientRect().top ?? 0;
    return Math.max(MIN_H, window.innerHeight - top - 44); // chua cho footer
  };

  const startDrag = useCallback(
    (axis: 'x' | 'y' | 'xy') => (e: React.PointerEvent) => {
      e.preventDefault();
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x0 = e.clientX;
      const y0 = e.clientY;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      document.body.style.userSelect = 'none';

      const move = (ev: PointerEvent) => {
        const next: Size = { ...size };
        if (axis !== 'y') next.w = Math.min(maxW(), Math.max(MIN_W, rect.width + (ev.clientX - x0)));
        if (axis !== 'x') next.h = Math.min(maxH(), Math.max(MIN_H, rect.height + (ev.clientY - y0)));
        setSize(next);
      };
      const up = () => {
        document.body.style.userSelect = '';
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        const el2 = ref.current;
        if (el2) {
          const r = el2.getBoundingClientRect();
          persist({
            w: axis !== 'y' ? Math.round(r.width) : size.w,
            h: axis !== 'x' ? Math.round(r.height) : size.h,
          });
        }
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    },
    [ref, size, persist],
  );

  /** Kich thuoc do tay co the tran ra ngoai khi doi kich thuoc cua so — kep lai. */
  useEffect(() => {
    const onResize = () => {
      setSize((s) => {
        if (s.w === null && s.h === null) return s;
        return { w: s.w === null ? null : Math.min(s.w, maxW()), h: s.h === null ? null : Math.min(s.h, maxH()) };
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const reset = useCallback(() => persist({ w: null, h: null }), [persist]);
  return { size, startDrag, reset };
}

/**
 * Do so cot/hang THAT theo be rong chu — title bar hien dung nhu terminal xin.
 * Dung ResizeObserver + cho font load: do mot lan luc mount la sai
 * (font web ve sau -> be rong chu doi; keo resize -> khong cap nhat).
 */
function useGridSize(bodyRef: React.RefObject<HTMLElement | null>) {
  const [grid, setGrid] = useState({ cols: 80, rows: 24 });

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;

    const measure = () => {
      if (!el.isConnected || el.clientWidth === 0) return;
      const probe = document.createElement('span');
      probe.textContent = '0'.repeat(50);
      probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre';
      el.appendChild(probe);
      const charW = probe.getBoundingClientRect().width / 50;
      el.removeChild(probe);
      if (!charW) return;

      const cs = getComputedStyle(el);
      const lineH = parseFloat(cs.lineHeight) || 21;
      const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      setGrid((g) => {
        const cols = Math.max(1, Math.floor((el.clientWidth - padX) / charW));
        const rows = Math.max(1, Math.floor((el.clientHeight - padY) / lineH));
        return g.cols === cols && g.rows === rows ? g : { cols, rows };
      });
    };

    measure();
    // Font web ve muon -> do lai (neu khong, so cot tinh theo font du phong = sai)
    document.fonts?.ready.then(measure).catch(() => undefined);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [bodyRef]);

  return grid;
}

/* -------------------------------------------------------------- component */

interface Entry {
  cmd?: string;
  out: ReactNode;
}

export function Terminal({
  view,
  setView,
  selJd,
  onExit,
}: {
  view: { m: number; y: number };
  setView: (m: number, y: number) => void;
  selJd: number;
  onExit: () => void;
}) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [input, setInput] = useState('');
  const [hist, setHist] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<HTMLElement>(null);
  const { size, startDrag, reset } = useResizable(termRef);
  const grid = useGridSize(bodyRef);
  const T = useT();
  const commands = useMemo(() => buildCommands(T), [T]);

  const ctx: Ctx = useMemo(
    () => ({
      view,
      setView,
      selJd,
      clear: () => setEntries([]),
      exit: onExit,
    }),
    [view, setView, selJd, onExit],
  );

  // Banner chao — ve lai khi doi ngon ngu, nhung khong xoa lich su lenh
  useEffect(() => {
    const info = getDayInfo(TODAY.d, TODAY.m, TODAY.y);
    const banner: Entry = {
      out: (
        <>
          <div className="t-banner">{T.t('term.banner')}</div>
          <div>
            {C.dim(T.t('term.banner.today'))} {`${TODAY.d}/${TODAY.m}/${TODAY.y}`} {C.dim('·')}{' '}
            {C.lun(`${info.lunar.day}/${info.lunar.month} ${T.t('term.word.lunarShort')}`)} {C.dim('·')}{' '}
            {info.canChi.year}
          </div>
          <div>{C.dim(T.t('term.banner.hint'))}</div>
        </>
      ),
    };
    setEntries((e) => [banner, ...e.slice(1)]);
  }, [T]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [entries]);

  const submit = () => {
    const raw = input.trim();
    setInput('');
    if (!raw) {
      setEntries((e) => [...e, { cmd: '', out: null }]);
      return;
    }
    setHist((h) => [...h, raw]);
    setHistIdx(-1);

    const [name, ...args] = raw.split(/\s+/);
    const cmd = commands[name!.toLowerCase()];
    const out = cmd ? (
      cmd.run(args, ctx)
    ) : (
      <>
        {C.err(T.t('term.err.unknown', { cmd: name! }))} {C.dim(T.t('term.err.unknownHint'))}
      </>
    );
    // clear/gui tu xu ly, khong day them dong
    if (name === 'clear') return;
    setEntries((e) => [...e, { cmd: raw, out }]);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const i = histIdx < 0 ? hist.length - 1 : Math.max(0, histIdx - 1);
      if (hist[i] !== undefined) {
        setHistIdx(i);
        setInput(hist[i]!);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx < 0) return;
      const i = histIdx + 1;
      if (i >= hist.length) {
        setHistIdx(-1);
        setInput('');
      } else {
        setHistIdx(i);
        setInput(hist[i]!);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const match = Object.keys(commands).filter((c) => c.startsWith(input.trim()));
      if (match.length === 1) setInput(match[0]! + ' ');
      else if (match.length > 1) setEntries((en) => [...en, { cmd: input, out: C.dim(match.join('  ')) }]);
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setEntries([]);
    }
  };

  return (
    <section
      ref={termRef}
      className={`term ${size.w === null && size.h === null ? 'term--fill' : 'term--sized'}`}
      style={{
        width: size.w ?? undefined,
        height: size.h ?? undefined,
        flex: size.h === null ? undefined : '0 0 auto',
      }}
      onClick={() => inputRef.current?.focus()}
    >
      <div className="term__bar">
        <span className="term__dots">
          <i style={{ background: 'var(--red)' }} />
          <i style={{ background: 'var(--yellow)' }} />
          <i style={{ background: 'var(--green)' }} />
        </span>
        <span className="term__title">
          amlich — zsh — {grid.cols}×{grid.rows}
        </span>
        {(size.w !== null || size.h !== null) && (
          <button className="copy-btn" onClick={reset} title={T.t('term.title.reset')}>
            {T.t('action.reset')}
          </button>
        )}
        <button className="copy-btn" onClick={onExit}>
          gui ⇄
        </button>
      </div>

      <div className="term__body" ref={bodyRef}>
        {entries.map((en, i) => (
          <div key={i} className="term__entry">
            {en.cmd !== undefined && (
              <div className="term__line">
                <Prompt />
                <span>{en.cmd}</span>
              </div>
            )}
            {en.out && <div className="term__out">{en.out}</div>}
          </div>
        ))}

        <div className="term__line">
          <Prompt />
          <input
            ref={inputRef}
            className="term__input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            spellCheck={false}
            autoComplete="off"
            autoFocus
            aria-label={T.t('term.a11y.input')}
          />
        </div>
      </div>

      {/* Keo de doi kich thuoc — nhay doi de tra ve mac dinh */}
      <span className="term__grip term__grip--r" onPointerDown={startDrag('x')} onDoubleClick={reset} />
      <span className="term__grip term__grip--b" onPointerDown={startDrag('y')} onDoubleClick={reset} />
      <span className="term__grip term__grip--c" onPointerDown={startDrag('xy')} onDoubleClick={reset} />
    </section>
  );
}

const Prompt = () => (
  <span className="term__prompt">
    <span className="t-ok">amlich</span>
    <span className="t-dim"> ~ </span>
    <span className="t-lun">$</span>&nbsp;
  </span>
);
