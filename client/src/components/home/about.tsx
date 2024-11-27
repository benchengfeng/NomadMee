import React from 'react';
import { Row, Col } from 'antd';
import { color1, color2 } from '../../global';

const items = [
  {
    key: '1',
    icon: <i className="fas fa-handshake" style={{color:color2}}></i>,
    title: 'Personalized Sourcing',
    content: 'We connect you with the right suppliers and ensure you get the best deals tailored to your specific needs.',
  },
  {
    key: '2',
    icon: <i className="fas fa-map-marked-alt" style={{color:color2}}></i>,
    title: 'Seamless Navigation',
    content: 'Explore China with confidence. We provide guided tours and local insights to help you navigate with ease.',
  },
  {
    key: '3',
    icon: <i className="fas fa-briefcase" style={{color:color2}}></i>,
    title: 'Efficient Facilitation',
    content: 'Our end-to-end support simplifies every step of the process, from negotiation to delivery, saving you time and effort.',
  },
];

function AppAbout() {
  return (
    <div id="about" className="block aboutBlock" >
      <div className="container-fluid" style={{ maxWidth: '1200px', margin: '0 auto' }} >
        <div className="titleHolder" >
          <h2 style={{color:color1}}>About Us</h2>
          <p >
            At the heart of international trade, we bridge gaps, build relationships, and simplify your sourcing journey in China.
          </p>
        </div>
        <Row gutter={[32, 32]}>
          {items.map((item) => (
            <Col md={{ span: 8 }} key={item.key}>
              <div className="content" >
                <div className="icon" >
                  {item.icon}
                </div>
                <h3 >{item.title}</h3>
                <p >{item.content}</p>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
}

export default AppAbout;
