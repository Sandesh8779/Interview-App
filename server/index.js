import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import interviewsRouter from './routes/interviews.js';
import profilesRouter from './routes/profiles.js';
import requestsRouter from './routes/requests.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'InterviewFlow API' });
});

app.use('/api/profiles', profilesRouter);
app.use('/api/interviews', interviewsRouter);
app.use('/api/requests', requestsRouter);

const clientDist = path.join(__dirname, '..', 'dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({
    message: error.message || 'Something went wrong.'
  });
});

app.listen(port, () => {
  console.log(`InterviewFlow API running on http://127.0.0.1:${port}`);
});
