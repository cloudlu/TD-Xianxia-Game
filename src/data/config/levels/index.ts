import type { LevelConfig, ManifestEntry, GridPoint } from '../../../types';
import { LAYOUTS } from '../layouts';
import { LAYOUT_MAP } from '../layoutMap';
import { buildableFromPaths } from './buildable';
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
import { CH6_L1 } from './ch6-l1';
import { CH6_L2 } from './ch6-l2';
import { CH6_L3 } from './ch6-l3';
import { CH7_L1 } from './ch7-l1';
import { CH7_L2 } from './ch7-l2';
import { CH7_L3 } from './ch7-l3';
import { CH8_L1 } from './ch8-l1';
import { CH8_L2 } from './ch8-l2';
import { CH8_L3 } from './ch8-l3';
import { CH9_L1 } from './ch9-l1';
import { CH9_L2 } from './ch9-l2';
import { CH9_L3 } from './ch9-l3';
import { CH10_L1 } from './ch10-l1';
import { CH10_L2 } from './ch10-l2';
import { CH10_L3 } from './ch10-l3';
import { CH11_L1 } from './ch11-l1';
import { CH11_L2 } from './ch11-l2';
import { CH11_L3 } from './ch11-l3';
import { CH12_L1 } from './ch12-l1';
import { CH12_L2 } from './ch12-l2';
import { CH12_L3 } from './ch12-l3';
import { CH13_L1 } from './ch13-l1';
import { CH13_L2 } from './ch13-l2';
import { CH13_L3 } from './ch13-l3';
import { CH14_L1 } from './ch14-l1';
import { CH14_L2 } from './ch14-l2';
import { CH14_L3 } from './ch14-l3';
import { CH15_L1 } from './ch15-l1';
import { CH15_L2 } from './ch15-l2';
import { CH15_L3 } from './ch15-l3';
import { CH16_L1 } from './ch16-l1';
import { CH16_L2 } from './ch16-l2';
import { CH16_L3 } from './ch16-l3';
import { CH17_L1 } from './ch17-l1';
import { CH17_L2 } from './ch17-l2';
import { CH17_L3 } from './ch17-l3';
import { CH18_L1 } from './ch18-l1';
import { CH18_L2 } from './ch18-l2';
import { CH18_L3 } from './ch18-l3';
import { CH19_L1 } from './ch19-l1';
import { CH19_L2 } from './ch19-l2';
import { CH19_L3 } from './ch19-l3';
import { CH20_L1 } from './ch20-l1';
import { CH20_L2 } from './ch20-l2';
import { CH20_L3 } from './ch20-l3';
import { CH21_L1 } from './ch21-l1';
import { CH21_L2 } from './ch21-l2';
import { CH21_L3 } from './ch21-l3';
import { CH22_L1 } from './ch22-l1';
import { CH22_L2 } from './ch22-l2';
import { CH22_L3 } from './ch22-l3';
import { CH23_L1 } from './ch23-l1';
import { CH23_L2 } from './ch23-l2';
import { CH23_L3 } from './ch23-l3';
import { CH24_L1 } from './ch24-l1';
import { CH24_L2 } from './ch24-l2';
import { CH24_L3 } from './ch24-l3';
import { CH25_L1 } from './ch25-l1';
import { CH25_L2 } from './ch25-l2';
import { CH25_L3 } from './ch25-l3';
import { CH26_L1 } from './ch26-l1';
import { CH26_L2 } from './ch26-l2';
import { CH26_L3 } from './ch26-l3';
import { CH27_L1 } from './ch27-l1';
import { CH27_L2 } from './ch27-l2';
import { CH27_L3 } from './ch27-l3';
import { CH28_L1 } from './ch28-l1';
import { CH28_L2 } from './ch28-l2';
import { CH28_L3 } from './ch28-l3';
import { CH29_L1 } from './ch29-l1';
import { CH29_L2 } from './ch29-l2';
import { CH29_L3 } from './ch29-l3';
import { CH30_L1 } from './ch30-l1';
import { CH30_L2 } from './ch30-l2';
import { CH30_L3 } from './ch30-l3';

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
  [CH6_L1.id]: CH6_L1,
  [CH6_L2.id]: CH6_L2,
  [CH6_L3.id]: CH6_L3,
  [CH7_L1.id]: CH7_L1,
  [CH7_L2.id]: CH7_L2,
  [CH7_L3.id]: CH7_L3,
  [CH8_L1.id]: CH8_L1,
  [CH8_L2.id]: CH8_L2,
  [CH8_L3.id]: CH8_L3,
  [CH9_L1.id]: CH9_L1,
  [CH9_L2.id]: CH9_L2,
  [CH9_L3.id]: CH9_L3,
  [CH10_L1.id]: CH10_L1,
  [CH10_L2.id]: CH10_L2,
  [CH10_L3.id]: CH10_L3,
  [CH11_L1.id]: CH11_L1,
  [CH11_L2.id]: CH11_L2,
  [CH11_L3.id]: CH11_L3,
  [CH12_L1.id]: CH12_L1,
  [CH12_L2.id]: CH12_L2,
  [CH12_L3.id]: CH12_L3,
  [CH13_L1.id]: CH13_L1,
  [CH13_L2.id]: CH13_L2,
  [CH13_L3.id]: CH13_L3,
  [CH14_L1.id]: CH14_L1,
  [CH14_L2.id]: CH14_L2,
  [CH14_L3.id]: CH14_L3,
  [CH15_L1.id]: CH15_L1,
  [CH15_L2.id]: CH15_L2,
  [CH15_L3.id]: CH15_L3,
  [CH16_L1.id]: CH16_L1,
  [CH16_L2.id]: CH16_L2,
  [CH16_L3.id]: CH16_L3,
  [CH17_L1.id]: CH17_L1,
  [CH17_L2.id]: CH17_L2,
  [CH17_L3.id]: CH17_L3,
  [CH18_L1.id]: CH18_L1,
  [CH18_L2.id]: CH18_L2,
  [CH18_L3.id]: CH18_L3,
  [CH19_L1.id]: CH19_L1,
  [CH19_L2.id]: CH19_L2,
  [CH19_L3.id]: CH19_L3,
  [CH20_L1.id]: CH20_L1,
  [CH20_L2.id]: CH20_L2,
  [CH20_L3.id]: CH20_L3,
  [CH21_L1.id]: CH21_L1,
  [CH21_L2.id]: CH21_L2,
  [CH21_L3.id]: CH21_L3,
  [CH22_L1.id]: CH22_L1,
  [CH22_L2.id]: CH22_L2,
  [CH22_L3.id]: CH22_L3,
  [CH23_L1.id]: CH23_L1,
  [CH23_L2.id]: CH23_L2,
  [CH23_L3.id]: CH23_L3,
  [CH24_L1.id]: CH24_L1,
  [CH24_L2.id]: CH24_L2,
  [CH24_L3.id]: CH24_L3,
  [CH25_L1.id]: CH25_L1,
  [CH25_L2.id]: CH25_L2,
  [CH25_L3.id]: CH25_L3,
  [CH26_L1.id]: CH26_L1,
  [CH26_L2.id]: CH26_L2,
  [CH26_L3.id]: CH26_L3,
  [CH27_L1.id]: CH27_L1,
  [CH27_L2.id]: CH27_L2,
  [CH27_L3.id]: CH27_L3,
  [CH28_L1.id]: CH28_L1,
  [CH28_L2.id]: CH28_L2,
  [CH28_L3.id]: CH28_L3,
  [CH29_L1.id]: CH29_L1,
  [CH29_L2.id]: CH29_L2,
  [CH29_L3.id]: CH29_L3,
  [CH30_L1.id]: CH30_L1,
  [CH30_L2.id]: CH30_L2,
  [CH30_L3.id]: CH30_L3,
};

