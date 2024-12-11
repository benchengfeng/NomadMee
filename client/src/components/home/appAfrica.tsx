import React from "react";

import image4 from "../../assets/images/africa/products/acajou.jpg";
import image5 from "../../assets/images/africa/products/arachide.jpg";
import image6 from "../../assets/images/africa/products/essentialOils.jpg";
import image7 from "../../assets/images/africa/products/artistana.jpg";
import image8 from "../../assets/images/africa/products/djembe.jpg";
import image9 from "../../assets/images/africa/products/karite.jpg";

import { Row, Col, Card } from "antd";

const { Meta } = Card;

function AppChina() {
  const hotPicks = [
    { title: "cashew nuts", image: image4 },
    { title: "Peanuts", image: image5 },
    { title: "Essential Oils", image: image6 },
  ];
  const exclusiveOpps = [
    { title: "Artisans", image: image7 },
    { title: "Djembe Drums", image: image8 },
    { title: "Shea Butter", image: image9 },
  ];

  return (
    <div id="feature" className="featureBlock">
      <div className="container">
        <div className="titleHolder">
          <h2>Hot Picks for Traders</h2>
          <p>Unveiling Exclusive Deals for Savvy Traders</p>
        </div>
        <Row gutter={[24, 24]}>
          {hotPicks.map((hotPick, index) => (
            <Col xs={24} sm={12} md={8} key={index}>
              <Card
                hoverable
                cover={
                  <img alt={hotPick.title} src={hotPick.image} />
                }
                className="featureCard"
              >
                <Meta title={hotPick.title} />
              </Card>
            </Col>
          ))}
        </Row>
        <div className="titleHolder">
          <h2>Exclusive Opportunities</h2>
          <p>Discover the advantages that make our platform stand out.</p>
        </div>
        <Row gutter={[24, 24]}>
          {exclusiveOpps.map((exclusiveOpp, index) => (
            <Col xs={24} sm={12} md={8} key={index}>
              <Card
                hoverable
                cover={
                  <img alt={exclusiveOpp.title} src={exclusiveOpp.image} />
                }
                className="featureCard"
              >
                <Meta title={exclusiveOpp.title} />
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
}

export default AppChina;
