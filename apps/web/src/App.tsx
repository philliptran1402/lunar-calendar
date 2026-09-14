import { useCallback, useEffect, useMemo, useState } from 'react';
import { getDayInfo, getMonthGrid, integerJd, civilFromJd } from '@lunar-calendar/sdk';
import { Calendar } from './components/Calendar';
import { Converter } from './components/Converter';
import { DayDetail } from './components/DayDetail';
import { Terminal } from './components/Terminal';
import { InstallPrompt } from './components/InstallPrompt';
import { LangPicker, ThemePicker } from './components/Pickers';
import { useT } from './settings';

const today = new Date();
const TODAY = { d: today.getDate(), m: today.getMonth() + 1, y: today.getFullYear() };

export function App() {
  const [view, setView] = useState({ m: TODAY.m, y: TODAY.y });
  const [sel, setSel] = useState(TODAY);
  const [mode, setMode] = useState<'gui' | 'term'>('gui');
  const T = useT();
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const cells = useMemo(() => getMonthGrid(view.m, view.y), [view]);
  const selInfo = useMemo(() => getDayInfo(sel.d, sel.m, sel.y), [sel]);
  const todayJd = useMemo(() => integerJd(TODAY.d, TODAY.m, TODAY.y), []);
  const selJd = useMemo(() => integerJd(sel.d, sel.m, sel.y), [sel]);

  const goMonth = useCallback((delta: number) => {
    setView((v) => {
      const total = v.y * 12 + (v.m - 1) + delta;
      return { m: (total % 12) + 1, y: Math.floor(total / 12) };
    });
  }, []);

  const jumpTo = useCallback((d: number, m: number, y: number) => {
    setSel({ d, m, y });
    setView({ m, y });
  }, []);

  const shiftDay = useCallback(
    (delta: number) => {
      const { day: d, month: m, year: y } = civilFromJd(integerJd(sel.d, sel.m, sel.y) + delta);
      jumpTo(d, m, y);
    },
    [sel, jumpTo],
  );

  /** Ban phim: dan lap trinh khong thich rê chuot. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.tagName === 'INPUT' || el.tagName === 'SELECT') return;
      const map: Record<string, () => void> = {
        ArrowLeft: () => shiftDay(-1),
        ArrowRight: () => shiftDay(1),
        ArrowUp: () => shiftDay(-7),
        ArrowDown: () => shiftDay(7),
        PageUp: () => goMonth(-1),
        PageDown: () => goMonth(1),
        t: () => jumpTo(TODAY.d, TODAY.m, TODAY.y),
        T: () => jumpTo(TODAY.d, TODAY.m, TODAY.y),
        '`': () => setMode((m) => (m === 'gui' ? 'term' : 'gui')),
      };
      const fn = map[e.key];
      if (fn) {
        e.preventDefault();
        fn();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shiftDay, goMonth, jumpTo]);

  const todayInfo = useMemo(() => getDayInfo(TODAY.d, TODAY.m, TODAY.y), []);

  return (
    <div className="app">
      <header className="head">
        <div className="brand">
          <span className="brand__mark">âm lịch</span>
          <span className="brand__sub">
            {T.t('app.todayIs')} {TODAY.d}/{TODAY.m} · {todayInfo.lunar.day}/
            {todayInfo.lunar.month} {T.t('label.lunar')} · {todayInfo.canChi.year}
          </span>
        </div>
        <div className="head__spacer" />
        {!online && <span className="offline-badge">{T.t('offline.badge')}</span>}
        <ThemePicker />
        <LangPicker />
        <div className="view-switch">
          <button aria-pressed={mode === 'gui'} onClick={() => setMode('gui')}>
            {T.t('app.calendar')}
          </button>
          <button aria-pressed={mode === 'term'} onClick={() => setMode('term')}>
            {T.t('app.terminal')}
          </button>
        </div>
        <div className="nav">
          <button onClick={() => goMonth(-1)} aria-label={T.t('a11y.prevMonth')}>‹</button>
          <span className="nav__label">
            {T.monthName(view.m, view.y)} <em>/ {view.y}</em>
          </span>
          <button onClick={() => goMonth(1)} aria-label={T.t('a11y.nextMonth')}>›</button>
          <button className="btn-today" onClick={() => jumpTo(TODAY.d, TODAY.m, TODAY.y)}>
            {T.t('app.today')}
          </button>
        </div>
      </header>

      {mode === 'term' ? (
        <Terminal
          view={view}
          setView={(m, y) => setView({ m, y })}
          selJd={selJd}
          onExit={() => setMode('gui')}
        />
      ) : (
      <div className="grid-layout">
        <Calendar
          cells={cells}
          month={view.m}
          year={view.y}
          todayJd={todayJd}
          selectedJd={selJd}
          onSelect={(c) => jumpTo(c.solar.day, c.solar.month, c.solar.year)}
        />
        <div className="side">
          <DayDetail info={selInfo} />
          <Converter onJump={jumpTo} />
        </div>
      </div>
      )}

      <InstallPrompt />

      <footer className="foot">
        <span>
          <kbd>←</kbd> <kbd>→</kbd> {T.t('key.day')}
        </span>
        <span>
          <kbd>↑</kbd> <kbd>↓</kbd> {T.t('key.week')}
        </span>
        <span>
          <kbd>PgUp</kbd> <kbd>PgDn</kbd> {T.t('key.month')}
        </span>
        <span>
          <kbd>T</kbd> {T.t('key.today')}
        </span>
        <span>
          <kbd>`</kbd> {T.t('key.terminal')}
        </span>
        <span style={{ marginLeft: 'auto' }}>
          {T.t('foot.engine')}
        </span>
      </footer>
    </div>
  );
}
