import type { LevelConfig, ManifestEntry } from '../../../types';
import { CH1_L1 } from './ch1-l1';
import { CH1_L2 } from './ch1-l2';
import { CH1_L3 } from './ch1-l3';
import { CH2_L1 } from './ch2-l1';
import { CH2_L2 } from './ch2-l2';
import { CH2_L3 } from './ch2-l3';
import { CH3_L1 } from './ch3-l1';
import { CH3_L2 } from './ch3-l2';
import { CH3_L3 } from './ch3-l3';
import { CH4_L1 } from './ch4-l1';
import { CH4_L2 } from './ch4-l2';
import { CH4_L3 } from './ch4-l3';
import { CH5_L1 } from './ch5-l1';
import { CH5_L2 } from './ch5-l2';
import { CH5_L3 } from './ch5-l3';

// 所有关卡按 id 索引（Registry 按 id 查询）
export const LEVELS: Record<string, LevelConfig> = {
  [CH1_L1.id]: CH1_L1,
  [CH1_L2.id]: CH1_L2,
  [CH1_L3.id]: CH1_L3,
  [CH2_L1.id]: CH2_L1,
  [CH2_L2.id]: CH2_L2,
  [CH2_L3.id]: CH2_L3,
  [CH3_L1.id]: CH3_L1,
  [CH3_L2.id]: CH3_L2,
  [CH3_L3.id]: CH3_L3,
  [CH4_L1.id]: CH4_L1,
  [CH4_L2.id]: CH4_L2,
  [CH4_L3.id]: CH4_L3,
  [CH5_L1.id]: CH5_L1,
  [CH5_L2.id]: CH5_L2,
  [CH5_L3.id]: CH5_L3,
};

// 章节清单（顺序即解锁顺序；第 N 关解锁 = 第 N-1 关通关）—— 设计文档 §8.2
export const MANIFEST: ManifestEntry[] = [
  { levelId: 'ch1-l1', chapterId: 'ch1', chapterTitle: '第一章 · 山门初劫' },
  { levelId: 'ch1-l2', chapterId: 'ch1', chapterTitle: '第一章 · 山门初劫' },
  { levelId: 'ch1-l3', chapterId: 'ch1', chapterTitle: '第一章 · 山门初劫' },
  { levelId: 'ch2-l1', chapterId: 'ch2', chapterTitle: '第二章 · 万妖攻山' },
  { levelId: 'ch2-l2', chapterId: 'ch2', chapterTitle: '第二章 · 万妖攻山' },
  { levelId: 'ch2-l3', chapterId: 'ch2', chapterTitle: '第二章 · 万妖攻山' },
  { levelId: 'ch3-l1', chapterId: 'ch3', chapterTitle: '第三章 · 魔修乱世' },
  { levelId: 'ch3-l2', chapterId: 'ch3', chapterTitle: '第三章 · 魔修乱世' },
  { levelId: 'ch3-l3', chapterId: 'ch3', chapterTitle: '第三章 · 魔修乱世' },
  { levelId: 'ch4-l1', chapterId: 'ch4', chapterTitle: '第四章 · 秘境凶兽' },
  { levelId: 'ch4-l2', chapterId: 'ch4', chapterTitle: '第四章 · 秘境凶兽' },
  { levelId: 'ch4-l3', chapterId: 'ch4', chapterTitle: '第四章 · 秘境凶兽' },
  { levelId: 'ch5-l1', chapterId: 'ch5', chapterTitle: '第五章 · 血煞魔尊' },
  { levelId: 'ch5-l2', chapterId: 'ch5', chapterTitle: '第五章 · 血煞魔尊' },
  { levelId: 'ch5-l3', chapterId: 'ch5', chapterTitle: '第五章 · 血煞魔尊' },
];
