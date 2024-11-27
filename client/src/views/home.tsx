import React from "react";

// import AppHero from "../components/home/hero";
import BusinessShowcase from "../components/home/buisinessShowCase";
import AppAbout from '../components/home/about';
// import AppFeature from '../components/home/feature';
// import AppWorks from '../components/home/works';
// import AppFaq from '../components/home/faq';
// import AppPricing from '../components/home/pricing';
import AppContact from '../components/home/contact';
import AppFooter from "../components/common/footer";

function AppHome() {
  return (
    <div className="main">
      <BusinessShowcase/>
      <AppAbout/>
      <AppContact/>
      <AppFooter/>
    </div>
  );
}

export default AppHome;
