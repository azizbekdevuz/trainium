/* eslint-disable @next/next/no-head-element */
/* eslint-disable @next/next/no-img-element */
import * as React from 'react';

interface ContactFormEmailProps {
  name: string;
  email: string;
  reason: string;
  message: string;
}

export const ContactFormEmail = ({
  name,
  email,
  reason,
  message,
}: ContactFormEmailProps) => {
  return (
    <html>
      <head>
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style={bodyStyle}>
        <table role="presentation" cellSpacing="0" cellPadding="0" border={0} width="100%" style={wrapperTable}>
          <tr>
            <td align="center" style={centerCell}>
              <table role="presentation" cellSpacing="0" cellPadding="0" border={0} width="600" style={mainTable}>
                {/* Header with Logo */}
                <tr>
                  <td style={headerCell}>
                    <table role="presentation" cellSpacing="0" cellPadding="0" border={0} width="100%">
                      <tr>
                        <td align="center" style={logoCell}>
                          <img 
                            src="https://trainium.shop/images/logo-banner.png" 
                            alt="Trainium" 
                            width="180" 
                            height="auto"
                            style={logoStyle}
                          />
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* Hero Section */}
                <tr>
                  <td style={heroCell}>
                    <table role="presentation" cellSpacing="0" cellPadding="0" border={0} width="100%">
                      <tr>
                        <td align="center" style={heroContent}>
                          <h1 style={h1Style}>New Contact Form Submission</h1>
                          <p style={subtitleStyle}>You have received a new message from the contact form</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* Contact Information Card */}
                <tr>
                  <td style={sectionCell}>
                    <table role="presentation" cellSpacing="0" cellPadding="0" border={0} width="100%" style={cardTable}>
                      <tr>
                        <td style={cardCell}>
                          <table role="presentation" cellSpacing="0" cellPadding="0" border={0} width="100%">
                            <tr>
                              <td width="50%" style={infoCell}>
                                <p style={infoLabel}>Name</p>
                                <p style={infoValue}>{name}</p>
                              </td>
                              <td width="50%" style={infoCell}>
                                <p style={infoLabel}>Email</p>
                                <p style={infoValue}>
                                  <a href={`mailto:${email}`} style={linkStyle}>{email}</a>
                                </p>
                              </td>
                            </tr>
                            <tr>
                              <td colSpan={2} style={infoCell}>
                                <p style={infoLabel}>Reason</p>
                                <p style={infoValue}>{reason}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* Message Section */}
                <tr>
                  <td style={sectionCell}>
                    <h2 style={h2Style}>Message</h2>
                    <table role="presentation" cellSpacing="0" cellPadding="0" border={0} width="100%" style={cardTable}>
                      <tr>
                        <td style={messageCell}>
                          <p style={messageTextStyle}>{message}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* Action Buttons */}
                <tr>
                  <td style={sectionCell}>
                    <table role="presentation" cellSpacing="0" cellPadding="0" border={0} width="100%">
                      <tr>
                        <td align="center" style={buttonContainerCell}>
                          <table role="presentation" cellSpacing="0" cellPadding="0" border={0}>
                            <tr>
                              <td align="center" style={buttonCell}>
                                <a href={`mailto:${email}?subject=Re: ${encodeURIComponent(reason)}`} style={primaryButtonStyle}>
                                  Reply to {name}
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* Divider */}
                <tr>
                  <td style={dividerCell}>
                    <hr style={dividerStyle} />
                  </td>
                </tr>

                {/* Footer */}
                <tr>
                  <td style={footerCell}>
                    <p style={footerTextStyle}>
                      This email was sent from the Trainium contact form.
                    </p>
                    <p style={footerTextStyle}>
                      <a href="https://trainium.shop" style={linkStyle}>
                        Visit Trainium
                      </a>
                    </p>
                    <p style={footerCopyrightStyle}>
                      © {new Date().getFullYear()} Trainium. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
};

