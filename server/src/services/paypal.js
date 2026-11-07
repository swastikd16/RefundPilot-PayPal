import dotenv from 'dotenv';
dotenv.config();

let cachedToken = null;
let tokenExpiresAt = 0;

const getBaseUrl = () => {
  return process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';
};

/**
 * Checks if real credentials are configured.
 */
export function hasCredentials() {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  return Boolean(id && secret && !id.includes('your_') && !secret.includes('your_'));
}

/**
 * Exchange Client ID + Secret for an OAuth2 Bearer token with local caching.
 */
export async function getAccessToken() {
  if (!hasCredentials()) {
    throw new Error('PayPal credentials missing or unconfigured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in server/.env');
  }

  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const authHeader = 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch(`${getBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: 'grant_type=client_credentials'
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`PayPal OAuth token failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  // Cache with 60 seconds buffer
  tokenExpiresAt = now + ((data.expires_in || 3600) - 60) * 1000;
  return cachedToken;
}

/**
 * Lookup capture payment details by capture ID.
 * Ref: https://developer.paypal.com/docs/api/payments/v2/#captures_get
 */
export async function getCapture(captureId) {
  const token = await getAccessToken();
  const res = await fetch(`${getBaseUrl()}/v2/payments/captures/${captureId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(`PayPal capture lookup failed (${res.status}): ${JSON.stringify(errorBody)}`);
  }

  return await res.json();
}

/**
 * Refund a captured payment.
 * Ref: https://developer.paypal.com/docs/api/payments/v2/#captures_refund
 */
export async function refundCapture(captureId, { amount, currency, note, idempotencyKey } = {}) {
  const token = await getAccessToken();
  const body = {};

  if (amount && currency) {
    body.amount = {
      value: String(amount),
      currency_code: currency
    };
  }
  if (note) {
    body.note_to_payer = note;
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  if (idempotencyKey) {
    headers['PayPal-Request-Id'] = idempotencyKey;
  }

  const res = await fetch(`${getBaseUrl()}/v2/payments/captures/${captureId}/refund`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(`PayPal refund failed (${res.status}): ${JSON.stringify(errorBody)}`);
  }

  return await res.json();
}

/**
 * Lookup order details by order ID.
 * Ref: https://developer.paypal.com/docs/api/orders/v2/#orders_get
 */
export async function getOrder(orderId) {
  const token = await getAccessToken();
  const res = await fetch(`${getBaseUrl()}/v2/checkout/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(`PayPal order lookup failed (${res.status}): ${JSON.stringify(errorBody)}`);
  }

  return await res.json();
}

