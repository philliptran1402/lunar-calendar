import { useEffect, useState } from 'react';
import { useT } from '../settings';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'amlich.install.dismissed';

/**
 * iOS Safari KHONG co beforeinstallprompt (va se khong bao gio co) —
 * chi co the huong dan thu cong. Android/Chrome/Edge thi dung duoc su kien.
 */
const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as { standalone?: boolean }).standalone === true;

export function InstallPrompt() {
  const T = useT();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  // iOS khong bao gio goi prompt() duoc -> LUON dung huong dan thu cong,
  // ke ca khi trinh duyet co ban beforeinstallprompt (vd Chrome gia UA iPhone).
  const iosOnly = showIosHint;

  useEffect(() => {
    if (isStandalone()) return; // da cai roi thi thoi
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch { /* private mode */ }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    if (isIos()) setShowIosHint(true);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const dismiss = () => {
    setDeferred(null);
    setShowIosHint(false);
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* private mode */ }
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  if (!deferred && !showIosHint) return null;

  return (
    <div className="install" role="status">
      <span className="install__icon">⬇</span>
      {deferred && !iosOnly ? (
        <>
          <span>{T.t('install.text')}</span>
          <button className="install__btn" onClick={install}>
            {T.t('install.action')}
          </button>
        </>
      ) : (
        <span>{T.t('install.ios')}</span>
      )}
      <button className="install__x" onClick={dismiss} aria-label={T.t('install.dismiss')}>
        ✕
      </button>
    </div>
  );
}
