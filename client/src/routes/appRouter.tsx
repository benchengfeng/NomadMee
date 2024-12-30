// AppRouter.js
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import AppHotDeals from "../components/home/appHotDeals";
import AppHome from "../views/home";
import AppAfrica from "../components/home/appAfrica";
import AppEurope from "../components/home/appEurope";
// import FetcherHook from '../api/fetcher';

const AppRouter = () => {
  // const isBrandEnabled = FetcherHook()
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppHome />} />
        <Route path="/hotDeals" element={<AppHotDeals />} />
        <Route path="/africa" element={<AppAfrica />} />
        <Route path="/europe" element={<AppEurope />} />

      </Routes>
    </Router>
  );
};

export default AppRouter;
