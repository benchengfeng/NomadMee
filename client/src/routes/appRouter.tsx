import React from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import AppHotDeals from "../components/home/appHotDeals";
import AppHome from "../views/home";
// import AppAfrica from "../components/home/appAfrica";
// import AppEurope from "../components/home/appEurope";
import PrivacyPolicy from "../components/common/privacy-policy";
import TermsOfService from "../components/common/terms-service";
import AboutUs from "../components/home/aboutUs";
import AppContact from "../components/home/contact";
import InvestorLogin from "../views/investorLogin";
import InvestorHome from "../views/investorHome";
import { getSessionToken } from "../utils/auth";

const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const token = getSessionToken();
  if (!token) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<InvestorLogin />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <InvestorHome />
            </ProtectedRoute>
          }
        />
        <Route path="/landing" element={<AppHome />} />
        <Route path="/hotDeals" element={<AppHotDeals />} />
        <Route path="/aboutUs" element={<AboutUs />} />
        <Route path="/contact" element={<AppContact />} />
        {/* <Route path="/africa" element={<AppAfrica />} />
        <Route path="/europe" element={<AppEurope />} /> */}
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
