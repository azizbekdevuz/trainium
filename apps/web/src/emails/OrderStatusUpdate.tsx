/* eslint-disable @next/next/no-head-element */
/* eslint-disable @next/next/no-img-element */
import * as React from 'react';

interface OrderStatusUpdateEmailProps {
  orderId: string;
  customerName: string;
  customerEmail: string;
  status: string;
  trackingNumber?: string;
  locale?: string;
}

export const OrderStatusUpdateEmail = ({
  orderId,
  customerName,
  customerEmail,
  status,
  trackingNumber,
}: OrderStatusUpdateEmailProps) => {
  const trackOrderUrl = `https://trainium.shop/account/orders/${orderId}`;
  const trackPackageUrl = trackingNumber 
    ? `https://trainium.shop/track/${trackingNumber}?email=${encodeURIComponent(customerEmail)}`
    : trackOrderUrl;

  // Status-specific content
  const getStatusContent = () => {
    switch (status) {
      case 'SHIPPED':
        return {
          title: 'Your Order Has Shipped! 🚀',
          message: `Great news! Your order ${orderId.slice(0, 8).toUpperCase()} has been shipped and is on its way to you.`,
          icon: '📦',
          color: primaryColor,
        };
      case 'DELIVERED':
        return {
          title: 'Order Delivered! ✅',
          message: `Your order ${orderId.slice(0, 8).toUpperCase()} has been successfully delivered. We hope you love your purchase!`,
          icon: '🎉',
          color: '#10b981', // green-500
        };
      case 'CANCELLED':
        return {
          title: 'Order Cancelled',
          message: `Your order ${orderId.slice(0, 8).toUpperCase()} has been cancelled. If you have any questions, please contact our support team.`,
          icon: '⚠️',
          color: '#ef4444', // red-500
        };
      default:
        return {
          title: 'Order Status Updated',
          message: `Your order ${orderId.slice(0, 8).toUpperCase()} status has been updated to ${status}.`,
          icon: '📋',
          color: primaryColor,
        };
    }
  };

  const statusContent = getStatusContent();

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

                {/* Status Hero Section */}
                <tr>
                  <td style={heroCell}>
                    <table role="presentation" cellSpacing="0" cellPadding="0" border={0} width="100%">
                      <tr>
                        <td align="center" style={heroContent}>
                          <div style={{ fontSize: '48px', marginBottom: '16px' }}>{statusContent.icon}</div>
                          <h1 style={{ ...h1Style, color: statusContent.color }}>{statusContent.title}</h1>
                          <p style={subtitleStyle}>Hello {customerName},</p>
                          <p style={messageStyle}>{statusContent.message}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* Order Info Card */}
                <tr>
                  <td style={sectionCell}>
                    <table role="presentation" cellSpacing="0" cellPadding="0" border={0} width="100%" style={cardTable}>
                      <tr>
                        <td style={cardCell}>
                          <table role="presentation" cellSpacing="0" cellPadding="0" border={0} width="100%">
                            <tr>
                              <td width="50%" style={infoCell}>
                                <p style={infoLabel}>Order Number</p>
                                <p style={infoValue}>{orderId}</p>
                              </td>
                              <td width="50%" style={infoCell}>
                                <p style={infoLabel}>Status</p>
                                <p style={{ ...infoValue, color: statusContent.color, fontWeight: '600' }}>
                                  {status}
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* Tracking Information */}
                {trackingNumber && status === 'SHIPPED' && (
                  <tr>
                    <td style={sectionCell}>
                      <table role="presentation" cellSpacing="0" cellPadding="0" border={0} width="100%" style={trackingTable}>
                        <tr>
                          <td style={trackingCell}>
                            <table role="presentation" cellSpacing="0" cellPadding="0" border={0} width="100%">
                              <tr>
                                <td>
                                  <p style={trackingTitleStyle}>📦 Tracking Number</p>
                                  <p style={trackingNumberStyle}>{trackingNumber}</p>
                                  <table role="presentation" cellSpacing="0" cellPadding="0" border={0}>
                                    <tr>
                                      <td align="center" style={buttonCell}>
                                        <a href={trackPackageUrl} style={buttonStyle}>
                                          Track Your Package
                                        </a>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                )}

                {/* Action Buttons */}
                <tr>
                  <td style={sectionCell}>
                    <table role="presentation" cellSpacing="0" cellPadding="0" border={0} width="100%">
                      <tr>
                        <td align="center" style={buttonContainerCell}>
                          <table role="presentation" cellSpacing="0" cellPadding="0" border={0}>
                            <tr>
                              <td align="center" style={buttonCell}>
                                <a href={trackOrderUrl} style={primaryButtonStyle}>
                                  View Order Details
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* Additional Message */}
                {status === 'DELIVERED' && (
                  <tr>
                    <td style={sectionCell}>
                      <table role="presentation" cellSpacing="0" cellPadding="0" border={0} width="100%" style={cardTable}>
                        <tr>
                          <td style={cardCell}>
                            <p style={messageStyle}>
                              Thank you for choosing Trainium! We hope you&apos;re satisfied with your purchase. 
                              If you have any questions or need assistance, our support team is here to help.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                )}

                {status === 'CANCELLED' && (
                  <tr>
                    <td style={sectionCell}>
                      <table role="presentation" cellSpacing="0" cellPadding="0" border={0} width="100%" style={cardTable}>
                        <tr>
                          <td style={cardCell}>
                            <p style={messageStyle}>
                              If you have any questions about this cancellation or would like to place a new order, 
                              please don&apos;t hesitate to contact our support team.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                )}

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
                      Questions? Contact us at{' '}
                      <a href="mailto:support@trainium.shop" style={linkStyle}>
                        support@trainium.shop
                      </a>
                    </p>
                    <p style={footerTextStyle}>
                      <a href={trackOrderUrl} style={linkStyle}>
                        View your order online
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

// Base Styles (reusing from OrderConfirmation)
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

const messageStyle: React.CSSProperties = {
  margin: '0',
  fontSize: '16px',
  color: textMedium,
  lineHeight: '1.6',
};

const sectionCell: React.CSSProperties = {
  padding: '0 24px 24px',
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

const trackingTable: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#f0f9ff',
  border: `2px solid ${primaryColor}`,
  borderRadius: '8px',
  overflow: 'hidden',
};

const trackingCell: React.CSSProperties = {
  padding: '20px',
};

const trackingTitleStyle: React.CSSProperties = {
  margin: '0 0 12px',
  fontSize: '16px',
  fontWeight: '600',
  color: '#0c4a6e',
};

const trackingNumberStyle: React.CSSProperties = {
  margin: '0 0 16px',
  fontSize: '18px',
  fontWeight: '700',
  color: primaryColor,
  fontFamily: 'monospace',
  letterSpacing: '1px',
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

const buttonStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '12px 24px',
  backgroundColor: primaryColor,
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  borderRadius: '6px',
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

export default OrderStatusUpdateEmail;

