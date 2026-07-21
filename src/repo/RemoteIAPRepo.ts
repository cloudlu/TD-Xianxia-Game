import type { IAPRepo, Product, Receipt } from './iap';
import { JADE_PRODUCTS } from './iap';
import { apiGet, apiPost } from './api';

export class RemoteIAPRepo implements IAPRepo {
  getProducts(): ReadonlyArray<Product> { return JADE_PRODUCTS; }
  async purchase(productId: string): Promise<Receipt> {
    return apiPost<Receipt>('/api/purchase', { productId });
  }
}
