import React from 'react';
import { BackTop } from 'antd';
import { useTranslation } from 'react-i18next';

function AppFooter() {
  const { t } = useTranslation();

  return (
    <div className="container-fluid">
      <div className="footer">
        <div className="logo">
          <i className="fas fa-bolt"></i>
          <a href="http://nomadmeshop.com">NomadMee</a>
        </div>
        <ul className="socials">
          <li><a href="https://www.facebook.com/" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a></li>
          <li><a href="https://www.twitter.com/" aria-label="Twitter"><i className="fab fa-twitter"></i></a></li>
          <li><a href="https://www.linkedin.com/" aria-label="LinkedIn"><i className="fab fa-linkedin-in"></i></a></li>
          <li><a href="https://www.pinterest.com/" aria-label="Pinterest"><i className="fab fa-pinterest-p"></i></a></li>
          <li><a href="https://www.instagram.com/" aria-label="Instagram"><i className="fab fa-instagram"></i></a></li>
        </ul>
        <div className="contact-info">
          <p>Email: <a href="mailto:amine_bh@outlook.com">amine_bh@outlook.com</a></p>
          <p>Phone: <a href="tel:+8619876297359">+8619876297359</a></p>
        </div>
        <div className="legal-links">
          <a href="/privacy-policy">{t('footer.privacyPolicy')}</a> | <a href="/terms-of-service">{t('footer.termsOfService')}</a>
        </div>
        <div className="copyright">
          {t('footer.copyright', { year: new Date().getFullYear(), company: 'CF' })}
        </div>
        <BackTop>
          <div className="goTop" aria-label={t('footer.backToTop')}><i className="fas fa-arrow-circle-up"></i></div>
        </BackTop>
      </div>
    </div>
  );
}

export default AppFooter;
