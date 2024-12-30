// App.js
import React from "react";
import "./App.css";
import "antd/dist/antd.css";
import AppHeader from "./components/common/header";
import { Layout } from "antd";
import AppRouter from "./routes/appRouter";
// import { I18nextProvider } from 'react-i18next';
// import i18n from './hooks/i18n'; // 
// import AppHero from "./components/home/hero";
// import BusinessShowcase from "./components/home/buisinessShowCase";

const { Header, Content } = Layout;

function App() {
  return (
    // <I18nextProvider i18n={i18n}>
    <Layout className="mainLayout">
      <Header>
        <AppHeader />
      </Header>
      <Content>
        <AppRouter />
      </Content>
    </Layout>
    // </I18nextProvider>
  );
}

export default App;
