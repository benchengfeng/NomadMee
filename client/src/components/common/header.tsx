import React, { useState } from 'react';

import { Anchor, Drawer, Button } from 'antd';
import FetcherHook from '../../api/fetcher';
import { color1 } from '../../global';
import { Image } from "rebass";
import logonomadmee from "../../assets/images/logonomadmee.png"


const { Link } = Anchor;

function AppHeader() {
  const [visible, setVisible] = useState(false);

  const showDrawer = () => {
    setVisible(true);
  };

  const onClose = () => {
    setVisible(false);
  };

  return (
    <div className="container-fluid">
      <div className="header" style={{backgroundColor:`${color1}`}}>
        <div className="logo">
          {/* <i className="fas fa-bolt"></i> */}
          {/* <div style={{color:`${color4}`}}>NomadMee</div> */}
          <Image src={logonomadmee} sx={{width:"23%"}}></Image>
          <FetcherHook/>
        </div>
        <div className="mobileHidden">
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
        <div className="mobileVisible">
          <Button type="primary" onClick={showDrawer}>
            <i className="fas fa-bars"></i>
          </Button>
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
              {/* <Link href="#pricing" title="Pricing" /> */}
              {/* <Link href="#contact" title="Contact" /> */}
            </Anchor>
          </Drawer>
        </div>
      </div>
    </div>
  );
}

export default AppHeader;