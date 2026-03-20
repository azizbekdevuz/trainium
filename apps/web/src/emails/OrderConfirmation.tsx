/* eslint-disable @next/next/no-head-element */
/* eslint-disable @next/next/no-img-element */
import * as React from 'react';
import { formatCurrency as formatCurrencyAmount } from '../lib/utils/format';

interface OrderConfirmationEmailProps {
  orderId: string;
  customerName: string;
  customerEmail: string;
  orderDate: string;
  items: Array<{
    name: string;
    sku?: string;
    qty: number;
    priceCents: number;
  }>;
  subtotalCents: number;
  totalCents: number;
  currency: string;
  shippingAddress?: {
    fullName: string;
    phone: string;
    address1: string;
    address2?: string | null;
    city: string;
    state?: string | null;
    postalCode: string;
    country: string;
  };
  paymentMethod: string;
  trackingNumber?: string;
  carrier?: string;
}

export const OrderConfirmationEmail = ({
  orderId,
  customerName,
  customerEmail,
  orderDate,
  items,
  subtotalCents,
  totalCents,
  currency,
  shippingAddress,
  paymentMethod,
  trackingNumber,
  carrier,
}: OrderConfirmationEmailProps) => {
  const trackOrderUrl = `https://trainium.shop/account/orders/${orderId}`;
  const trackPackageUrl = trackingNumber 
    ? `https://trainium.shop/track/${trackingNumber}?email=${encodeURIComponent(customerEmail)}`
    : trackOrderUrl;

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
                          <h1 style={h1Style}>Order Confirmed!</h1>
                          <p style={subtitleStyle}>Thank you for your purchase, {customerName}!</p>
                          <p style={messageStyle}>We&apos;ve received your order and will begin processing it shortly.</p>
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
                                <p style={infoLabel}>Order Date</p>
                                <p style={infoValue}>{orderDate}</p>
                              </td>
                            </tr>
                            <tr>
                              <td width="50%" style={infoCell}>
                                <p style={infoLabel}>Customer</p>
                                <p style={infoValue}>{customerName}</p>
                              </td>
                              <td width="50%" style={infoCell}>
                                <p style={infoLabel}>Email</p>
                                <p style={infoValue}>{customerEmail}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* Order Items */}
                <tr>
                  <td style={sectionCell}>
                    <h2 style={h2Style}>Order Items</h2>
                    <table role="presentation" cellSpacing="0" cellPadding="0" border={0} width="100%" style={itemsTable}>
                      <thead>
                        <tr>
                          <th align="left" style={tableHeader}>Item</th>
                          <th align="right" style={tableHeader}>Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => (
                          <tr key={index}>
                            <td style={itemCell}>
                              <p style={itemNameStyle}>{item.name}</p>
                              {item.sku && <p style={itemSkuStyle}>SKU: {item.sku}</p>}
                              <p style={itemQtyStyle}>Quantity: {item.qty}</p>
                            </td>
                            <td align="right" style={itemPriceCell}>
                              <p style={itemPriceStyle}>
                                {formatCurrencyAmount(item.priceCents * item.qty, currency)}
                              </p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>

                {/* Totals */}
                <tr>
                  <td style={sectionCell}>
                    <table role="presentation" cellSpacing="0" cellPadding="0" border={0} width="100%" style={totalsTable}>
                      <tr>
                        <td width="70%" align="right" style={totalLabelCell}>
                          <p style={totalLabelStyle}>Subtotal</p>
                        </td>
                        <td width="30%" align="right" style={totalValueCell}>
                          <p style={totalValueStyle}>{formatCurrencyAmount(subtotalCents, currency)}</p>
                        </td>
                      </tr>
                      <tr>
                        <td width="70%" align="right" style={totalLabelCell}>
                          <p style={grandTotalLabelStyle}>Total</p>
                        </td>
                        <td width="30%" align="right" style={totalValueCell}>
                          <p style={grandTotalValueStyle}>{formatCurrencyAmount(totalCents, currency)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* Shipping Address */}
                {shippingAddress && (
                  <tr>
                    <td style={sectionCell}>
                      <h2 style={h2Style}>Shipping Address</h2>
                      <table role="presentation" cellSpacing="0" cellPadding="0" border={0} width="100%" style={cardTable}>
                        <tr>
                          <td style={addressCell}>
                            <p style={addressTextStyle}>
                              {shippingAddress.fullName}<br />
                              {shippingAddress.phone}<br />
                              {shippingAddress.address1}<br />
                              {shippingAddress.address2 && (
                                <>
                                  {shippingAddress.address2}<br />
                                </>
                              )}
                              {shippingAddress.city}{shippingAddress.state ? `, ${shippingAddress.state}` : ''} {shippingAddress.postalCode}<br />
                              {shippingAddress.country}
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                )}

                {/* Tracking Information */}
                {trackingNumber && (
                  <tr>
                    <td style={sectionCell}>
                      <table role="presentation" cellSpacing="0" cellPadding="0" border={0} width="100%" style={trackingTable}>
                        <tr>
                          <td style={trackingCell}>
                            <table role="presentation" cellSpacing="0" cellPadding="0" border={0} width="100%">
                              <tr>
                                <td>
                                  <p style={trackingTitleStyle}>📦 Tracking Information</p>
                                  <p style={trackingNumberStyle}>{trackingNumber}</p>
                                  {carrier && (
                                    <p style={trackingCarrierStyle}>Carrier: {carrier}</p>
                                  )}
                                  <table role="presentation" cellSpacing="0" cellPadding="0" border={0}>
                                    <tr>
                                      <td align="center" style={buttonCell}>
                                        <a href={trackPackageUrl} style={buttonStyle}>
                                          Track Package
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

                {/* Payment Information */}
                <tr>
                  <td style={sectionCell}>
                    <h2 style={h2Style}>Payment Information</h2>
                    <table role="presentation" cellSpacing="0" cellPadding="0" border={0} width="100%" style={cardTable}>
                      <tr>
                        <td style={paymentCell}>
                          <p style={paymentTextStyle}>
                            <strong>Payment Method:</strong> {paymentMethod}<br />
                            <strong>Status:</strong> <span style={paidBadge}>Paid</span>
                          </p>
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
                      Questions about your order? Contact us at{' '}
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

// Brand colors (aligned with web design tokens)
const primaryColor = '#0ea5e9';
const primaryDark = '#0284c7';
const textDark = '#0c1220';
const textMedium = '#3d4a5c';
const textLight = '#64748b';
const bgLight = '#f0f4f8';
const borderColor = 'rgba(203, 213, 225, 0.9)';

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
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  borderRadius: '18px',
  overflow: 'hidden',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
};

// Header Styles
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

// Hero Section
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
};

// Section Styles
const sectionCell: React.CSSProperties = {
  padding: '0 24px 24px',
};

const h2Style: React.CSSProperties = {
  margin: '0 0 16px',
  fontSize: '20px',
  fontWeight: '600',
  color: textDark,
};

// Card Styles
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

// Items Table
const itemsTable: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  backgroundColor: '#ffffff',
  border: `1px solid ${borderColor}`,
  borderRadius: '8px',
  overflow: 'hidden',
};

