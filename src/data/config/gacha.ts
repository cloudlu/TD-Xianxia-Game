// 寻仙抽卡：奖池定义 + 抽奖 + 碎片合成
// 全部纯函数，不依赖 UI；走 Progression 持久化。

/** 奖品类型 */
export type GachaPrize = 'frags' | 'refund' | 'destiny' | 'soul3' | 'soul8' | 'destiny3';

export interface DrawResult {
  prize: GachaPrize;
  /** 贡献返还（refund 用） */
  contributionGain: number;
  /** 装备碎片 */
  frags: number;
  /** 天命符 */
  destinyScrolls: number;
  /** 仙魂碎片 */
  soulShards: number;
  /** 是否触发保底 */
  pityTriggered: boolean;
}

const POOL: { prize: GachaPrize; prob: number; rare: boolean }[] = [
  { prize: 'frags', prob: 0.30, rare: false },
  { prize: 'refund', prob: 0.25, rare: false },
  { prize: 'destiny', prob: 0.15, rare: false },
  { prize: 'soul3', prob: 0.20, rare: false },
  { prize: 'soul8', prob: 0.05, rare: true },
  { prize: 'destiny3', prob: 0.05, rare: true },
];

const RARE_POOL = POOL.filter((p) => p.rare);

/** 单抽（返回奖品 + 更新后的抽卡计数） */
export function drawGacha(pity: number, rng: () => number): { result: DrawResult; newPity: number } {
  const isPity = pity >= 9;  // 十连保底
  let prize: GachaPrize;
  if (isPity) {
    prize = RARE_POOL[Math.floor(rng() * RARE_POOL.length)].prize;
  } else {
    const roll = rng();
    let acc = 0;
    prize = POOL[0].prize;
    for (const p of POOL) { acc += p.prob; if (roll < acc) { prize = p.prize; break; } }
  }
  return { result: toResult(prize, isPity), newPity: isPity ? 0 : pity + 1 };
}

function toResult(prize: GachaPrize, pity: boolean): DrawResult {
  const base = { contributionGain: 0, frags: 0, destinyScrolls: 0, soulShards: 0, pityTriggered: pity };
  switch (prize) {
    case 'frags':       return { ...base, prize, frags: 3 };
    case 'refund':       return { ...base, prize, contributionGain: 80 };
    case 'destiny':      return { ...base, prize, destinyScrolls: 1 };
    case 'soul3':        return { ...base, prize, soulShards: 3 };
    case 'soul8':        return { ...base, prize, soulShards: 8 };
    case 'destiny3':     return { ...base, prize, destinyScrolls: 3 };
  }
}

/** 装备碎片合成：消耗碎片合成随机限定法宝（从普通法宝池中选一件，属性 ×1.3） */
export const FRAG_COST = 30;
