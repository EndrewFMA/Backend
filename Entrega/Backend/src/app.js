import express from 'express';
import cors from 'cors';
import routes from './routes.js';


const app = express();

app.use(cors({ origin: process.env.APP_BASE_URL || 'http://localhost:5173' }));
app.use(express.json());

// (temporário) log de requisições para conferir caminhos
app.use((req, _res, next) => { console.log('[REQ]', req.method, req.url); next(); });

// Health
app.get('/health', (_, res) => res.json({ ok: true, server: 'up' }));

// Prefixo único
app.use('/api', routes);


export default app;