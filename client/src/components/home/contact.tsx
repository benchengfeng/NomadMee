import React from 'react';
import { Form, Input, Button } from 'antd';

const { TextArea } = Input;

function AppContact() {
  return (
    <div id="contact" className="block contactBlock">
      <div className="container-fluid">
        <div className="titleHolder">
          <h2>Contact Us</h2>
          <p>We’re here to assist you with sourcing and facilitating your business needs. Reach out to us anytime!</p>
        </div>
        <Form
          name="contact_form"
          className="contact-form"
          layout="vertical"
          initialValues={{ remember: true }}
        >
          <Form.Item
            name="fullname"
            label="Full Name"
            rules={[
              { 
                required: true, 
                message: 'Please enter your full name!' 
              },
            ]}
          >
            <Input placeholder="Enter your full name" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { 
                type: 'email', 
                message: 'The input is not valid E-mail!' 
              },
              { 
                required: true, 
                message: 'Please input your E-mail!' 
              },
            ]}
          >
            <Input placeholder="Enter your email address" />
          </Form.Item>
          <Form.Item
            name="telephone"
            label="Telephone"
          >
            <Input placeholder="Enter your telephone number" />
          </Form.Item>
          <Form.Item
            name="subject"
            label="Subject"
          >
            <Input placeholder="Enter the subject" />
          </Form.Item>
          <Form.Item
            name="message"
            label="Message"
            rules={[
              {
                required: true,
                message: 'Please enter your message!',
              },
            ]}
          >
            <TextArea rows={4} placeholder="Write your message here" />
          </Form.Item>
          <Form.Item>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" className="contact-form-button">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}

export default AppContact;
