require('dotenv').config();

const http = require('http');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { connectDB } = require('./config/db');
const authRoutes = require('./routes/auth');
const stripeRoutes = require('./routes/stripe');
const orgRoutes = require('./routes/org');
const deviceRoutes = require('./routes/devices');
const speechRoutes = require('./routes/speech');
const reasoningRoutes = require('./routes/reasoning');
const plansRoutes = require('./routes/plans');
const { resolvePlanConfig } = require('./middleware/planResolver');
const { lockdownGuard } = require('./middleware/lockdownGuard');
const { initWebSocket } = require('./services/wsServer');
const { handleWebhookEvent } = require('./services/stripeService');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    const result = await handleWebhookEvent(req.body, signature);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/*', resolvePlanConfig);
app.use('/api/*', lockdownGuard);

app.use('/api/auth', authRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/speech', speechRoutes);
app.use('/api/reasoning', reasoningRoutes);
app.use('/api/plans', plansRoutes);

initWebSocket(server);

async function start() {
  server.listen(PORT, () => {
    console.log(`DESKA backend running on port ${PORT}`);
    console.log('WebSocket server ready on /ws');
  });

  try {
    await connectDB();
  } catch (err) {
    console.error('MongoDB unavailable, server starting without DB:', err.message);
  }
}

start();
