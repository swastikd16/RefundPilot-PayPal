/**
 * Zapier Workflow Automation Integration
 * Dispatches event payloads to Zapier webhooks to trigger Slack alerts, Zendesk tickets, or Google Sheet rows.
 */

export async function dispatchZapierEvent(eventKey, payload) {
  const webhookUrl = process.env.ZAPIER_WEBHOOK_URL;

  const eventPayload = {
    event: eventKey,
    timestamp: new Date().toISOString(),
    service: 'RefundPilot AI',
    data: payload
  };

  if (webhookUrl && webhookUrl.startsWith('https://hooks.zapier.com')) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventPayload)
      });
      return { success: res.ok, status: res.status, mode: 'LIVE_ZAPIER_WEBHOOK' };
    } catch (err) {
      console.warn('Zapier webhook dispatch failed:', err.message);
    }
  }

  // Graceful local webhook record
  return {
    success: true,
    mode: 'LOCAL_WEBHOOK_SIMULATOR',
    dispatchedPayload: eventPayload
  };
}
