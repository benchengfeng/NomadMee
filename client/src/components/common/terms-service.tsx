import React from 'react';
import { useTranslation } from 'react-i18next';

const TermsOfService = () => {
  const { t } = useTranslation();

  return (
    <div className="terms-container">
      <h1 className="terms-title">{t('termsOfService.title')}</h1>
      <p className="terms-introduction">{t('termsOfService.introduction')}</p>

      <section className="terms-section">
        <h2 className="terms-subtitle">{t('termsOfService.section1.title')}</h2>
        <p>{t('termsOfService.section1.description')}</p>
        <ul className="terms-list">
          <li>{t('termsOfService.section1.item1')}</li>
          <li>{t('termsOfService.section1.item2')}</li>
          <li>{t('termsOfService.section1.item3')}</li>
        </ul>
      </section>

      <section className="terms-section">
        <h2 className="terms-subtitle">{t('termsOfService.section2.title')}</h2>
        <p>{t('termsOfService.section2.description')}</p>
        <ul className="terms-list">
          <li>{t('termsOfService.section2.item1')}</li>
          <li>{t('termsOfService.section2.item2')}</li>
          <li>{t('termsOfService.section2.item3')}</li>
        </ul>
      </section>

      <section className="terms-section">
        <h2 className="terms-subtitle">{t('termsOfService.section3.title')}</h2>
        <p>{t('termsOfService.section3.description')}</p>
        <ul className="terms-list">
          <li>{t('termsOfService.section3.item1')}</li>
          <li>{t('termsOfService.section3.item2')}</li>
          <li>{t('termsOfService.section3.item3')}</li>
        </ul>
      </section>

      <section className="terms-section">
        <h2 className="terms-subtitle">{t('termsOfService.section4.title')}</h2>
        <p>{t('termsOfService.section4.description')}</p>
      </section>

      <section className="terms-section">
        <h2 className="terms-subtitle">{t('termsOfService.section5.title')}</h2>
        <p>{t('termsOfService.section5.description')}</p>
      </section>

      <section className="terms-section">
        <h2 className="terms-subtitle">{t('termsOfService.section6.title')}</h2>
        <p>{t('termsOfService.section6.description')}</p>
      </section>

      <section className="terms-section">
        <h2 className="terms-subtitle">{t('termsOfService.section7.title')}</h2>
        <p>{t('termsOfService.section7.description')}</p>
      </section>

    </div>
  );
}

export default TermsOfService;
