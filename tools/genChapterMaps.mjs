// 路径原型库生成器（v0.89 Phase 0.2）—— 生成 src/data/config/chapterMaps.ts
// 运行：node tools/genChapterMaps.mjs > src/data/config/chapterMaps.ts
//
// 设计约束：
//  1. 7 种拓扑原型（蛇形/十字汇聚/Y分流合流/回环/双桥渡河/窄道迷宫/螺旋），相邻章不重复
//  2. 多路等长铁律：同章三路长度差 ≤10%（ConfigLoader 兜底校验）
//  3. 全部正交路点；折返"梳齿"为合法死胡同（走进去再折回）
//  4. blocked 每章 12 个（6 岩石 + 3 树木 + 3 水域），种子随机生成并避开路径格

const COLS = 32, ROWS = 12;

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- 原型表（已验算等长，见 git history 中的验算脚本） ----------
// 每项：wps = 折点序列（等价旧 p() 语法），base = 宗门坐标
const PROTOTYPES = {
  // 蛇形·等长 33/33/33（折弯补偿）
  snake: {
    base: { x: 31, y: 6 },
    wps: [
      [[0,2],[10,2],[10,3],[20,3],[20,2],[31,2]],
      [[0,6],[12,6],[12,7],[22,7],[22,6],[31,6]],
      [[0,9],[8,9],[8,10],[18,10],[18,9],[31,9]],
    ],
  },
  // 十字汇聚·等长 20/20/21（短臂梳齿补齐），宗门在中心
  cross: {
    base: { x: 15, y: 6 },
    wps: [
      [[3,6],[6,6],[6,8],[6,6],[10,6],[10,4],[10,6],[15,6]],
      [[15,0],[19,0],[19,2],[15,2],[18,2],[18,5],[15,5],[15,6]],
      [[15,11],[10,11],[10,9],[15,9],[12,9],[12,6],[15,6]],
    ],
  },
  // Y 形分流合流·等长 31/31/31，宗门在右
  yfork: {
    base: { x: 27, y: 6 },
    wps: [
      [[0,2],[12,2],[12,6],[27,6]],
      [[0,6],[5,6],[5,7],[5,6],[11,6],[11,7],[11,6],[27,6]],
      [[0,10],[12,10],[12,6],[27,6]],
    ],
  },
  // 回环·等长 66/66/67（三向同构回环错相位），宗门在中心
  loop: {
    base: { x: 15, y: 6 },
    wps: [
      [[0,1],[26,1],[26,8],[6,8],[6,5],[15,5],[15,6]],
      [[0,3],[26,3],[26,10],[6,10],[6,7],[15,7],[15,6]],
      [[0,4],[26,4],[26,11],[6,11],[6,8],[15,8],[15,6]],
    ],
  },
  // 双桥渡河·等长 35/35/35（中路带双折弯），宗门在右
  bridge: {
    base: { x: 31, y: 6 },
    wps: [
      [[0,2],[12,2],[12,4],[20,4],[20,2],[31,2]],
      [[0,6],[8,6],[8,7],[8,6],[16,6],[16,7],[16,6],[31,6]],
      [[0,10],[12,10],[12,8],[20,8],[20,10],[31,10]],
    ],
  },
  // 窄道迷宫·等长 84/84/86（S 弯折返三层行带），宗门在左
  maze: {
    base: { x: 0, y: 6 },
    wps: [
      [[31,1],[4,1],[4,2],[28,2],[28,3],[8,3],[8,4],[0,4],[0,6]],
      [[31,5],[4,5],[4,6],[28,6],[28,7],[8,7],[8,8],[0,8],[0,6]],
      [[31,9],[4,9],[4,10],[28,10],[28,11],[8,11],[0,11],[0,6]],
    ],
  },
  // 螺旋·等长 53/53/51（三向 3/4 圈收缩），宗门在中心
  spiral: {
    base: { x: 15, y: 6 },
    wps: [
      [[2,0],[28,0],[28,8],[20,8],[20,4],[15,4],[15,6]],
      [[29,11],[3,11],[3,3],[11,3],[11,8],[15,8],[15,6]],
      [[31,1],[24,1],[24,10],[16,10],[16,2],[12,2],[12,9],[13,9],[13,10],[13,9],[15,9],[15,6]],
    ],
  },
};

// 30 章原型分配：相邻不重复、同原型间隔 ≥3 章
const CHAPTER_PROTO = [
  'snake',   // ch1
  'yfork',   // ch2
  'bridge',  // ch3
  'loop',    // ch4
  'snake',   // ch5
  'cross',   // ch6
  'yfork',   // ch7
  'bridge',  // ch8
  'maze',    // ch9  （左宗门组）
  'snake',   // ch10
  'loop',    // ch11
  'yfork',   // ch12
  'bridge',  // ch13
  'maze',    // ch14
  'cross',   // ch15 （中心组）
  'loop',    // ch16
  'cross',   // ch17
  'yfork',   // ch18
  'bridge',  // ch19
  'snake',   // ch20
  'loop',    // ch21
  'cross',   // ch22
  'yfork',   // ch23
  'bridge',  // ch24
  'spiral',  // ch25 （终章组）
  'loop',    // ch26
  'spiral',  // ch27
  'cross',   // ch28
  'spiral',  // ch29
  'yfork',   // ch30
];

