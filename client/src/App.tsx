import React from "react";
import "./App.css";
import "antd/dist/antd.css";
import AppRouter from "./routes/appRouter";
import ErrorBoundary from "./components/common/ErrorBoundary";
import "./styles/investor.css";
import "./i18n";

function App() {
  return (
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  );
}

export default App;
