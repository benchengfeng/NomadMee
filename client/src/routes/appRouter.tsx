// AppRouter.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Features from '../components/home/feature';
import AppHome from '../views/home';
import FetcherHook from '../api/fetcher';

const AppRouter = () => {
  const isBrandEnabled = FetcherHook()
  return (
    <Router>
      <Routes>
      <Route path="/" element={ isBrandEnabled ? <AppHome /> : " On Dit Quoi ??"} />
        <Route path="/features" element={<Features />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
