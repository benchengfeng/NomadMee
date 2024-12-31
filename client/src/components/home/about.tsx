import React from "react";
import { useTranslation } from "react-i18next";
import { Row, Col } from "antd";
import { color1, color2 } from "../../global";

function AppAbout() {
  const { t } = useTranslation(); // Initialize t for translations

  const items = [
    {
      key: "1",
      icon: <i className="fas fa-handshake" style={{ color: color2 }}></i>,
      title: t("about.items.personalizedSourcing.title"),
      content: t("about.items.personalizedSourcing.content"),
    },
    {
      key: "2",
      icon: <i className="fas fa-map-marked-alt" style={{ color: color2 }}></i>,
      title: t("about.items.seamlessNavigation.title"),
      content: t("about.items.seamlessNavigation.content"),
    },
    {
      key: "3",
      icon: <i className="fas fa-briefcase" style={{ color: color2 }}></i>,
      title: t("about.items.efficientFacilitation.title"),
      content: t("about.items.efficientFacilitation.content"),
    },
  ];

  return (
    <div id="about" className="block aboutBlock">
      <div className="container-fluid" style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div className="titleHolder">
          <h2 style={{ color: color1 }}>{t("about.title")}</h2>
          <p>{t("about.description")}</p>
        </div>
        <Row gutter={[32, 32]}>
          {items.map((item) => (
            <Col md={{ span: 8 }} key={item.key}>
              <div className="content">
                <div className="icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.content}</p>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
}

export default AppAbout;
