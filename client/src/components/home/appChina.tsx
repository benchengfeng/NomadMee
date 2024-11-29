import React from "react";

import image1 from "../../assets/images/china/business/businessNegotiation.png";
import image2 from "../../assets/images/china/business/hotel.jpg";
import image3 from "../../assets/images/china/business/loadedPort.jpg";
import image4 from "../../assets/images/china/products/e-bike.jpeg";
import image5 from "../../assets/images/china/products/usbLedLights.jpeg";
import image6 from "../../assets/images/china/products/fashionWoman.jpeg";
import image7 from "../../assets/images/china/products/motoRainCoat.jpeg";
import image8 from "../../assets/images/china/products/engineOilWholesale.jpeg";
import image9 from "../../assets/images/china/products/motoSpareParts.jpeg";

import { Row, Col, Card } from "antd";

const { Meta } = Card;

function AppChina() {
  const deals = [
    { title: "Business Negotiations", image: image1 },
    { title: "Hotel & Airport", image: image2 },
    { title: "Guided Business Tour", image: image3 },
  ];
  const hotPicks = [
    { title: "E-Bikes", image: image4 },
    { title: "Led Lights", image: image5 },
    { title: "Fashion for Women", image: image6 },
  ];
  const exclusiveOpps = [
    { title: "Motorcycle Rain Coats", image: image7 },
    { title: "Wholesale Engine Oil", image: image8 },
    { title: "Motorcycle Spare Parts", image: image9 },
  ];

  return (
    <div id="feature" className="featureBlock">
      <div className="container">
        <div className="titleHolder">
          <h2>Explore, Connect, and Trade with Confidence</h2>
          <p>We Handle the Details, You Focus on Growth</p>
        </div>
        <Row gutter={[24, 24]}>
          {deals.map((deal, index) => (
            <Col xs={24} sm={12} md={8} key={index}>
              <Card
                hoverable
                cover={<img alt={deal.title} src={deal.image} />}
                className="featureCard"
              >
                <Meta title={deal.title} />
              </Card>
            </Col>
          ))}
        </Row>
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
