import React from "react";

import image1 from "../../assets/images/modern-design.jpg";
import image2 from "../../assets/images/clean-design.jpg";
import image3 from "../../assets/images/great-support.jpg";
import image4 from "../../assets/images/easy-customise.jpg";
import image5 from "../../assets/images/unlimited-features.jpg";
import image6 from "../../assets/images/advanced-option.jpg";

import { Row, Col, Card } from "antd";

const { Meta } = Card;

function AppAfrica() {
  const hotPicks = [
    // { title: "Modern Design", image: image1 },
    // { title: "Clean and Elegant", image: image2 },
    // { title: "Great Support", image: image3 },
    { title: "Easy to Customise", image: image4 },
    { title: "Unlimited Features", image: image5 },
    { title: "Advanced Options", image: image6 },
  ];
  const exclusiveOpps = [
    { title: "Modern Design", image: image1 },
    { title: "Clean and Elegant", image: image2 },
    { title: "Great Support", image: image3 },
    // { title: "Easy to Customise", image: image4 },
    // { title: "Unlimited Features", image: image5 },
    // { title: "Advanced Options", image: image6 },
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
                cover={<img alt={hotPick.title} src={hotPick.image} />}
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
                cover={<img alt={exclusiveOpp.title} src={exclusiveOpp.image} />}
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

export default AppAfrica;
