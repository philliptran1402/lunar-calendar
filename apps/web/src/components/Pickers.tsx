import { useEffect, useRef, useState } from 'react';
import { LANGS } from '../i18n';
import { THEMES, useSettings } from '../settings';

/** Menu nho dong khi bam ra ngoai / bam Esc. */
function useDismiss(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);
  return ref;
}

export function ThemePicker() {
  const { theme, setTheme, i18n } = useSettings();
  const [open, setOpen] = useState(false);
  const ref = useDismiss(() => setOpen(false));
  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <div className="picker" ref={ref}>
      <button
        className="picker__btn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={i18n.t('a11y.theme')}
        title={current.name}
      >
        <span className="swatches">
          {current.colors.map((c) => (
            <i key={c} style={{ background: c }} />
          ))}
        </span>
      </button>
      {open && (
        <div className="picker__menu" role="menu">
          {THEMES.map((t) => (
            <button
              key={t.id}
              className="picker__item"
              role="menuitemradio"
              aria-checked={t.id === theme}
              onClick={() => {
                setTheme(t.id);
                setOpen(false);
              }}
            >
              <span className="swatches">
                {t.colors.map((c) => (
                  <i key={c} style={{ background: c }} />
                ))}
              </span>
              {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function LangPicker() {
  const { lang, setLang, i18n } = useSettings();
  const [open, setOpen] = useState(false);
  const ref = useDismiss(() => setOpen(false));

  return (
    <div className="picker" ref={ref}>
      <button
        className="picker__btn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={i18n.t('a11y.lang')}
      >
        {lang.toUpperCase()}
      </button>
      {open && (
        <div className="picker__menu" role="menu" style={{ minWidth: 150 }}>
          {LANGS.map((l) => (
            <button
              key={l.code}
              className="picker__item"
              role="menuitemradio"
              aria-checked={l.code === lang}
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
            >
              <span>{l.flag}</span>
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