// Brand Colors
const primaryColor = '#0ea5e9'; // cyan-500
const textDark = '#0f172a'; // slate-900
const textMedium = '#475569'; // slate-600
const textLight = '#64748b'; // slate-500
const bgLight = '#f8fafc'; // slate-50
const borderColor = '#e2e8f0'; // slate-200

// Base Styles
const bodyStyle: React.CSSProperties = {
  margin: 0,
  padding: 0,
  backgroundColor: bgLight,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
  fontSize: '16px',
  lineHeight: '1.6',
  color: textDark,
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale',
};

const wrapperTable: React.CSSProperties = {
  width: '100%',
  backgroundColor: bgLight,
  padding: '20px 0',
};

const centerCell: React.CSSProperties = {
  padding: '0',
};

const mainTable: React.CSSProperties = {
  width: '600px',
  maxWidth: '100%',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
};

const headerCell: React.CSSProperties = {
  padding: '32px 24px 24px',
  backgroundColor: '#ffffff',
  textAlign: 'center',
};

const logoCell: React.CSSProperties = {
  padding: '0',
};

const logoStyle: React.CSSProperties = {
  display: 'block',
  maxWidth: '180px',
  height: 'auto',
};

const heroCell: React.CSSProperties = {
  padding: '0 24px 32px',
  backgroundColor: '#ffffff',
  textAlign: 'center',
};

const heroContent: React.CSSProperties = {
  padding: '0',
};

const h1Style: React.CSSProperties = {
  margin: '0 0 12px',
  fontSize: '28px',
  fontWeight: '700',
  color: textDark,
  lineHeight: '1.2',
};

const subtitleStyle: React.CSSProperties = {
  margin: '0 0 8px',
  fontSize: '18px',
  color: primaryColor,
  fontWeight: '600',
};

const sectionCell: React.CSSProperties = {
  padding: '0 24px 24px',
};

const h2Style: React.CSSProperties = {
  margin: '0 0 16px',
  fontSize: '20px',
  fontWeight: '600',
  color: textDark,
};

const cardTable: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#ffffff',
  border: `1px solid ${borderColor}`,
  borderRadius: '8px',
  overflow: 'hidden',
};

const cardCell: React.CSSProperties = {
  padding: '20px',
};

const infoCell: React.CSSProperties = {
  padding: '0 12px 16px 0',
  verticalAlign: 'top',
};

const infoLabel: React.CSSProperties = {
  margin: '0 0 4px',
  fontSize: '11px',
  fontWeight: '600',
  color: textLight,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const infoValue: React.CSSProperties = {
  margin: '0',
  fontSize: '15px',
  fontWeight: '500',
  color: textDark,
};

const messageCell: React.CSSProperties = {
  padding: '20px',
};

const messageTextStyle: React.CSSProperties = {
  margin: '0',
  fontSize: '15px',
  lineHeight: '1.8',
  color: textDark,
  whiteSpace: 'pre-wrap',
};

const buttonContainerCell: React.CSSProperties = {
  padding: '8px 0',
};

const buttonCell: React.CSSProperties = {
  padding: '0',
};

const primaryButtonStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '14px 32px',
  backgroundColor: primaryColor,
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  borderRadius: '8px',
  textAlign: 'center',
  lineHeight: '1',
};

const dividerCell: React.CSSProperties = {
  padding: '0 24px',
};

const dividerStyle: React.CSSProperties = {
  border: 'none',
  borderTop: `1px solid ${borderColor}`,
  margin: '0',
};

const footerCell: React.CSSProperties = {
  padding: '24px',
  textAlign: 'center',
  backgroundColor: bgLight,
};

const footerTextStyle: React.CSSProperties = {
  margin: '0 0 12px',
  fontSize: '14px',
  color: textMedium,
  lineHeight: '1.6',
};

const footerCopyrightStyle: React.CSSProperties = {
  margin: '16px 0 0',
  fontSize: '12px',
  color: textLight,
};

const linkStyle: React.CSSProperties = {
  color: primaryColor,
  textDecoration: 'underline',
};

export default ContactFormEmail;

