import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      className="goTop"
      aria-label={t('footer.backToTop')}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <i className="fas fa-arrow-circle-up"></i>
    </button>
  );
}

function AppFooter() {
  const { t } = useTranslation();

  return (
    <div className="container-fluid">
      <div className="footer">
        <div className="logo">
          <i className="fas fa-bolt"></i>
          <a href="http://nomadmeshop.com">nomadme</a>
        </div>
        <ul className="socials">
          <li><a href="https://www.facebook.com/" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a></li>
          <li><a href="https://www.twitter.com/" aria-label="Twitter"><i className="fab fa-twitter"></i></a></li>
          <li><a href="https://www.linkedin.com/" aria-label="LinkedIn"><i className="fab fa-linkedin-in"></i></a></li>
          <li><a href="https://www.pinterest.com/" aria-label="Pinterest"><i className="fab fa-pinterest-p"></i></a></li>
          <li><a href="https://www.instagram.com/" aria-label="Instagram"><i className="fab fa-instagram"></i></a></li>
        </ul>
        <div className="contact-info">
          <p>Email: <a href="mailto:sales@nomadmeshop.com">sales@nomadmeshop.com</a></p>
          <p>Phone: <a href="tel:+8619876297359">+8619876297359</a></p>
        </div>
        <div className="legal-links">
          <a href="/privacy-policy">{t('footer.privacyPolicy')}</a> | <a href="/terms-of-service">{t('footer.termsOfService')}</a>
        </div>
        <div className="copyright">
          {t('footer.copyright', { year: new Date().getFullYear(), company: 'CF' })}
        </div>
        <ScrollToTop />
      </div>
    </div>
  );
}

export default AppFooter;
