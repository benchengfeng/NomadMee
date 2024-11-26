import React, { useState } from "react";
import { Anchor, Drawer } from "antd";
// import FetcherHook from "../../api/fetcher";
import { color1, color4 } from "../../global";
import { Image } from "rebass";
import logonomadmee from "../../assets/images/logonomadmee.png";

const { Link } = Anchor;

function AppHeader() {
  const [visible, setVisible] = useState(false);

  // const showDrawer = () => {
  //   setVisible(true);
  // };

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
          }}
        >
          {/* <i className="fas fa-bolt"></i> */}
          {/* <div style={{color:${color4}}}>NomadMee</div> */}
          <Image src={logonomadmee} sx={{ width: "23%" }} alt="NomadMee Logo" />
          {/* <FetcherHook /> */}
          <div className="contacts">
            <div>
              WhatsApp:{" "}
              <a
                href="https://wa.me/21620086407"
                target="_blank"
                rel="noopener noreferrer"
              >
                +21620086407
              </a>
            </div>
            <div>
              WeChat: <span>+8619876297359</span>
            </div>
            <div>
              Email:{" "}
              <a
                href="mailto:amine_bh@outlook.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                amine_bh@outlook.com
              </a>
            </div>
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
            <div
              style={{ marginTop: "20px", textAlign: "center", color: color4 }}
            >
              <div>
                WhatsApp:{" "}
                <a
                  href="https://wa.me/21620086407"
                  style={{ color: color4 }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  +21620086407
                </a>
              </div>
              <div>
                WeChat: <span style={{ color: color4 }}>+8619876297359</span>
              </div>
              <div>
                Email:{" "}
                <a href="mailto:amine_bh@outlook.com" style={{ color: color4 }}>
                  amine_bh@outlook.com
                </a>
              </div>
            </div>
          </Drawer>
        </div>
      </div>
    </div>
  );
}

export default AppHeader;
