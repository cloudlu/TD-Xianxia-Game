import { Router } from 'express';

const PRODUCTS: Record<string, { id: string; jade: number }> = {
  jade_60: { id: 'jade_60', jade: 60 },
  jade_328: { id: 'jade_328', jade: 328 },
  jade_1098: { id: 'jade_1098', jade: 1098 },
  jade_2280: { id: 'jade_2280', jade: 2280 },
  jade_3980: { id: 'jade_3980', jade: 3980 },
  jade_8080: { id: 'jade_8080', jade: 8080 },
};

const router = Router();

router.post('/', (req, res) => {
  const { productId } = req.body ?? {};
  const p = PRODUCTS[productId as string];
  if (p) {
    res.json({ productId: p.id, jade: p.jade });
  } else {
    res.json({ productId: productId ?? '', jade: 0 });
  }
});

export default router;
