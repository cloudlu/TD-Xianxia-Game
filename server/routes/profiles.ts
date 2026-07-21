import { Router } from 'express';
import { listProfiles, createProfile, deleteProfile } from '../storage/fileStore.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(listProfiles());
});

router.post('/', (req, res) => {
  const { name } = req.body ?? {};
  const profile = createProfile(typeof name === 'string' ? name : '');
  res.status(201).json(profile);
});

router.delete('/:id', (req, res) => {
  deleteProfile(req.params.id);
  res.status(204).end();
});

export default router;
