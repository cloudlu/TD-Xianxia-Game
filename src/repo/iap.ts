// 充值仓储（设计文档 §11.2 IAPRepo）：抽象接口 + 本地 mock 实现。
// 单机：直接发放仙玉；联网后换 RemoteIAPRepo → 后端下单 → 支付 SDK → 回调校验 → 发货，调用方不动。

export interface Product {
  id: string;
  label: string;
  priceCny: number;   // 人民币售价（mock 展示用）
  jade: number;       // 发放的仙玉
}

export interface Receipt { productId: string; jade: number; }

export interface IAPRepo {
  getProducts(): ReadonlyArray<Product>;
  /** 发起购买， resolves 为发货回执（mock 立即成功；真实支付异步） */
  purchase(productId: string): Promise<Receipt>;
}

// 仙玉礼包（经典档位 + 大额档位）
export const JADE_PRODUCTS: readonly Product[] = [
  { id: 'jade_60', label: '60 仙玉', priceCny: 6, jade: 60 },
  { id: 'jade_328', label: '328 仙玉', priceCny: 30, jade: 328 },
  { id: 'jade_1098', label: '1098 仙玉', priceCny: 98, jade: 1098 },
  { id: 'jade_2280', label: '2280 仙玉', priceCny: 198, jade: 2280 },
  { id: 'jade_3980', label: '3980 仙玉', priceCny: 328, jade: 3980 },
  { id: 'jade_8080', label: '8080 仙玉', priceCny: 648, jade: 8080 },
];

export class LocalIAPRepo implements IAPRepo {
  getProducts(): ReadonlyArray<Product> { return JADE_PRODUCTS; }
  purchase(productId: string): Promise<Receipt> {
    const p = JADE_PRODUCTS.find((x) => x.id === productId);
    // mock：直接成功发放。真实环境这里调用支付 SDK 并由服务端回调校验。
    return Promise.resolve(p ? { productId: p.id, jade: p.jade } : { productId, jade: 0 });
  }
}
