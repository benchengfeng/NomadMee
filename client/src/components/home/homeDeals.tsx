import React from "react";
import { useTranslation } from "react-i18next";

import image1 from "../../assets/images/china/business/businessNegotiation.png";
import image2 from "../../assets/images/china/business/hotel.jpg";
import image3 from "../../assets/images/china/business/loadedPort.jpg";
// import image4 from "../../assets/images/china/products/e-bike.jpeg";
// import image5 from "../../assets/images/china/products/usbLedLights.jpeg";
// import image6 from "../../assets/images/china/products/fashionWoman.jpeg";
// import image7 from "../../assets/images/china/products/motoRainCoat.jpeg";
// import image8 from "../../assets/images/china/products/engineOilWholesale.jpeg";
// import image9 from "../../assets/images/china/products/motoSpareParts.jpeg";

import { Row, Col, Card } from "antd";

const { Meta } = Card;

function HomeDeals() {
  const { t } = useTranslation(); // Initialize t for translations

  const deals = [
    { title: t("deals.businessNegotiations"), image: image1 },
    { title: t("deals.hotelAndAirport"), image: image2 },
    { title: t("deals.guidedBusinessTour"), image: image3 },
  ];
  // const hotPicks = [
  //   { title: t("hotPicks.eBikes"), image: image4 },
  //   { title: t("hotPicks.ledLights"), image: image5 },
  //   { title: t("hotPicks.fashionForWomen"), image: image6 },
  // ];
  // const exclusiveOpps = [
  //   { title: t("exclusiveOpps.motorcycleRainCoats"), image: image7 },
  //   { title: t("exclusiveOpps.wholesaleEngineOil"), image: image8 },
  //   { title: t("exclusiveOpps.motorcycleSpareParts"), image: image9 },
  // ];

  return (
    <div id="feature" className="featureBlock">
      <div className="container">
        <div className="titleHolder">
          <h2>{t("header.title")}</h2>
          <p>{t("header.subtitle")}</p>
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
        {/* <div className="titleHolder">
          <h2>{t("hotPicks.title")}</h2>
          <p>{t("hotPicks.subtitle")}</p>
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
          <h2>{t("exclusiveOpps.title")}</h2>
          <p>{t("exclusiveOpps.subtitle")}</p>
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
        </Row> */}
      </div>
    </div>
  );
}

export default HomeDeals;
