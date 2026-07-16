FROM node:20-slim

WORKDIR /app

# ---- Dependencies ----
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

# ---- Source ----
COPY . .

# ---- Security ----
USER node

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health',r=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

CMD ["node", "src/index.js"]