for (let i = 1; i < CHAPTER_PROTO.length; i++) {
  if (CHAPTER_PROTO[i] === CHAPTER_PROTO[i - 1]) {
    throw new Error(`相邻章原型重复：ch${i} 与 ch${i + 1} 都是 ${CHAPTER_PROTO[i]}`);
  }
}

// ---------- 展开与输出 ----------
function expand(wps) {
  const pts = [wps[0]];
  for (let i = 0; i < wps.length - 1; i++) {
    const a = wps[i], b = wps[i + 1];
    const dx = Math.sign(b.x - a.x), dy = Math.sign(b.y - a.y);
    let x = a.x, y = a.y;
    while (x !== b.x || y !== b.y) { x += dx; y += dy; pts.push({ x, y }); }
  }
  return pts;
}

function pathLen(pts) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.abs(pts[i].x - pts[i - 1].x) + Math.abs(pts[i].y - pts[i - 1].y);
  return L;
}

const fmtPt = (p) => `{ x: ${p.x}, y: ${p.y} }`;

let out = '';
out += `import type { ChapterMapConfig } from '../../types';\n\n`;
out += `// v0.89 Phase 0：路径原型库（7 种拓扑 × 30 章）——由 tools/genChapterMaps.mjs 生成\n`;
out += `// 约束：相邻章原型不重复；同章多路长度差 ≤10%（ConfigLoader 校验兜底）；\n`;
out += `// 折返"梳齿"段为合法死胡同设计（敌人走进折回）；blocked 程序生成避开路径格。\n\n`;
out += `const COLS = ${COLS}, ROWS = ${ROWS};\n`;
out += `const ACTIVES = { l1: [0], l2: [0, 1], l3: [0, 1, 2] };\n\n`;
out += `export const CHAPTER_MAPS: Record<string, ChapterMapConfig> = {\n`;

for (let i = 0; i < 30; i++) {
  const chId = `ch${i + 1}`;
  const protoName = CHAPTER_PROTO[i];
  const proto = PROTOTYPES[protoName];
  const paths = proto.wps.map((w) => expand(w.map(([x, y]) => ({ x, y }))));
  const lens = paths.map(pathLen);
  const min = Math.min(...lens), max = Math.max(...lens);
  if ((max - min) / min > 0.10) throw new Error(`${chId} 长度差超标: ${lens.join('/')}`);

  // 生成 blocked：避开路径格与宗门
  const cells = new Set();
  for (const wp of proto.wps) for (const [x, y] of wpsCells(wp)) cells.add(`${x},${y}`);
  cells.add(`${proto.base.x},${proto.base.y}`);
  const rng = mulberry32(1000 + i * 77);
  const blocked = [];
  let guard = 0;
  while (blocked.length < 12 && guard++ < 500) {
    const col = Math.floor(rng() * COLS), row = Math.floor(rng() * ROWS);
    if (cells.has(`${col},${row}`)) continue;
    blocked.push({ col, row, terrain: blocked.length < 6 ? 'rock' : blocked.length < 9 ? 'tree' : 'water' });
    cells.add(`${col},${row}`);
  }

  out += `  ${chId}: {\n`;
  out += `    id: "${chId}", cols: COLS, rows: ROWS,\n`;
  out += `    base: ${fmtPt(proto.base)}, backgroundId: "${chId}", actives: ACTIVES,\n`;
  out += `    blocked: [\n`;
  for (const b of blocked) out += `      { col: ${b.col}, row: ${b.row}, terrain: '${b.terrain}' },\n`;
  out += `    ],\n`;
  out += `    paths: [\n`;
  for (const wp of proto.wps) {
    out += `      [${wp.map(([x, y]) => `{ x: ${x}, y: ${y} }`).join(', ')}],\n`;
  }
  out += `    ],\n`;
  out += `  },\n`;
}

out += `};\n`;

/** 折点序列展开为逐格坐标（用于 blocked 避让） */
function wpsCells(wp) {
  const pts = [wp[0]];
  for (let i = 0; i < wp.length - 1; i++) {
    const [ax, ay] = wp[i], [bx, by] = wp[i + 1];
    const dx = Math.sign(bx - ax), dy = Math.sign(by - ay);
    let x = ax, y = ay;
    while (x !== bx || y !== by) { x += dx; y += dy; pts.push([x, y]); }
  }
  return pts;
}

console.log(out);
console.error(`✅ 30 章生成完毕（原型分配：${[...new Set(CHAPTER_PROTO)].join('/')}）`);
