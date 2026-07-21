import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import profilesRouter from './routes/profiles.js';
import progressRouter from './routes/progress.js';
import purchaseRouter from './routes/purchase.js';

const PORT = Number(process.env.PORT ?? 3001);
const DIR = dirname(fileURLToPath(import.meta.url));
const DIST = join(DIR, '..', 'dist');

const app = express();

app.use(express.json());

// API
app.use('/api/profiles', profilesRouter);
app.use('/api/profiles', progressRouter);
app.use('/api/purchase', purchaseRouter);

// 生产模式托管前端静态资源
app.use(express.static(DIST));
app.get('*', (_req, res) => { res.sendFile(join(DIST, 'index.html')); });

app.listen(PORT, () => {
  console.log(`[server] 运行在 http://localhost:${PORT}`);
  console.log(`[server] 数据目录: ${join(DIR, 'data')}`);
});
