import type { DayInfo } from '@lunar-calendar/sdk';
import { useT } from '../settings';

interface Props {
  cells: DayInfo[];
  month: number;
  year: number;
  todayJd: number;
  selectedJd: number;
  onSelect: (d: DayInfo) => void;
}

export function Calendar({ cells, month, year, todayJd, selectedJd, onSelect }: Props) {
  const T = useT();
  // Tuan bat dau Thu Hai -> index 1..6 roi 0 (Chu Nhat)
  const weekdays = [1, 2, 3, 4, 5, 6, 0];
  return (
    <section className="panel panel--cal">
      <div className="panel__title">
        <span>{T.t('panel.month')}</span>
        <span>
          {cells.filter((c) => c.solar.month === month).length} {T.t('panel.days')} ·{' '}
          {T.t('panel.monthNote')}
        </span>
      </div>
      <div className="weekdays" aria-hidden="true">
        {weekdays.map((i) => (
          <span key={i}>{T.weekdayShort(i === 0 ? 6 : i - 1)}</span>
        ))}
      </div>
      <div className="cells" role="grid">
        {cells.map((c) => {
          const out = c.solar.month !== month || c.solar.year !== year;
          const holiday = c.holidays[0];
          const classes = [
            'cell',
            out && 'cell--out',
            c.solar.weekdayIndex === 0 && 'cell--sun',
            c.jd === todayJd && 'cell--today',
            c.jd === selectedJd && 'cell--selected',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={c.jd}
              className={classes}
              role="gridcell"
              onClick={() => onSelect(c)}
              aria-label={`${c.solar.day}/${c.solar.month} — ${c.lunar.day}/${c.lunar.month} ${T.t('label.lunar')}`}
              aria-current={c.jd === todayJd ? 'date' : undefined}
            >
              <span
                className={`cell__dot cell__dot--${c.quality.auspicious ? 'good' : 'bad'}`}
                title={`${c.quality.star} — ${c.quality.auspicious ? T.t('quality.good') : T.t('quality.bad')}`}
              />
              <span className="cell__solar">{c.solar.day}</span>
              <span
                className={`cell__lunar ${c.lunar.day === 1 ? 'cell__lunar--first' : ''}`}
              >
                {c.lunar.day === 1
                  ? `${c.lunar.day}/${c.lunar.month}${c.lunar.leap ? 'N' : ''}`
                  : c.lunar.day}
              </span>
              {c.solarTerm.isStart && (
                <span className="cell__term">{T.solarTerm(c.solarTerm.index, c.solarTerm.name)}</span>
              )}
              {holiday && !c.solarTerm.isStart && (
                <span className="cell__holiday">{T.holiday(holiday.id, holiday.name)}</span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
