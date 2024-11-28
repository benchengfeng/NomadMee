// AppRouter.js
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import AppChina from "../components/home/appChina";
import AppHome from "../views/home";
// import FetcherHook from '../api/fetcher';

const AppRouter = () => {
  // const isBrandEnabled = FetcherHook()
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppHome />} />
        <Route path="/china" element={<AppChina />} />
        <Route path="/africa" element={<AppChina />} />
        <Route path="/europe" element={<AppChina />} />

      </Routes>
    </Router>
  );
};

export default AppRouter;
