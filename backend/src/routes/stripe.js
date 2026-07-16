const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { createCheckoutSession } = require('../services/stripeService');

const router = Router();

router.post('/checkout', requireAuth, async (req, res) => {
  try {
    const { plan, successUrl, cancelUrl } = req.body;
    if (!plan || !successUrl || !cancelUrl) {
      return res.status(400).json({ error: 'plan, successUrl, and cancelUrl are required' });
    }

    const orgId = req.user.organization;
    if (!orgId) {
      return res.status(400).json({ error: 'No organization associated with this account' });
    }

    const result = await createCheckoutSession(orgId, plan, successUrl, cancelUrl);
    res.json(result);
  } catch (err) {
    const status = ['Invalid plan', 'Organization not found'].includes(err.message) ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
});

module.exports = router;
