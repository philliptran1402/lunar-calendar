import { useMemo, useState } from 'react';
import { lunarToSolar, solarToLunar, integerJd } from '@lunar-calendar/sdk';
import { useT } from '../settings';

type Dir = 's2l' | 'l2s';

/** Doi hai chieu duong <-> am. Dan lap trinh hay can chieu nguoc (am -> duong). */
export function Converter({ onJump }: { onJump: (d: number, m: number, y: number) => void }) {
  const T = useT();
  const now = new Date();
  const [dir, setDir] = useState<Dir>('s2l');
  const [d, setD] = useState(now.getDate());
  const [m, setM] = useState(now.getMonth() + 1);
  const [y, setY] = useState(now.getFullYear());
  const [leap, setLeap] = useState(false);

  const result = useMemo(() => {
    if (!d || !m || !y) return { error: T.t('conv.needAll') };
    try {
      if (dir === 's2l') {
        const l = solarToLunar(d, m, y);
        return {
          text: `${l.day}/${l.month}${l.leap ? ` (${T.t('label.leap')})` : ''}/${l.year} ${T.t('conv.lunar')}`,
          weekday: T.weekday((integerJd(d, m, y) + 1) % 7),
          jump: { d, m, y },
        };
      }
      const s = lunarToSolar(d, m, y, leap);
      if (!s) return { error: T.t('conv.noLeap', { y, m }) };
      return {
        text: `${s.day}/${s.month}/${s.year} ${T.t('conv.solar')}`,
        weekday: T.weekday((integerJd(s.day, s.month, s.year) + 1) % 7),
        jump: { d: s.day, m: s.month, y: s.year },
      };
    } catch {
      return { error: T.t('conv.invalid') };
    }
  }, [dir, d, m, y, leap, T]);

  return (
    <section className="panel">
      <div className="panel__title">
        <span>{T.t('panel.convert')}</span>
        <button
          className="copy-btn"
          onClick={() => setDir(dir === 's2l' ? 'l2s' : 's2l')}
          >
          {dir === 's2l' ? T.t('conv.s2l') : T.t('conv.l2s')} ⇄
        </button>
      </div>

      <div className="conv">
        <div className="conv__row">
          <div className="field">
            <label htmlFor="cd">{T.t('conv.day')}</label>
            <input id="cd" type="number" min={1} max={30} value={d} onChange={(e) => setD(+e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="cm">{T.t('conv.month')}</label>
            <input id="cm" type="number" min={1} max={12} value={m} onChange={(e) => setM(+e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="cy">{T.t('conv.year')}</label>
            <input id="cy" type="number" min={1800} max={2199} value={y} onChange={(e) => setY(+e.target.value)} />
          </div>
        </div>

        {dir === 'l2s' && (
          <label className="checkbox">
            <input type="checkbox" checked={leap} onChange={(e) => setLeap(e.target.checked)} />
            {T.t('conv.leapMonth')}
          </label>
        )}

        {'error' in result ? (
          <div className="conv__out conv__out--err">{result.error}</div>
        ) : (
          <div className="conv__out">
            <b>{result.text}</b>
            <div style={{ color: 'var(--muted)', fontSize: 12.5 }}>
              {result.weekday} ·{' '}
              <button
                className="copy-btn"
                onClick={() => onJump(result.jump.d, result.jump.m, result.jump.y)}
              >
                {T.t('conv.view')}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
