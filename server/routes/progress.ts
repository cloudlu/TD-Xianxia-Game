import { Router } from 'express';
import { loadProgress, saveProgress } from '../storage/fileStore.js';

const router = Router();

router.get('/:id/progress', (req, res) => {
  const raw = loadProgress(req.params.id);
  if (raw === null) return res.json(null);
  try { res.json(JSON.parse(raw)); }
  catch { res.json(null); }
});

router.put('/:id/progress', (req, res) => {
  saveProgress(req.params.id, JSON.stringify(req.body));
  res.status(204).end();
});

export default router;
