import { useState } from 'react';
import type { DayInfo } from '@lunar-calendar/sdk';
import { useT } from '../settings';

const pad = (n: number) => String(n).padStart(2, '0');

export function DayDetail({ info }: { info: DayInfo }) {
  const [copied, setCopied] = useState(false);
  const T = useT();

  const copyJson = async () => {
    await navigator.clipboard.writeText(JSON.stringify(info, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section className="panel">
      <div className="panel__title">
        <span>{T.t('panel.day')}</span>
        {/* Dan lap trinh thich lay duoc du lieu tho — khong bat phai go lai */}
        <button className="copy-btn" onClick={copyJson}>
          {copied ? T.t('action.copied') : T.t('action.copyJson')}
        </button>
      </div>

      <div className="detail">
        <div className="detail__hero">
          <div className="detail__big">{pad(info.solar.day)}</div>
          <div className="detail__meta">
            <div>
              <b>{T.weekday(info.solar.weekdayIndex)}</b>
            </div>
            <div>
              {T.monthName(info.solar.month, info.solar.year)} {info.solar.year}
            </div>
          </div>
        </div>

        <div className="lunar-box">
          <div className="lunar-box__day">
            {info.lunar.day}/{info.lunar.month}
            {info.lunar.leap && <span title={T.t('label.leap')}> ({T.t('label.leap')})</span>}
          </div>
          <div className="lunar-box__sub">
            {T.t('label.lunar')} · {T.t('label.year')} {info.canChi.year} (
            {T.zodiac(info.conGiapIndex, info.conGiap)}) ·{' '}
            {T.t('label.monthLen', { n: info.lunar.monthLength })}
          </div>
        </div>

        {info.holidays.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {info.holidays.map((h) => (
              <span
                key={h.name}
                className={`tag ${h.publicHoliday ? 'tag--public' : 'tag--holiday'}`}
              >
                {T.holiday(h.id, h.name)}
              </span>
            ))}
          </div>
        )}

        <div className="rows">
          <div className="row">
            <span className="row__k">{T.t('row.canChiDay')}</span>
            <span className="row__v">{info.canChi.day}</span>
          </div>
          <div className="row">
            <span className="row__k">{T.t('row.canChiMonth')}</span>
            <span className="row__v">{info.canChi.month}</span>
          </div>
          <div className="row">
            <span className="row__k">{T.t('row.solarTerm')}</span>
            <span className="row__v">
              <span className="tag tag--term">
                {T.solarTerm(info.solarTerm.index, info.solarTerm.name)}
              </span>
              {info.solarTerm.isStart && ` ${T.t('term.start')}`}
            </span>
          </div>
          <div className="row">
            <span className="row__k">{T.t('row.truc')}</span>
            <span className="row__v">
              {info.quality.star}{' '}
              <span className={`tag ${info.quality.auspicious ? 'tag--good' : 'tag--bad'}`}>
                {info.quality.auspicious ? T.t('quality.good') : T.t('quality.bad')}
              </span>
            </span>
          </div>
          <div className="row">
            <span className="row__k">{T.t('row.julian')}</span>
            <span className="row__v" style={{ color: 'var(--muted)' }}>
              {info.jd}
            </span>
          </div>
        </div>

        <div>
          <div className="panel__title" style={{ padding: '0 0 8px', border: 0 }}>
            {T.t('panel.luckyHours')}
          </div>
          <div className="hours">
            {info.luckyHours
              .filter((h) => h.auspicious)
              .map((h) => (
                <div key={h.chi} className="hour hour--good" title={`Giờ ${h.chi}`}>
                  <span>{h.chi}</span>
                  <span className="hour__t">{h.range.replace(/:00 – /, '–').replace(':59', '')}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}
