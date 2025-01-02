import React from "react";
import { Form, Input, Button, notification } from "antd";
import { useTranslation } from "react-i18next";
import { FaWhatsapp, FaWeixin } from 'react-icons/fa'; // Import WhatsApp and WeChat icons

const { TextArea } = Input;

function AppContact() {
  const { t } = useTranslation(); // Initialize t for translations

  const onFinish = (values: any) => {
    // Format the form data into a nicely structured text body
    const emailBody = `
      **Name:** ${values.fullname}
      **Email:** ${values.email}
      **Phone:** ${values.telephone || 'Not provided'}
      **Subject:** ${values.subject}
      **Message:**
      ${values.message}
    `;

    const apiUrl = process.env['REACT_APP_API_URL'];

    // Now, send the formatted email body to the backend
    fetch(`${apiUrl}/api/sendEmail`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: values.email, // Sender's email
        subject: values.subject, // Subject
        message: emailBody, // Formatted message body
        html: `<p>${values.message}</p>`, // HTML version (optional)
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message === 'Email sent successfully') {
          notification.success({ message: t("contact.successMessage") });
        } else {
          notification.error({
            message: t("contact.failureMessage"),
            description: data.error,
          });
        }
      })
      .catch((error) => {
        notification.error({
          message: t("contact.errorMessage"),
          description: error.toString(),
        });
      });
  };

  return (
    <div id="contact" className="block contactBlock">
      <div className="container-fluid">
        <div className="titleHolder">
          <h2>{t("contact.title")}</h2>
          <p>{t("contact.description")}</p>
        </div>
        <Form
          name="contact_form"
          className="contact-form"
          layout="vertical"
          initialValues={{ remember: true }}
          onFinish={onFinish}
        >
          <Form.Item
            name="fullname"
            label={t("contact.form.fullName.label")}
            rules={[
              { required: true, message: t("contact.form.fullName.error") },
            ]}
          >
            <Input placeholder={t("contact.form.fullName.placeholder")} />
          </Form.Item>
          <Form.Item
            name="email"
            label={t("contact.form.email.label")}
            rules={[
              { type: "email", message: t("contact.form.email.invalid") },
              { required: true, message: t("contact.form.email.error") },
            ]}
          >
            <Input placeholder={t("contact.form.email.placeholder")} />
          </Form.Item>
          <Form.Item
            name="telephone"
            label={t("contact.form.telephone.label")}
          >
            <Input placeholder={t("contact.form.telephone.placeholder")} />
          </Form.Item>
          <Form.Item name="subject" label={t("contact.form.subject.label")}>
            <Input placeholder={t("contact.form.subject.placeholder")} />
          </Form.Item>
          <Form.Item
            name="message"
            label={t("contact.form.message.label")}
            rules={[
              { required: true, message: t("contact.form.message.error") },
            ]}
          >
            <TextArea rows={4} placeholder={t("contact.form.message.placeholder")} />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="contact-form-button"
            >
              {t("contact.form.submit")}
            </Button>
          </Form.Item>
        </Form>

        {/* WhatsApp and WeChat Contact Info */}
        <div className="contact-icons">
          <div className="contact-icon-item">
            <a href="https://wa.me/+21620086407" target="_blank" rel="noopener noreferrer">
              <FaWhatsapp size={30} color="#25D366" />
              <span>+216 20 086 407</span>
            </a>
          </div>
          <div className="contact-icon-item">
            <a href="weixin://dl/benchengfeng" target="_blank" rel="noopener noreferrer">
              <FaWeixin size={30} color="#1C9B88" />
              <span>+86 198 7629 7359</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppContact;
