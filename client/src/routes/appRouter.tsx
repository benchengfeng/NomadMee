// AppRouter.js
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import AppHotDeals from "../components/home/appHotDeals";
import AppHome from "../views/home";
// import AppAfrica from "../components/home/appAfrica";
// import AppEurope from "../components/home/appEurope";
import PrivacyPolicy from "../components/common/privacy-policy";
import TermsOfService from "../components/common/terms-service";
import AboutUs from "../components/home/aboutUs";
// import FetcherHook from '../api/fetcher';

const AppRouter = () => {
  // const isBrandEnabled = FetcherHook()
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppHome />} />
        <Route path="/hotDeals" element={<AppHotDeals />} />
        <Route path="/aboutUs" element={<AboutUs />} />
        {/* <Route path="/africa" element={<AppAfrica />} />
        <Route path="/europe" element={<AppEurope />} /> */}
        <Route path="/terms-of-service" element={<TermsOfService/>} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />

      </Routes>
    </Router>
  );
};

export default AppRouter;
