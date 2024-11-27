import React, { useState } from "react";
import { Anchor, Drawer } from "antd";
// import FetcherHook from "../../api/fetcher";
import { color1, color4 } from "../../global";
import { Image } from "rebass";
import logonomadmee from "../../assets/images/logonomadmee.png";
import camelsCaravan from "../../assets/images/camelscaravan.png";
import useIsMobile from "../../hooks/useIsMobile";

const { Link } = Anchor;

function AppHeader() {
  const [visible, setVisible] = useState(false);

  // const showDrawer = () => {
  //   setVisible(true);
  // };
  const isMobile = useIsMobile();

  const onClose = () => {
    setVisible(false);
  };

  return (
    <div className="container-fluid">
      <div
        className="header"
        style={{ backgroundColor: color1, padding: "10px 20px" }}
      >
        <div
          className="logo"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            // padding: "0 20px", // Adds some padding to the sides
          }}
        >
          {/* Extreme Left Logo */}
          <div style={{ flex: "0 0 auto" }}>
            <Image
              src={logonomadmee}
              sx={{ width: isMobile ? "80px" : "300px"}}
              alt="NomadMee Logo"
            />
          </div>

          {/* Center Text */}
          <div
            style={{
              flex: "2 0 auto", // Twice the space as the images
              textAlign: "center",
              color: color4,
              fontSize: isMobile ? "1rem" : "2.5rem",
              fontWeight: "bold",
            }}
          >
            Bridging Trade Across Continents
          </div>

          {/* Extreme Right Image */}
          <div style={{ flex: "0 0 auto" }}>
            <Image
              src={camelsCaravan}
              sx={{ width: isMobile ? "80px" : "200px" }}
              alt="Camels Caravan"
            />
          </div>
        </div>

        <div className="mobileHidden" style={{ marginTop: "10px" }}>
          <Anchor targetOffset={65}>
            {/* <Link href="/" title="Home" /> */}
            {/* <Link href="#about" title="About" /> */}
            {/* <Link href="features" title="Features" /> */}
            {/* <Link href="#works" title="How it works" /> */}
            {/* <Link href="#faq" title="FAQ" /> */}
            {/* <Link href="pricing" title="Pricing" /> */}
            {/* <Link href="#contact" title="Contact" /> */}
          </Anchor>
        </div>
        <div className="mobileVisible" style={{ marginTop: "10px" }}>
          {/* <Button type="primary" onClick={showDrawer}>
            <i className="fas fa-bars"></i>
          </Button> */}
          <Drawer
            placement="right"
            closable={false}
            onClose={onClose}
            visible={visible}
          >
            <Anchor targetOffset={65}>
              <Link href="/" title="Home" />
              {/* <Link href="#about" title="About" /> */}
              <Link href="features" title="Features" />
              {/* <Link href="#works" title="How it works" /> */}
              {/* <Link href="#faq" title="FAQ" /> */}
              {/* <Link href="pricing" title="Pricing" /> */}
              {/* <Link href="#contact" title="Contact" /> */}
            </Anchor>
          </Drawer>
        </div>
      </div>
    </div>
  );
}

export default AppHeader;
