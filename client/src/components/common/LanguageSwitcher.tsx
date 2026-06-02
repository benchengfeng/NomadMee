import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, getLanguageMeta } from '../../i18n';

interface LanguageSwitcherProps {
  /** Visual style: 'pill' for light surfaces, 'ghost' for dark topbars. */
  variant?: 'pill' | 'ghost';
  accentColor?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ variant = 'ghost', accentColor = '#38bdf8' }) => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = getLanguageMeta(i18n.language);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const choose = (code: string) => {
    void i18n.changeLanguage(code);
    setOpen(false);
  };

  return (
    <div className={`lang-switcher lang-switcher--${variant}`} ref={ref}>
      <button
        type="button"
        className="lang-switcher-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={current.label}
      >
        <span className="lang-switcher-flag">{current.flag}</span>
        <span className="lang-switcher-code">{current.code.toUpperCase()}</span>
        <span className="lang-switcher-caret">▾</span>
      </button>

      {open && (
        <ul className="lang-switcher-menu" role="listbox">
          {LANGUAGES.map((lang) => {
            const active = lang.code === current.code;
            return (
              <li key={lang.code} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={`lang-switcher-option${active ? ' lang-switcher-option--active' : ''}`}
                  style={active ? { color: accentColor } : undefined}
                  onClick={() => choose(lang.code)}
                  dir={lang.dir}
                >
                  <span className="lang-switcher-flag">{lang.flag}</span>
                  <span>{lang.label}</span>
                  {active && <span className="lang-switcher-check" style={{ color: accentColor }}>✓</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default LanguageSwitcher;
