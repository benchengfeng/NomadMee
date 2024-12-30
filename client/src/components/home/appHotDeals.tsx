import React from "react";

// import image1 from "../../assets/images/china/business/businessNegotiation.png";
// import image2 from "../../assets/images/china/business/hotel.jpg";
// import image3 from "../../assets/images/china/business/loadedPort.jpg";
import image4 from "../../assets/images/china/products/truck.jpg";
import image5 from "../../assets/images/china/products/komatsu.png";
import image6 from "../../assets/images/china/products/mixerTruck.jpg";
import image7 from "../../assets/images/china/products/factoryMachines.jpg";
import image8 from "../../assets/images/china/products/printers.jpg";
import image9 from "../../assets/images/china/products/motoSpareParts.jpeg";

import { Row, Col, Card } from "antd";

const { Meta } = Card;

function AppHotDeals() {
  // const deals = [
  //   { title: "Business Negotiations", image: image1 },
  //   { title: "Hotel & Airport", image: image2 },
  //   { title: "Guided Business Tour", image: image3 },
  // ];

  const exclusiveOpps = [
    { title: "Trucks", image: image4 },
    { title: "Excavators ", image: image5 },
    { title: "Mixer Trucks", image: image6 },
  ];
  const hotPicks = [
    { title: "Manufacturing Equipment", image: image7 },
    { title: "Printers", image: image8 },
    { title: "Motorcycle Spare Parts", image: image9 },
  ];

  return (
    <div id="feature" className="featureBlock">
      <div className="container">
        {/* <div className="titleHolder">
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
        </Row> */}
        <div className="titleHolder">
          <h2>Buy One get One for FREE!</h2>
          <p>Exclusive Opportunities</p>
        </div>
        <Row gutter={[24, 24]}>
          {exclusiveOpps.map((hotPick, index) => (
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
        {/* New Row for Video */}
        <Row className="videoSection">
          <Col span={24}>
            <h2 className="videoTitle">Discover More in Our Video</h2>
            <div className="videoContainer">
              <iframe
                className="videoFrame"
                src="https://www.youtube.com/embed/5yFjjwqcrhM"
                title="Exclusive Opportunities Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </Col>
        </Row>
        <div className="titleHolder">
          <h2>Hot Picks</h2>
          <p>Discover the advantages that make our platform stand out.</p>
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
        <Row className="videoSection">
          <Col span={24}>
            <h2 className="videoTitle">Discover More in Our Video</h2>
            <div className="videoContainer">
              <iframe
                className="videoFrame"
                src="https://www.youtube.com/embed/cHT-3ph5njg"
                title="Exclusive Opportunities Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
}

export default AppHotDeals;
