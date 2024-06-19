// App.js
import React from "react";
import "./App.css";
import "antd/dist/antd.css";
import AppHeader from "./components/common/header";
import AppFooter from "./components/common/footer";
import { Layout } from "antd";
import AppRouter from "./routes/appRouter";
import AppHero from "./components/home/hero";

const { Header, Content, Footer } = Layout;

function App() {
  return (
    <Layout className="mainLayout">
      <Header>
        <AppHeader />
      </Header>
      <Content>
        <AppHero/>
        {/* Include AppRouter here to render different views */}
        <AppRouter />
      </Content>
      <Footer>
        <AppFooter />
      </Footer>
    </Layout>
  );
}

export default App;