// 布局覆盖：从 layoutMap 合并路径到对应关卡
const COLS = 16, ROWS = 8;
for (const [levelId, layoutId] of Object.entries(LAYOUT_MAP)) {
  const layout = LAYOUTS[layoutId];
  if (!layout) continue;
  const level = LEVELS[levelId];
  if (!level) continue;
  LEVELS[levelId] = {
    ...level,
    paths: layout as GridPoint[][],
    buildable: buildableFromPaths(COLS, ROWS, layout as GridPoint[][]),
  };
}

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
  { levelId: 'ch6-l1', chapterId: 'ch6', chapterTitle: '第六章 · 域外篇' },
  { levelId: 'ch6-l2', chapterId: 'ch6', chapterTitle: '第六章 · 域外篇' },
  { levelId: 'ch6-l3', chapterId: 'ch6', chapterTitle: '第六章 · 域外篇' },
  { levelId: 'ch7-l1', chapterId: 'ch7', chapterTitle: '第七章 · 域外篇' },
  { levelId: 'ch7-l2', chapterId: 'ch7', chapterTitle: '第七章 · 域外篇' },
  { levelId: 'ch7-l3', chapterId: 'ch7', chapterTitle: '第七章 · 域外篇' },
  { levelId: 'ch8-l1', chapterId: 'ch8', chapterTitle: '第八章 · 域外篇' },
  { levelId: 'ch8-l2', chapterId: 'ch8', chapterTitle: '第八章 · 域外篇' },
  { levelId: 'ch8-l3', chapterId: 'ch8', chapterTitle: '第八章 · 域外篇' },
  { levelId: 'ch9-l1', chapterId: 'ch9', chapterTitle: '第九章 · 域外篇' },
  { levelId: 'ch9-l2', chapterId: 'ch9', chapterTitle: '第九章 · 域外篇' },
  { levelId: 'ch9-l3', chapterId: 'ch9', chapterTitle: '第九章 · 域外篇' },
  { levelId: 'ch10-l1', chapterId: 'ch10', chapterTitle: '第十章 · 域外篇' },
  { levelId: 'ch10-l2', chapterId: 'ch10', chapterTitle: '第十章 · 域外篇' },
  { levelId: 'ch10-l3', chapterId: 'ch10', chapterTitle: '第十章 · 域外篇' },
  { levelId: 'ch11-l1', chapterId: 'ch11', chapterTitle: '第十一章 · 大陆联盟' },
  { levelId: 'ch11-l2', chapterId: 'ch11', chapterTitle: '第十一章 · 大陆联盟' },
  { levelId: 'ch11-l3', chapterId: 'ch11', chapterTitle: '第十一章 · 大陆联盟' },
  { levelId: 'ch12-l1', chapterId: 'ch12', chapterTitle: '第十二章 · 大陆联盟' },
  { levelId: 'ch12-l2', chapterId: 'ch12', chapterTitle: '第十二章 · 大陆联盟' },
  { levelId: 'ch12-l3', chapterId: 'ch12', chapterTitle: '第十二章 · 大陆联盟' },
  { levelId: 'ch13-l1', chapterId: 'ch13', chapterTitle: '第十三章 · 大陆联盟' },
  { levelId: 'ch13-l2', chapterId: 'ch13', chapterTitle: '第十三章 · 大陆联盟' },
  { levelId: 'ch13-l3', chapterId: 'ch13', chapterTitle: '第十三章 · 大陆联盟' },
  { levelId: 'ch14-l1', chapterId: 'ch14', chapterTitle: '第十四章 · 大陆联盟' },
  { levelId: 'ch14-l2', chapterId: 'ch14', chapterTitle: '第十四章 · 大陆联盟' },
  { levelId: 'ch14-l3', chapterId: 'ch14', chapterTitle: '第十四章 · 大陆联盟' },
  { levelId: 'ch15-l1', chapterId: 'ch15', chapterTitle: '第十五章 · 大陆联盟' },
  { levelId: 'ch15-l2', chapterId: 'ch15', chapterTitle: '第十五章 · 大陆联盟' },
  { levelId: 'ch15-l3', chapterId: 'ch15', chapterTitle: '第十五章 · 大陆联盟' },
  { levelId: 'ch16-l1', chapterId: 'ch16', chapterTitle: '第十六章 · 百族大战' },
  { levelId: 'ch16-l2', chapterId: 'ch16', chapterTitle: '第十六章 · 百族大战' },
  { levelId: 'ch16-l3', chapterId: 'ch16', chapterTitle: '第十六章 · 百族大战' },
  { levelId: 'ch17-l1', chapterId: 'ch17', chapterTitle: '第十七章 · 百族大战' },
  { levelId: 'ch17-l2', chapterId: 'ch17', chapterTitle: '第十七章 · 百族大战' },
  { levelId: 'ch17-l3', chapterId: 'ch17', chapterTitle: '第十七章 · 百族大战' },
  { levelId: 'ch18-l1', chapterId: 'ch18', chapterTitle: '第十八章 · 百族大战' },
  { levelId: 'ch18-l2', chapterId: 'ch18', chapterTitle: '第十八章 · 百族大战' },
  { levelId: 'ch18-l3', chapterId: 'ch18', chapterTitle: '第十八章 · 百族大战' },
  { levelId: 'ch19-l1', chapterId: 'ch19', chapterTitle: '第十九章 · 百族大战' },
  { levelId: 'ch19-l2', chapterId: 'ch19', chapterTitle: '第十九章 · 百族大战' },
  { levelId: 'ch19-l3', chapterId: 'ch19', chapterTitle: '第十九章 · 百族大战' },
  { levelId: 'ch20-l1', chapterId: 'ch20', chapterTitle: '第二十章 · 百族大战' },
  { levelId: 'ch20-l2', chapterId: 'ch20', chapterTitle: '第二十章 · 百族大战' },
  { levelId: 'ch20-l3', chapterId: 'ch20', chapterTitle: '第二十章 · 百族大战' },
  { levelId: 'ch21-l1', chapterId: 'ch21', chapterTitle: '第二十一章 · 界域之战' },
  { levelId: 'ch21-l2', chapterId: 'ch21', chapterTitle: '第二十一章 · 界域之战' },
  { levelId: 'ch21-l3', chapterId: 'ch21', chapterTitle: '第二十一章 · 界域之战' },
  { levelId: 'ch22-l1', chapterId: 'ch22', chapterTitle: '第二十二章 · 界域之战' },
  { levelId: 'ch22-l2', chapterId: 'ch22', chapterTitle: '第二十二章 · 界域之战' },
  { levelId: 'ch22-l3', chapterId: 'ch22', chapterTitle: '第二十二章 · 界域之战' },
  { levelId: 'ch23-l1', chapterId: 'ch23', chapterTitle: '第二十三章 · 界域之战' },
  { levelId: 'ch23-l2', chapterId: 'ch23', chapterTitle: '第二十三章 · 界域之战' },
  { levelId: 'ch23-l3', chapterId: 'ch23', chapterTitle: '第二十三章 · 界域之战' },
  { levelId: 'ch24-l1', chapterId: 'ch24', chapterTitle: '第二十四章 · 界域之战' },
  { levelId: 'ch24-l2', chapterId: 'ch24', chapterTitle: '第二十四章 · 界域之战' },
  { levelId: 'ch24-l3', chapterId: 'ch24', chapterTitle: '第二十四章 · 界域之战' },
  { levelId: 'ch25-l1', chapterId: 'ch25', chapterTitle: '第二十五章 · 界域之战' },
  { levelId: 'ch25-l2', chapterId: 'ch25', chapterTitle: '第二十五章 · 界域之战' },
  { levelId: 'ch25-l3', chapterId: 'ch25', chapterTitle: '第二十五章 · 界域之战' },
  { levelId: 'ch26-l1', chapterId: 'ch26', chapterTitle: '第二十六章 · 飞升篇' },
  { levelId: 'ch26-l2', chapterId: 'ch26', chapterTitle: '第二十六章 · 飞升篇' },
  { levelId: 'ch26-l3', chapterId: 'ch26', chapterTitle: '第二十六章 · 飞升篇' },
  { levelId: 'ch27-l1', chapterId: 'ch27', chapterTitle: '第二十七章 · 飞升篇' },
  { levelId: 'ch27-l2', chapterId: 'ch27', chapterTitle: '第二十七章 · 飞升篇' },
  { levelId: 'ch27-l3', chapterId: 'ch27', chapterTitle: '第二十七章 · 飞升篇' },
  { levelId: 'ch28-l1', chapterId: 'ch28', chapterTitle: '第二十八章 · 飞升篇' },
  { levelId: 'ch28-l2', chapterId: 'ch28', chapterTitle: '第二十八章 · 飞升篇' },
  { levelId: 'ch28-l3', chapterId: 'ch28', chapterTitle: '第二十八章 · 飞升篇' },
  { levelId: 'ch29-l1', chapterId: 'ch29', chapterTitle: '第二十九章 · 飞升篇' },
  { levelId: 'ch29-l2', chapterId: 'ch29', chapterTitle: '第二十九章 · 飞升篇' },
  { levelId: 'ch29-l3', chapterId: 'ch29', chapterTitle: '第二十九章 · 飞升篇' },
  { levelId: 'ch30-l1', chapterId: 'ch30', chapterTitle: '第三十章 · 飞升篇' },
  { levelId: 'ch30-l2', chapterId: 'ch30', chapterTitle: '第三十章 · 飞升篇' },
  { levelId: 'ch30-l3', chapterId: 'ch30', chapterTitle: '第三十章 · 飞升篇' },
];