const tableHeader: React.CSSProperties = {
  padding: '12px 16px',
  backgroundColor: bgLight,
  fontSize: '12px',
  fontWeight: '600',
  color: textLight,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  borderBottom: `1px solid ${borderColor}`,
};

const itemCell: React.CSSProperties = {
  padding: '16px',
  borderBottom: `1px solid ${borderColor}`,
};

const itemNameStyle: React.CSSProperties = {
  margin: '0 0 4px',
  fontSize: '15px',
  fontWeight: '600',
  color: textDark,
};

const itemSkuStyle: React.CSSProperties = {
  margin: '0 0 4px',
  fontSize: '13px',
  color: textLight,
};

const itemQtyStyle: React.CSSProperties = {
  margin: '0',
  fontSize: '13px',
  color: textLight,
};

const itemPriceCell: React.CSSProperties = {
  padding: '16px',
  borderBottom: `1px solid ${borderColor}`,
  verticalAlign: 'top',
};

const itemPriceStyle: React.CSSProperties = {
  margin: '0',
  fontSize: '15px',
  fontWeight: '600',
  color: textDark,
};

// Totals
const totalsTable: React.CSSProperties = {
  width: '100%',
  marginTop: '8px',
};

const totalLabelCell: React.CSSProperties = {
  padding: '8px 0',
};

const totalLabelStyle: React.CSSProperties = {
  margin: '0',
  fontSize: '15px',
  color: textMedium,
};

const grandTotalLabelStyle: React.CSSProperties = {
  margin: '0',
  fontSize: '17px',
  fontWeight: '600',
  color: textDark,
  paddingTop: '8px',
};

const totalValueCell: React.CSSProperties = {
  padding: '8px 0',
};

const totalValueStyle: React.CSSProperties = {
  margin: '0',
  fontSize: '15px',
  color: textDark,
  fontWeight: '500',
};

const grandTotalValueStyle: React.CSSProperties = {
  margin: '0',
  fontSize: '20px',
  fontWeight: '700',
  color: primaryColor,
  paddingTop: '8px',
};

// Address
const addressCell: React.CSSProperties = {
  padding: '20px',
};

const addressTextStyle: React.CSSProperties = {
  margin: '0',
  fontSize: '15px',
  lineHeight: '1.6',
  color: textDark,
};

// Tracking
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
  margin: '0 0 8px',
  fontSize: '18px',
  fontWeight: '700',
  color: primaryDark,
  fontFamily: 'monospace',
  letterSpacing: '1px',
};

const trackingCarrierStyle: React.CSSProperties = {
  margin: '0 0 16px',
  fontSize: '14px',
  color: primaryDark,
};

// Payment
const paymentCell: React.CSSProperties = {
  padding: '20px',
};

const paymentTextStyle: React.CSSProperties = {
  margin: '0',
  fontSize: '15px',
  lineHeight: '1.6',
  color: textDark,
};

const paidBadge: React.CSSProperties = {
  display: 'inline-block',
  padding: '4px 12px',
  backgroundColor: '#d1fae5',
  color: '#065f46',
  fontSize: '13px',
  fontWeight: '600',
  borderRadius: '4px',
  marginLeft: '4px',
};

// Buttons
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
  color: '#020c16',
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
  color: '#020c16',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  borderRadius: '6px',
  textAlign: 'center',
  lineHeight: '1',
};

// Divider
const dividerCell: React.CSSProperties = {
  padding: '0 24px',
};

const dividerStyle: React.CSSProperties = {
  border: 'none',
  borderTop: `1px solid ${borderColor}`,
  margin: '0',
};

// Footer
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

export default OrderConfirmationEmail;
