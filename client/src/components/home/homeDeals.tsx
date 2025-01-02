import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Row, Col, Card } from "antd";

import image1 from "../../assets/images/china/business/businessNegotiation.png";
import image2 from "../../assets/images/china/business/hotel.jpg";
import image3 from "../../assets/images/china/business/loadedPort.jpg";

const { Meta } = Card;

// Define Deal type
interface Deal {
  title: string;
  image: string;
  description: string;
}

function HomeDeals() {
  const { t } = useTranslation(); // Initialize t for translations

  // State to manage modal visibility and content, typed with the Deal type
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState<Deal | {}>({}); // Initial state is an empty object, but it's of type Deal | {}

  // Deals data including description
  const deals: Deal[] = [
    {
      title: t("deals.businessNegotiations"),
      image: image1,
      description: t("deals.businessNegotiationDescription"),
    },
    {
      title: t("deals.hotelAndAirport"),
      image: image2,
      description: t("deals.hotelAndAirportDescription"),
    },
    {
      title: t("deals.guidedBusinessTour"),
      image: image3,
      description: t("deals.guidedBusinessTourDescription"),
    },
  ];

  // Function to show the modal with the selected deal
  const showModal = (deal: Deal) => {
    setModalContent(deal);
    setIsModalVisible(true);
  };

  // Function to handle closing of the modal
  const handleCancel = () => {
    setIsModalVisible(false);
  };

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
                onClick={() => showModal(deal)} // Open modal on card click
              >
                <Meta title={deal.title} />
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Modal to show deal details */}
      <Modal
        title={modalContent && 'title' in modalContent ? modalContent.title : ""}
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <img alt={modalContent && 'title' in modalContent ? modalContent.title : ""} src={modalContent && 'image' in modalContent ? modalContent.image : ""} style={{ width: "100%" }} />
        <p>{modalContent && 'description' in modalContent ? modalContent.description : ""}</p>
      </Modal>
    </div>
  );
}

export default HomeDeals;
