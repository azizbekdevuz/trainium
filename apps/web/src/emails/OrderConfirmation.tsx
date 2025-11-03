import {
  Body,
  // Button,
  Container,
  Head as HeadEmail,
  Heading,
  Html as HtmlEmail,
  // Img,
  Link,
  Preview,
  Section,
  Text,
  Hr,
  Row,
  Column,
} from '@react-email/components';
import * as React from 'react';
import { formatCurrency as formatCurrencyAmount } from '../lib/format';

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

// Using the main formatCurrency function from lib/format.ts

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
  const previewText = `Order Confirmation - ${orderId}`;

  return (
    <HtmlEmail>
      <HeadEmail />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>Order Confirmation</Heading>
            <Text style={subtitle}>Thank you for your purchase!</Text>
          </Section>

          <Section style={orderInfo}>
            <Row>
              <Column>
                <Text style={label}>Order Number</Text>
                <Text style={value}>{orderId}</Text>
              </Column>
              <Column>
                <Text style={label}>Order Date</Text>
                <Text style={value}>{orderDate}</Text>
              </Column>
            </Row>
            <Row>
              <Column>
                <Text style={label}>Customer</Text>
                <Text style={value}>{customerName}</Text>
              </Column>
              <Column>
                <Text style={label}>Email</Text>
                <Text style={value}>{customerEmail}</Text>
              </Column>
            </Row>
          </Section>

          <Section style={itemsSection}>
            <Heading style={h2}>Order Items</Heading>
            {items.map((item, index) => (
              <Row key={index} style={itemRow}>
                <Column style={itemDetails}>
                  <Text style={itemName}>{item.name}</Text>
                  {item.sku && <Text style={itemSku}>SKU: {item.sku}</Text>}
                  <Text style={itemQty}>Quantity: {item.qty}</Text>
                </Column>
                <Column style={itemPrice}>
                  <Text style={priceText}>
                    {formatCurrencyAmount(item.priceCents * item.qty, currency)}
                  </Text>
                </Column>
              </Row>
            ))}
          </Section>

          <Section style={totalsSection}>
            <Row>
              <Column>
                <Text style={totalLabel}>Subtotal</Text>
              </Column>
              <Column>
                <Text style={totalValue}>
                  {formatCurrencyAmount(subtotalCents, currency)}
                </Text>
              </Column>
            </Row>
            <Row>
              <Column>
                <Text style={totalLabel}>Total</Text>
              </Column>
              <Column>
                <Text style={grandTotalValue}>
                  {formatCurrencyAmount(totalCents, currency)}
                </Text>
              </Column>
            </Row>
          </Section>

          {shippingAddress && (
            <Section style={shippingSection}>
              <Heading style={h2}>Shipping Address</Heading>
              <Text style={addressText}>
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
              </Text>
              
              {trackingNumber && (
                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f9ff', border: '1px solid #0ea5e9', borderRadius: '8px' }}>
                  <Text style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 'bold', color: '#0c4a6e' }}>
                    📦 Tracking Information
                  </Text>
                  <Text style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 'bold', color: '#0369a1', fontFamily: 'monospace' }}>
                    {trackingNumber}
                  </Text>
                  {carrier && (
                    <Text style={{ margin: '0 0 8px', fontSize: '12px', color: '#0369a1' }}>
                      Carrier: {carrier}
                    </Text>
                  )}
                  <Text style={{ margin: '0', fontSize: '12px', color: '#0369a1' }}>
                    Track your package at: <Link href={`https://trainium.shop/track/${trackingNumber}?email=${customerEmail}`} style={link}>trainium.shop/track/{trackingNumber}?email={customerEmail}</Link>
                  </Text>
                </div>
              )}
            </Section>
          )}

          <Section style={paymentSection}>
            <Heading style={h2}>Payment Information</Heading>
            <Text style={paymentText}>
              Payment Method: {paymentMethod}<br />
              Status: Paid
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              Questions about your order? Contact us at{' '}
              <Link href="mailto:support@trainium.shop" style={link}>
                support@trainium.shop
              </Link>
            </Text>
            <Text style={footerText}>
              Track your order at{' '}
              <Link href={`https://trainium.shop/account/orders/${orderId}`} style={link}>
                trainium.shop/account/orders/{orderId}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </HtmlEmail>
  );
};

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const header = {
  padding: '32px 24px 0',
  textAlign: 'center' as const,
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
};

const h2 = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '24px 0 12px',
  padding: '0',
};

const subtitle = {
  color: '#666',
  fontSize: '16px',
  margin: '0 0 40px',
};

const orderInfo = {
  padding: '0 24px',
  marginBottom: '24px',
};

const label = {
  color: '#666',
  fontSize: '12px',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  margin: '0 0 4px',
};

const value = {
  color: '#333',
  fontSize: '14px',
  margin: '0 0 16px',
};

const itemsSection = {
  padding: '0 24px',
  marginBottom: '24px',
};

const itemRow = {
  borderBottom: '1px solid #eee',
  padding: '12px 0',
};

const itemDetails = {
  width: '70%',
};

const itemName = {
  color: '#333',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 4px',
};

const itemSku = {
  color: '#666',
  fontSize: '12px',
  margin: '0 0 4px',
};

const itemQty = {
  color: '#666',
  fontSize: '12px',
  margin: '0',
};

const itemPrice = {
  width: '30%',
  textAlign: 'right' as const,
};

const priceText = {
  color: '#333',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0',
};

const totalsSection = {
  padding: '0 24px',
  marginBottom: '24px',
};

const totalLabel = {
  color: '#666',
  fontSize: '14px',
  margin: '0',
};

const totalValue = {
  color: '#333',
  fontSize: '14px',
  textAlign: 'right' as const,
  margin: '0',
};

const grandTotalValue = {
  color: '#333',
  fontSize: '16px',
  fontWeight: 'bold',
  textAlign: 'right' as const,
  margin: '0',
};

const shippingSection = {
  padding: '0 24px',
  marginBottom: '24px',
};

const addressText = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
};

const paymentSection = {
  padding: '0 24px',
  marginBottom: '24px',
};

const paymentText = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
};

const hr = {
  borderColor: '#eee',
  margin: '32px 0',
};

const footer = {
  padding: '0 24px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#666',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '0 0 8px',
};

const link = {
  color: '#2754C5',
  textDecoration: 'underline',
};

export default OrderConfirmationEmail;
