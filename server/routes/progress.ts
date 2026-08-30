import { Router } from 'express';
import { loadProgress, saveProgress } from '../storage/fileStore.js';

const router = Router();

router.get('/:id/progress', (req, res) => {
  res.set('Cache-Control', 'no-store');
  const raw = loadProgress(req.params.id);
  if (raw === null) return res.json(null);
  try { res.json(JSON.parse(raw)); }
  catch { res.json(null); }
});

router.put('/:id/progress', (req, res) => {
  try {
    saveProgress(req.params.id, JSON.stringify(req.body));
    res.status(204).end();
  } catch (e) {
    const err = e as Error & { code?: string };
    if (err.code === 'REFUSE_WIPE') {
      console.warn(`[progress] 拒绝空档覆盖富档: ${req.params.id}`);
      res.status(409).json({ error: 'REFUSE_WIPE', message: '检测到对方存疑的覆盖，已保留本地存档' });
    } else {
      console.error('[progress] 保存失败:', err);
      res.status(500).json({ error: 'save_failed' });
    }
  }
});

export default router;
