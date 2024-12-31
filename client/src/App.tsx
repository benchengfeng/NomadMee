// App.js
import React from "react";
import "./App.css";
import "antd/dist/antd.css";
import AppHeader from "./components/common/header";
import { Layout } from "antd";
import AppRouter from "./routes/appRouter";
import "./i18n";
// import AppHero from "./components/home/hero";
// import BusinessShowcase from "./components/home/buisinessShowCase";

const { Header, Content } = Layout;

function App() {
  return (
    <Layout className="mainLayout">
      <Header>
        <AppHeader />
      </Header>
      <Content>
        <AppRouter />
      </Content>
    </Layout>
  );
}

export default App;
