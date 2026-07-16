const Stripe = require('stripe');
const Organization = require('../models/Organization');

const PLAN_PRICES = {
  personal_pro: { id: 'price_personal_pro', monthly: 799 },
  team: { id: 'price_team_per_seat', monthly: 1499 },
  enterprise: { id: 'price_enterprise', monthly: null },
};

function getClient() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

async function createCheckoutSession(orgId, targetPlan, successUrl, cancelUrl) {
  const stripe = getClient();
  if (!stripe) throw new Error('Stripe not configured');

  const org = await Organization.findById(orgId);
  if (!org) throw new Error('Organization not found');
  if (!PLAN_PRICES[targetPlan]) throw new Error('Invalid plan');

  let customerId = org.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: { orgId: org._id.toString(), orgSlug: org.slug },
    });
    customerId = customer.id;
    org.stripeCustomerId = customerId;
    await org.save();
  }

  const priceConfig = PLAN_PRICES[targetPlan];

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceConfig.id, quantity: 1 }],
    metadata: { orgId: org._id.toString(), plan: targetPlan },
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
  });

  return { url: session.url };
}

async function handleWebhookEvent(rawBody, signature) {
  const stripe = getClient();
  if (!stripe) throw new Error('Stripe not configured');

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    throw new Error('Invalid webhook signature');
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const { orgId, plan } = session.metadata || {};
      if (orgId && plan) {
        await Organization.findByIdAndUpdate(orgId, {
          plan,
          stripeSubscriptionId: session.subscription,
          tokenQuotaStatus: 'healthy',
        });
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const org = await Organization.findOne({ stripeSubscriptionId: sub.id });
      if (org) {
        org.plan = 'personal_free';
        org.stripeSubscriptionId = null;
        await org.save();
      }
      break;
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object;
      if (sub.status === 'active') {
        const org = await Organization.findOne({ stripeSubscriptionId: sub.id });
        if (org) {
          org.tokenQuotaStatus = 'healthy';
          await org.save();
        }
      }
      break;
    }
  }

  return { received: true };
}

module.exports = { createCheckoutSession, handleWebhookEvent, getClient };
