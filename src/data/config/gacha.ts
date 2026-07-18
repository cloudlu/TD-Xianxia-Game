import { EQUIPMENT_IDS } from './equipment';
import { LIMITED_TREASURE_IDS } from './limited_treasures';

export type GachaPrize =
  | 'mythic_equip'
  | 'random_equip'
  | 'destiny3'
  | 'soul20'
  | 'soul8'
  | 'frags8'
  | 'destiny'
  | 'soul3'
  | 'frags3'
  | 'refund40'
  | 'frags2'
  | 'soul2'
  | 'refund20'
  | 'frags'
  | 'soul'
  | 'refund10'
  | 'empty';

export interface DrawResult {
  prize: GachaPrize;
  contributionGain: number;
  frags: number;
  destinyScrolls: number;
  soulShards: number;
  pityTriggered: boolean;
  grantedTreasureId?: string;
  grantedEquipId?: string;
}

interface SubPrize {
  subProb: number;
  make: (rng: () => number) => DrawResult;
}

interface Tier {
  prob: number;
  label: string;
  subs: SubPrize[];
}

const TIERS: Tier[] = [
  {
    prob: 0.0001, label: '特等奖',
    subs: [{
      subProb: 1,
      make: (rng) => {
        const id = LIMITED_TREASURE_IDS[Math.floor(rng() * LIMITED_TREASURE_IDS.length)];
        return { prize: 'mythic_equip', contributionGain: 0, frags: 0, destinyScrolls: 0, soulShards: 0, pityTriggered: false, grantedTreasureId: id };
      },
    }],
  },
  {
    prob: 0.0009, label: '一等奖',
    subs: [{
      subProb: 1,
      make: (rng) => {
        const id = EQUIPMENT_IDS[Math.floor(rng() * EQUIPMENT_IDS.length)];
        return { prize: 'random_equip', contributionGain: 0, frags: 0, destinyScrolls: 0, soulShards: 0, pityTriggered: false, grantedEquipId: id };
      },
    }],
  },
  {
    prob: 0.009, label: '二等奖',
    subs: [
      { subProb: 0.5, make: () => ({ prize: 'destiny3' as const, contributionGain: 0, frags: 0, destinyScrolls: 3, soulShards: 0, pityTriggered: false }) },
      { subProb: 0.5, make: () => ({ prize: 'soul20' as const, contributionGain: 0, frags: 0, destinyScrolls: 0, soulShards: 20, pityTriggered: false }) },
    ],
  },
  {
    prob: 0.04, label: '三等奖',
    subs: [
      { subProb: 0.4, make: () => ({ prize: 'soul8' as const, contributionGain: 0, frags: 0, destinyScrolls: 0, soulShards: 8, pityTriggered: false }) },
      { subProb: 0.3, make: () => ({ prize: 'frags8' as const, contributionGain: 0, frags: 8, destinyScrolls: 0, soulShards: 0, pityTriggered: false }) },
      { subProb: 0.3, make: () => ({ prize: 'destiny' as const, contributionGain: 0, frags: 0, destinyScrolls: 1, soulShards: 0, pityTriggered: false }) },
    ],
  },
  {
    prob: 0.10, label: '四等奖',
    subs: [
      { subProb: 0.4, make: () => ({ prize: 'soul3' as const, contributionGain: 0, frags: 0, destinyScrolls: 0, soulShards: 3, pityTriggered: false }) },
      { subProb: 0.3, make: () => ({ prize: 'frags3' as const, contributionGain: 0, frags: 3, destinyScrolls: 0, soulShards: 0, pityTriggered: false }) },
      { subProb: 0.3, make: () => ({ prize: 'refund40' as const, contributionGain: 40, frags: 0, destinyScrolls: 0, soulShards: 0, pityTriggered: false }) },
    ],
  },
  {
    prob: 0.20, label: '五等奖',
    subs: [
      { subProb: 0.3, make: () => ({ prize: 'frags2' as const, contributionGain: 0, frags: 2, destinyScrolls: 0, soulShards: 0, pityTriggered: false }) },
      { subProb: 0.3, make: () => ({ prize: 'soul2' as const, contributionGain: 0, frags: 0, destinyScrolls: 0, soulShards: 2, pityTriggered: false }) },
      { subProb: 0.4, make: () => ({ prize: 'refund20' as const, contributionGain: 20, frags: 0, destinyScrolls: 0, soulShards: 0, pityTriggered: false }) },
    ],
  },
  {
    prob: 0.25, label: '六等奖',
    subs: [
      { subProb: 0.4, make: () => ({ prize: 'frags' as const, contributionGain: 0, frags: 1, destinyScrolls: 0, soulShards: 0, pityTriggered: false }) },
      { subProb: 0.4, make: () => ({ prize: 'soul' as const, contributionGain: 0, frags: 0, destinyScrolls: 0, soulShards: 1, pityTriggered: false }) },
      { subProb: 0.2, make: () => ({ prize: 'refund10' as const, contributionGain: 10, frags: 0, destinyScrolls: 0, soulShards: 0, pityTriggered: false }) },
    ],
  },
  {
    prob: 0.40, label: '空奖',
    subs: [
      { subProb: 1, make: () => ({ prize: 'empty' as const, contributionGain: 5, frags: 0, destinyScrolls: 0, soulShards: 0, pityTriggered: false }) },
    ],
  },
];

const PITY_THRESHOLD = 299;

function pickTier(rng: () => number): Tier {
  const roll = rng();
  let acc = 0;
  for (const t of TIERS) {
    acc += t.prob;
    if (roll < acc) return t;
  }
  return TIERS[TIERS.length - 1];
}

function pickSub(tier: Tier, rng: () => number): DrawResult {
  const roll = rng();
  let acc = 0;
  for (const s of tier.subs) {
    acc += s.subProb;
    if (roll < acc) return s.make(rng);
  }
  return tier.subs[tier.subs.length - 1].make(rng);
}

function isMajorPrize(prize: GachaPrize): boolean {
  return prize === 'mythic_equip' || prize === 'random_equip';
}

export function drawGacha(pity: number, rng: () => number): { result: DrawResult; newPity: number } {
  let result: DrawResult;
  const isPity = pity >= PITY_THRESHOLD;

  if (isPity) {
    const id = EQUIPMENT_IDS[Math.floor(rng() * EQUIPMENT_IDS.length)];
    result = { prize: 'random_equip', contributionGain: 0, frags: 0, destinyScrolls: 0, soulShards: 0, pityTriggered: true, grantedEquipId: id };
  } else {
    const tier = pickTier(rng);
    result = pickSub(tier, rng);
  }

  const newPity = (isPity || isMajorPrize(result.prize)) ? 0 : pity + 1;
  return { result, newPity };
}

export const FRAG_COST = 30;
