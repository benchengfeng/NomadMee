import React from 'react';
import { useTranslation } from 'react-i18next';

const PrivacyPolicy: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="privacy-policy-container">
      <header className="privacy-policy-header">
        <h1>{t('privacyPolicy.title')}</h1>
        <p>{t('privacyPolicy.introduction')}</p>
      </header>

      <section className="privacy-policy-section">
        <h2>{t('privacyPolicy.section1.title')}</h2>
        <p>{t('privacyPolicy.section1.description')}</p>
        <ul>
          <li><strong>{t('privacyPolicy.section1.item1.title')}:</strong> {t('privacyPolicy.section1.item1.description')}</li>
          <li><strong>{t('privacyPolicy.section1.item2.title')}:</strong> {t('privacyPolicy.section1.item2.description')}</li>
          <li><strong>{t('privacyPolicy.section1.item3.title')}:</strong> {t('privacyPolicy.section1.item3.description')}</li>
        </ul>
      </section>

      <section className="privacy-policy-section">
        <h2>{t('privacyPolicy.section2.title')}</h2>
        <p>{t('privacyPolicy.section2.description')}</p>
        <ul>
          <li>{t('privacyPolicy.section2.item1')}</li>
          <li>{t('privacyPolicy.section2.item2')}</li>
          <li>{t('privacyPolicy.section2.item3')}</li>
          <li>{t('privacyPolicy.section2.item4')}</li>
        </ul>
      </section>

      <section className="privacy-policy-section">
        <h2>{t('privacyPolicy.section3.title')}</h2>
        <p>{t('privacyPolicy.section3.description')}</p>
        <ul>
          <li><strong>{t('privacyPolicy.section3.item1.title')}:</strong> {t('privacyPolicy.section3.item1.description')}</li>
          <li><strong>{t('privacyPolicy.section3.item2.title')}:</strong> {t('privacyPolicy.section3.item2.description')}</li>
          <li><strong>{t('privacyPolicy.section3.item3.title')}:</strong> {t('privacyPolicy.section3.item3.description')}</li>
        </ul>
      </section>

      <section className="privacy-policy-section">
        <h2>{t('privacyPolicy.section4.title')}</h2>
        <p>{t('privacyPolicy.section4.description')}</p>
      </section>

      <section className="privacy-policy-section">
        <h2>{t('privacyPolicy.section5.title')}</h2>
        <p>{t('privacyPolicy.section5.description')}</p>
      </section>

      <section className="privacy-policy-section">
        <h2>{t('privacyPolicy.section6.title')}</h2>
        <p>{t('privacyPolicy.section6.description')}</p>
      </section>

      <section className="privacy-policy-section">
        <h2>{t('privacyPolicy.section7.title')}</h2>
        <p>{t('privacyPolicy.section7.description')}</p>
      </section>

      <section className="privacy-policy-contact">
        <h2>{t('privacyPolicy.contact.title')}</h2>
        <p>{t('privacyPolicy.contact.email')}: <a href="mailto:sales@nomadmeshop.com">sales@nomadmeshop.com</a></p>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
