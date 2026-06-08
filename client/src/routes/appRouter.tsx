import React, { useEffect } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { track } from "../utils/analytics";

const PageTracker: React.FC = () => {
  const location = useLocation();
  useEffect(() => {
    track('page-view', { path: location.pathname });
  }, [location.pathname]);
  return null;
};
import AppHotDeals from "../components/home/appHotDeals";
import AppHome from "../views/home";
import PrivacyPolicy from "../components/common/privacy-policy";
import TermsOfService from "../components/common/terms-service";
import AboutUs from "../components/home/aboutUs";
import AppContact from "../components/home/contact";
import InvestorLogin from "../views/investorLogin";
import InvestorHome from "../views/investorHome";
import KycOnboarding from "../views/kycOnboarding";
import AdminLogin from "../views/adminLogin";
import AdminDashboard from "../views/adminDashboard";
import JoinInvestment from "../views/joinInvestment";
import ContactUs from "../views/contactUs";
import ShopPage from "../views/shopPage";
import NotFound from "../views/notFound";
import { getAdminToken, getSessionToken } from "../utils/auth";

const InvestorProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const token = getSessionToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AdminProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const token = getAdminToken();
  if (!token) {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

const AppRouter = () => {
  return (
    <Router>
      <PageTracker />
      <Routes>
        <Route path="/" element={<AppHome />} />
        <Route path="/login" element={<InvestorLogin />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route
          path="/onboarding"
          element={
            <InvestorProtectedRoute>
              <KycOnboarding />
            </InvestorProtectedRoute>
          }
        />
        <Route
          path="/home"
          element={
            <InvestorProtectedRoute>
              <InvestorHome />
            </InvestorProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          }
        />
        <Route path="/join/:investmentId" element={<JoinInvestment />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/shop/:productId" element={<ShopPage />} />
        <Route path="/landing" element={<AppHome />} />
        <Route path="/hotDeals" element={<AppHotDeals />} />
        <Route path="/aboutUs" element={<AboutUs />} />
        <Route path="/contact" element={<AppContact />} />
        {/* <Route path="/africa" element={<AppAfrica />} />
        <Route path="/europe" element={<AppEurope />} /> */}
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
