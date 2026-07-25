import type { ChapterMapConfig, GridPoint } from '../../types';

type Dir = 'R' | 'L' | 'U' | 'D';
function p(startX: number, startY: number, ...segs: [Dir, number][]): GridPoint[] {
  const pts: GridPoint[] = [{ x: startX, y: startY }];
  let x = startX, y = startY;
  for (const [dir, dist] of segs) {
    x += dir === 'R' ? dist : dir === 'L' ? -dist : 0;
    y += dir === 'D' ? dist : dir === 'U' ? -dist : 0;
    pts.push({ x, y });
  }
  return pts;
}

const COLS = 32, ROWS = 12;
const ACTIVES = { l1: [0], l2: [0, 1], l3: [0, 1, 2] };

export const CHAPTER_MAPS: Record<string, ChapterMapConfig> = {
  ch1: {
    id: "ch1", cols: 32, rows: 12,
    base: { x: 31, y: 6 }, backgroundId: "ch1", actives: ACTIVES,
    blocked: [
      { col: 24, row: 9, terrain: 'rock' },
      { col: 18, row: 4, terrain: 'rock' },
      { col: 18, row: 11, terrain: 'rock' },
      { col: 22, row: 6, terrain: 'rock' },
      { col: 0, row: 2, terrain: 'rock' },
      { col: 15, row: 9, terrain: 'rock' },
      { col: 4, row: 5, terrain: 'tree' },
      { col: 30, row: 0, terrain: 'tree' },
      { col: 29, row: 8, terrain: 'tree' },
      { col: 2, row: 5, terrain: 'water' },
      { col: 13, row: 1, terrain: 'water' },
      { col: 30, row: 9, terrain: 'water' }
    ],
    paths: [
      p(0,4, ['R',7],['D',2],['R',10],['U',1],['R',14]),
      p(0,8, ['R',9],['U',2],['R',12],['D',1],['R',10]),
      p(13,0, ['D',2],['R',9],['D',4],['R',9]),
    ],
  },
  ch2: {
    id: "ch2", cols: 32, rows: 12,
    base: { x: 31, y: 5 }, backgroundId: "ch2", actives: ACTIVES,
    blocked: [
      { col: 25, row: 6, terrain: 'rock' },
      { col: 23, row: 1, terrain: 'rock' },
      { col: 27, row: 8, terrain: 'rock' },
      { col: 3, row: 4, terrain: 'rock' },
      { col: 17, row: 11, terrain: 'rock' },
      { col: 4, row: 7, terrain: 'rock' },
      { col: 28, row: 2, terrain: 'tree' },
      { col: 26, row: 10, terrain: 'tree' },
      { col: 29, row: 6, terrain: 'tree' },
      { col: 6, row: 3, terrain: 'water' },
      { col: 21, row: 11, terrain: 'water' },
      { col: 8, row: 8, terrain: 'water' }
    ],
    paths: [
      p(0,3, ['R',6],['D',2],['R',12],['U',1],['R',13]),
      p(0,7, ['R',8],['U',2],['R',13],['D',1],['R',10]),
      p(13,0, ['D',2],['R',9],['D',3],['R',9]),
    ],
  },
  ch3: {
    id: "ch3", cols: 32, rows: 12,
    base: { x: 31, y: 6 }, backgroundId: "ch3", actives: ACTIVES,
    blocked: [
      { col: 26, row: 3, terrain: 'rock' },
      { col: 28, row: 10, terrain: 'rock' },
      { col: 3, row: 6, terrain: 'rock' },
      { col: 15, row: 1, terrain: 'rock' },
      { col: 1, row: 9, terrain: 'rock' },
      { col: 24, row: 4, terrain: 'rock' },
      { col: 20, row: 0, terrain: 'tree' },
      { col: 22, row: 8, terrain: 'tree' },
      { col: 30, row: 4, terrain: 'tree' },
      { col: 10, row: 1, terrain: 'water' },
      { col: 29, row: 9, terrain: 'water' },
      { col: 21, row: 6, terrain: 'water' }
    ],
    paths: [
      p(0,4, ['R',9],['D',2],['R',11],['U',1],['R',11]),
      p(0,8, ['R',7],['U',2],['R',10],['D',1],['R',14]),
      p(13,0, ['D',3],['R',9],['D',3],['R',9]),
    ],
  },
  ch4: {
    id: "ch4", cols: 32, rows: 12,
    base: { x: 31, y: 7 }, backgroundId: "ch4", actives: ACTIVES,
    blocked: [
      { col: 27, row: 0, terrain: 'rock' },
      { col: 1, row: 8, terrain: 'rock' },
      { col: 12, row: 3, terrain: 'rock' },
      { col: 28, row: 10, terrain: 'rock' },
      { col: 17, row: 6, terrain: 'rock' },
      { col: 12, row: 2, terrain: 'rock' },
      { col: 12, row: 10, terrain: 'tree' },
      { col: 18, row: 6, terrain: 'tree' },
      { col: 29, row: 2, terrain: 'tree' },
      { col: 14, row: 11, terrain: 'water' },
      { col: 4, row: 8, terrain: 'water' },
      { col: 31, row: 4, terrain: 'water' }
    ],
    paths: [
      p(0,5, ['R',5],['D',2],['R',9],['U',1],['R',17]),
      p(0,9, ['R',9],['U',2],['R',12],['D',1],['R',10]),
      p(13,0, ['D',3],['R',9],['D',4],['R',9]),
    ],
  },
  ch5: {
    id: "ch5", cols: 32, rows: 12,
    base: { x: 31, y: 6 }, backgroundId: "ch5", actives: ACTIVES,
    blocked: [
      { col: 28, row: 9, terrain: 'rock' },
      { col: 5, row: 5, terrain: 'rock' },
      { col: 20, row: 0, terrain: 'rock' },
      { col: 8, row: 8, terrain: 'rock' },
      { col: 1, row: 4, terrain: 'rock' },
      { col: 0, row: 0, terrain: 'rock' },
      { col: 4, row: 8, terrain: 'tree' },
      { col: 14, row: 4, terrain: 'tree' },
      { col: 30, row: 0, terrain: 'tree' },
      { col: 18, row: 9, terrain: 'water' },
      { col: 12, row: 6, terrain: 'water' },
      { col: 11, row: 3, terrain: 'water' }
    ],
    paths: [
      p(0,4, ['R',7],['D',2],['R',10],['U',1],['R',14]),
      p(0,8, ['R',9],['U',2],['R',12],['D',1],['R',10]),
      p(13,11, ['U',2],['R',9],['U',3],['R',9]),
    ],
  },
  ch6: {
    id: "ch6", cols: 32, rows: 12,
    base: { x: 31, y: 5 }, backgroundId: "ch6", actives: ACTIVES,
    blocked: [
      { col: 29, row: 6, terrain: 'rock' },
      { col: 10, row: 2, terrain: 'rock' },
      { col: 29, row: 9, terrain: 'rock' },
      { col: 20, row: 5, terrain: 'rock' },
      { col: 17, row: 1, terrain: 'rock' },
      { col: 20, row: 9, terrain: 'rock' },
      { col: 28, row: 5, terrain: 'tree' },
      { col: 9, row: 2, terrain: 'tree' },
      { col: 29, row: 10, terrain: 'tree' },
      { col: 21, row: 7, terrain: 'water' },
      { col: 18, row: 4, terrain: 'water' },
      { col: 22, row: 1, terrain: 'water' }
    ],
    paths: [
      p(0,3, ['R',6],['D',2],['R',12],['U',1],['R',13]),
      p(0,7, ['R',8],['U',2],['R',13],['D',1],['R',10]),
      p(13,11, ['U',3],['R',9],['U',3],['R',9]),
    ],
  },
  ch7: {
    id: "ch7", cols: 32, rows: 12,
    base: { x: 31, y: 7 }, backgroundId: "ch7", actives: ACTIVES,
    blocked: [
      { col: 30, row: 3, terrain: 'rock' },
      { col: 15, row: 11, terrain: 'rock' },
      { col: 5, row: 7, terrain: 'rock' },
      { col: 0, row: 3, terrain: 'rock' },
      { col: 1, row: 11, terrain: 'rock' },
      { col: 8, row: 7, terrain: 'rock' },
      { col: 19, row: 3, terrain: 'tree' },
      { col: 5, row: 0, terrain: 'tree' },
      { col: 28, row: 8, terrain: 'tree' },
      { col: 24, row: 5, terrain: 'water' },
      { col: 25, row: 2, terrain: 'water' },
      { col: 2, row: 0, terrain: 'water' }
    ],
    paths: [
      p(0,5, ['R',9],['D',2],['R',11],['U',1],['R',11]),
      p(0,9, ['R',7],['U',2],['R',10],['D',1],['R',14]),
      p(13,11, ['U',2],['R',9],['U',2],['R',9]),
    ],
  },
  ch8: {
    id: "ch8", cols: 32, rows: 12,
    base: { x: 31, y: 6 }, backgroundId: "ch8", actives: ACTIVES,
    blocked: [
      { col: 31, row: 0, terrain: 'rock' },
      { col: 20, row: 8, terrain: 'rock' },
      { col: 14, row: 4, terrain: 'rock' },
      { col: 13, row: 0, terrain: 'rock' },
      { col: 18, row: 8, terrain: 'rock' },
      { col: 29, row: 4, terrain: 'rock' },
      { col: 13, row: 1, terrain: 'tree' },
      { col: 2, row: 10, terrain: 'tree' },
      { col: 28, row: 6, terrain: 'tree' },
      { col: 28, row: 3, terrain: 'water' },
      { col: 3, row: 1, terrain: 'water' },
      { col: 15, row: 10, terrain: 'water' }
    ],
    paths: [
      p(0,4, ['R',5],['D',2],['R',9],['U',1],['R',17]),
      p(0,8, ['R',9],['U',2],['R',12],['D',1],['R',10]),
      p(13,11, ['U',2],['R',9],['U',3],['R',9]),
    ],
  },

// ===== LEFT-BASE ch9-14 =====,
  ch9: {
    id: "ch9", cols: 32, rows: 12,
    base: { x: 0, y: 6 }, backgroundId: "ch9", actives: ACTIVES,
    blocked: [
      { col: 0, row: 10, terrain: 'rock' },
      { col: 24, row: 5, terrain: 'rock' },
      { col: 22, row: 1, terrain: 'rock' },
      { col: 25, row: 9, terrain: 'rock' },
      { col: 2, row: 6, terrain: 'rock' },
      { col: 16, row: 2, terrain: 'rock' },
      { col: 4, row: 11, terrain: 'tree' },
      { col: 28, row: 7, terrain: 'tree' },
      { col: 26, row: 4, terrain: 'tree' },
      { col: 31, row: 1, terrain: 'water' },
      { col: 10, row: 11, terrain: 'water' },
      { col: 24, row: 8, terrain: 'water' }
    ],
    paths: [
      p(31,4, ['L',8],['D',2],['L',10],['U',1],['L',13]),
      p(31,8, ['L',10],['U',2],['L',12],['D',1],['L',9]),
      p(18,0, ['D',6],['L',18]),
    ],
  },
  ch10: {
    id: "ch10", cols: 32, rows: 12,
    base: { x: 0, y: 5 }, backgroundId: "ch10", actives: ACTIVES,
    blocked: [
      { col: 1, row: 7, terrain: 'rock' },
      { col: 29, row: 2, terrain: 'rock' },
      { col: 31, row: 10, terrain: 'rock' },
      { col: 6, row: 7, terrain: 'rock' },
      { col: 18, row: 3, terrain: 'rock' },
      { col: 4, row: 0, terrain: 'rock' },
      { col: 28, row: 8, terrain: 'tree' },
      { col: 24, row: 5, terrain: 'tree' },
      { col: 26, row: 2, terrain: 'tree' },
      { col: 3, row: 0, terrain: 'water' },
      { col: 18, row: 9, terrain: 'water' },
      { col: 5, row: 7, terrain: 'water' }
    ],
    paths: [
      p(31,3, ['L',8],['D',2],['L',10],['U',1],['L',13]),
      p(31,7, ['L',10],['U',2],['L',12],['D',1],['L',9]),
      p(18,0, ['D',5],['L',18]),
    ],
  },
  ch11: {
    id: "ch11", cols: 32, rows: 12,
    base: { x: 0, y: 7 }, backgroundId: "ch11", actives: ACTIVES,
    blocked: [
      { col: 2, row: 4, terrain: 'rock' },
      { col: 2, row: 0, terrain: 'rock' },
      { col: 8, row: 8, terrain: 'rock' },
      { col: 19, row: 4, terrain: 'rock' },
      { col: 3, row: 1, terrain: 'rock' },
      { col: 25, row: 9, terrain: 'rock' },
      { col: 20, row: 6, terrain: 'tree' },
      { col: 20, row: 3, terrain: 'tree' },
      { col: 27, row: 0, terrain: 'tree' },
      { col: 8, row: 10, terrain: 'water' },
      { col: 25, row: 7, terrain: 'water' },
      { col: 17, row: 5, terrain: 'water' }
    ],
    paths: [
      p(31,5, ['L',8],['D',2],['L',10],['U',1],['L',13]),
      p(31,9, ['L',10],['U',2],['L',12],['D',1],['L',9]),
      p(18,0, ['D',7],['L',18]),
    ],
  },
  ch12: {
    id: "ch12", cols: 32, rows: 12,
    base: { x: 0, y: 6 }, backgroundId: "ch12", actives: ACTIVES,
    blocked: [
      { col: 3, row: 1, terrain: 'rock' },
      { col: 7, row: 9, terrain: 'rock' },
      { col: 16, row: 5, terrain: 'rock' },
      { col: 31, row: 1, terrain: 'rock' },
      { col: 19, row: 10, terrain: 'rock' },
      { col: 12, row: 7, terrain: 'rock' },
      { col: 11, row: 4, terrain: 'tree' },
      { col: 16, row: 1, terrain: 'tree' },
      { col: 27, row: 10, terrain: 'tree' },
      { col: 10, row: 8, terrain: 'water' },
      { col: 0, row: 6, terrain: 'water' },
      { col: 27, row: 3, terrain: 'water' }
    ],
    paths: [
      p(31,4, ['L',8],['D',2],['L',10],['U',1],['L',13]),
      p(31,8, ['L',10],['U',2],['L',12],['D',1],['L',9]),
      p(18,0, ['D',6],['L',18]),
    ],
  },
  ch13: {
    id: "ch13", cols: 32, rows: 12,
    base: { x: 0, y: 5 }, backgroundId: "ch13", actives: ACTIVES,
    blocked: [
      { col: 4, row: 10, terrain: 'rock' },
      { col: 11, row: 6, terrain: 'rock' },
      { col: 24, row: 2, terrain: 'rock' },
      { col: 11, row: 11, terrain: 'rock' },
      { col: 2, row: 8, terrain: 'rock' },
      { col: 31, row: 4, terrain: 'rock' },
      { col: 2, row: 2, terrain: 'tree' },
      { col: 12, row: 11, terrain: 'tree' },
      { col: 25, row: 8, terrain: 'tree' },
      { col: 13, row: 6, terrain: 'water' },
      { col: 6, row: 4, terrain: 'water' },
      { col: 6, row: 2, terrain: 'water' }
    ],
    paths: [
      p(31,3, ['L',8],['D',2],['L',10],['U',1],['L',13]),
      p(31,7, ['L',10],['U',2],['L',12],['D',1],['L',9]),
      p(18,0, ['D',5],['L',18]),
    ],
  },
  ch14: {
    id: "ch14", cols: 32, rows: 12,
    base: { x: 0, y: 7 }, backgroundId: "ch14", actives: ACTIVES,
    blocked: [
      { col: 5, row: 7, terrain: 'rock' },
      { col: 16, row: 3, terrain: 'rock' },
      { col: 1, row: 0, terrain: 'rock' },
      { col: 24, row: 8, terrain: 'rock' },
      { col: 19, row: 5, terrain: 'rock' },
      { col: 20, row: 2, terrain: 'rock' },
      { col: 27, row: 11, terrain: 'tree' },
      { col: 8, row: 9, terrain: 'tree' },
      { col: 25, row: 6, terrain: 'tree' },
      { col: 17, row: 4, terrain: 'water' },
      { col: 14, row: 2, terrain: 'water' },
      { col: 19, row: 0, terrain: 'water' }
    ],
    paths: [
      p(31,5, ['L',8],['D',2],['L',10],['U',1],['L',13]),
      p(31,9, ['L',10],['U',2],['L',12],['D',1],['L',9]),
      p(18,0, ['D',7],['L',18]),
    ],
  },

// ===== TOP-BASE ch15-19 =====,
  ch15: {
    id: "ch15", cols: 32, rows: 12,
    base: { x: 15, y: 0 }, backgroundId: "ch15", actives: ACTIVES,
    blocked: [
      { col: 6, row: 4, terrain: 'rock' },
      { col: 21, row: 0, terrain: 'rock' },
      { col: 10, row: 9, terrain: 'rock' },
      { col: 4, row: 6, terrain: 'rock' },
      { col: 3, row: 3, terrain: 'rock' },
      { col: 8, row: 0, terrain: 'rock' },
      { col: 20, row: 9, terrain: 'tree' },
      { col: 4, row: 7, terrain: 'tree' },
      { col: 26, row: 4, terrain: 'tree' },
      { col: 21, row: 2, terrain: 'water' },
      { col: 24, row: 0, terrain: 'water' },
      { col: 31, row: 10, terrain: 'water' }
    ],
    paths: [
      p(12,11, ['U',4],['R',1],['U',4],['R',1],['U',3]),
      p(18,11, ['U',5],['L',1],['U',4],['L',1],['U',2]),
      p(0,5, ['R',4],['U',2],['R',5],['U',3],['R',6]),
    ],
  },
  ch16: {
    id: "ch16", cols: 32, rows: 12,
    base: { x: 16, y: 0 }, backgroundId: "ch16", actives: ACTIVES,
    blocked: [
      { col: 7, row: 1, terrain: 'rock' },
      { col: 26, row: 9, terrain: 'rock' },
      { col: 18, row: 6, terrain: 'rock' },
      { col: 16, row: 3, terrain: 'rock' },
      { col: 19, row: 0, terrain: 'rock' },
      { col: 29, row: 9, terrain: 'rock' },
      { col: 11, row: 7, terrain: 'tree' },
      { col: 31, row: 4, terrain: 'tree' },
      { col: 25, row: 2, terrain: 'tree' },
      { col: 25, row: 0, terrain: 'water' },
      { col: 31, row: 10, terrain: 'water' },
      { col: 9, row: 9, terrain: 'water' }
    ],
    paths: [
      p(13,11, ['U',4],['R',1],['U',4],['R',1],['U',3]),
      p(19,11, ['U',5],['L',1],['U',4],['L',1],['U',2]),
      p(0,5, ['R',5],['U',2],['R',5],['U',3],['R',6]),
    ],
  },
  ch17: {
    id: "ch17", cols: 32, rows: 12,
    base: { x: 14, y: 0 }, backgroundId: "ch17", actives: ACTIVES,
    blocked: [
      { col: 8, row: 10, terrain: 'rock' },
      { col: 30, row: 6, terrain: 'rock' },
      { col: 26, row: 3, terrain: 'rock' },
      { col: 28, row: 0, terrain: 'rock' },
      { col: 3, row: 10, terrain: 'rock' },
      { col: 16, row: 7, terrain: 'rock' },
      { col: 2, row: 5, terrain: 'tree' },
      { col: 26, row: 2, terrain: 'tree' },
      { col: 24, row: 0, terrain: 'tree' },
      { col: 29, row: 10, terrain: 'water' },
      { col: 5, row: 9, terrain: 'water' },
      { col: 21, row: 7, terrain: 'water' }
    ],
    paths: [
      p(11,11, ['U',3],['R',1],['U',4],['R',1],['U',4]),
      p(17,11, ['U',5],['L',1],['U',3],['L',1],['U',3]),
      p(0,5, ['R',4],['U',2],['R',4],['U',3],['R',6]),
    ],
  },
  ch18: {
    id: "ch18", cols: 32, rows: 12,
    base: { x: 16, y: 0 }, backgroundId: "ch18", actives: ACTIVES,
    blocked: [
      { col: 9, row: 7, terrain: 'rock' },
      { col: 3, row: 4, terrain: 'rock' },
      { col: 3, row: 1, terrain: 'rock' },
      { col: 9, row: 10, terrain: 'rock' },
      { col: 20, row: 7, terrain: 'rock' },
      { col: 4, row: 5, terrain: 'rock' },
      { col: 26, row: 2, terrain: 'tree' },
      { col: 22, row: 0, terrain: 'tree' },
      { col: 25, row: 10, terrain: 'tree' },
      { col: 0, row: 9, terrain: 'water' },
      { col: 13, row: 7, terrain: 'water' },
      { col: 0, row: 6, terrain: 'water' }
    ],
    paths: [
      p(13,11, ['U',4],['R',1],['U',4],['R',1],['U',3]),
      p(19,11, ['U',5],['L',1],['U',4],['L',1],['U',2]),
      p(0,5, ['R',5],['U',2],['R',5],['U',3],['R',6]),
    ],
  },
  ch19: {
    id: "ch19", cols: 32, rows: 12,
    base: { x: 15, y: 0 }, backgroundId: "ch19", actives: ACTIVES,
    blocked: [
      { col: 10, row: 4, terrain: 'rock' },
      { col: 8, row: 1, terrain: 'rock' },
      { col: 12, row: 10, terrain: 'rock' },
      { col: 21, row: 7, terrain: 'rock' },
      { col: 4, row: 5, terrain: 'rock' },
      { col: 24, row: 2, terrain: 'rock' },
      { col: 18, row: 0, terrain: 'tree' },
      { col: 19, row: 10, terrain: 'tree' },
      { col: 24, row: 8, terrain: 'tree' },
      { col: 3, row: 7, terrain: 'water' },
      { col: 21, row: 5, terrain: 'water' },
      { col: 12, row: 4, terrain: 'water' }
    ],
    paths: [
      p(12,11, ['U',4],['R',1],['U',4],['R',1],['U',3]),
      p(18,11, ['U',5],['L',1],['U',4],['L',1],['U',2]),
      p(0,5, ['R',4],['U',2],['R',5],['U',3],['R',6]),
    ],
  },

// ===== BOTTOM-BASE ch20-24 =====,
  ch20: {
    id: "ch20", cols: 32, rows: 12,
    base: { x: 15, y: 11 }, backgroundId: "ch20", actives: ACTIVES,
    blocked: [
      { col: 11, row: 1, terrain: 'rock' },
      { col: 13, row: 10, terrain: 'rock' },
      { col: 20, row: 7, terrain: 'rock' },
      { col: 1, row: 5, terrain: 'rock' },
      { col: 20, row: 2, terrain: 'rock' },
      { col: 12, row: 0, terrain: 'rock' },
      { col: 10, row: 10, terrain: 'tree' },
      { col: 14, row: 8, terrain: 'tree' },
      { col: 23, row: 6, terrain: 'tree' },
      { col: 7, row: 5, terrain: 'water' },
      { col: 28, row: 3, terrain: 'water' },
      { col: 24, row: 2, terrain: 'water' }
    ],
    paths: [
      p(12,0, ['D',4],['R',1],['D',4],['R',1],['D',3]),
      p(18,0, ['D',5],['L',1],['D',4],['L',1],['D',2]),
      p(0,5, ['R',4],['D',3],['R',5],['D',3],['R',6]),
    ],
  },
  ch21: {
    id: "ch21", cols: 32, rows: 12,
    base: { x: 16, y: 11 }, backgroundId: "ch21", actives: ACTIVES,
    blocked: [
      { col: 12, row: 10, terrain: 'rock' },
      { col: 17, row: 7, terrain: 'rock' },
      { col: 28, row: 4, terrain: 'rock' },
      { col: 13, row: 2, terrain: 'rock' },
      { col: 4, row: 0, terrain: 'rock' },
      { col: 0, row: 10, terrain: 'rock' },
      { col: 2, row: 8, terrain: 'tree' },
      { col: 9, row: 6, terrain: 'tree' },
      { col: 22, row: 4, terrain: 'tree' },
      { col: 10, row: 3, terrain: 'water' },
      { col: 3, row: 2, terrain: 'water' },
      { col: 3, row: 1, terrain: 'water' }
    ],
    paths: [
      p(13,0, ['D',4],['R',1],['D',4],['R',1],['D',3]),
      p(19,0, ['D',5],['L',1],['D',4],['L',1],['D',2]),
      p(0,5, ['R',5],['D',3],['R',5],['D',3],['R',6]),
    ],
  },
  ch22: {
    id: "ch22", cols: 32, rows: 12,
    base: { x: 14, y: 11 }, backgroundId: "ch22", actives: ACTIVES,
    blocked: [
      { col: 13, row: 7, terrain: 'rock' },
      { col: 22, row: 4, terrain: 'rock' },
      { col: 5, row: 2, terrain: 'rock' },
      { col: 26, row: 11, terrain: 'rock' },
      { col: 20, row: 9, terrain: 'rock' },
      { col: 20, row: 7, terrain: 'rock' },
      { col: 25, row: 5, terrain: 'tree' },
      { col: 4, row: 4, terrain: 'tree' },
      { col: 22, row: 2, terrain: 'tree' },
      { col: 13, row: 1, terrain: 'water' },
      { col: 11, row: 0, terrain: 'water' },
      { col: 14, row: 11, terrain: 'water' }
    ],
    paths: [
      p(11,0, ['D',3],['R',1],['D',4],['R',1],['D',4]),
      p(17,0, ['D',5],['L',1],['D',3],['L',1],['D',3]),
      p(0,5, ['R',4],['D',3],['R',4],['D',3],['R',6]),
    ],
  },
  ch23: {
    id: "ch23", cols: 32, rows: 12,
    base: { x: 16, y: 11 }, backgroundId: "ch23", actives: ACTIVES,
    blocked: [
      { col: 14, row: 4, terrain: 'rock' },
      { col: 27, row: 1, terrain: 'rock' },
      { col: 14, row: 11, terrain: 'rock' },
      { col: 6, row: 9, terrain: 'rock' },
      { col: 4, row: 7, terrain: 'rock' },
      { col: 8, row: 5, terrain: 'rock' },
      { col: 17, row: 3, terrain: 'tree' },
      { col: 1, row: 2, terrain: 'tree' },
      { col: 22, row: 0, terrain: 'tree' },
      { col: 18, row: 11, terrain: 'water' },
      { col: 18, row: 10, terrain: 'water' },
      { col: 25, row: 9, terrain: 'water' }
    ],
    paths: [
      p(13,0, ['D',4],['R',1],['D',4],['R',1],['D',3]),
      p(19,0, ['D',5],['L',1],['D',4],['L',1],['D',2]),
      p(0,5, ['R',5],['D',3],['R',5],['D',3],['R',6]),
    ],
  },
  ch24: {
    id: "ch24", cols: 32, rows: 12,
    base: { x: 15, y: 11 }, backgroundId: "ch24", actives: ACTIVES,
    blocked: [
      { col: 15, row: 1, terrain: 'rock' },
      { col: 0, row: 11, terrain: 'rock' },
      { col: 22, row: 8, terrain: 'rock' },
      { col: 18, row: 6, terrain: 'rock' },
      { col: 20, row: 4, terrain: 'rock' },
      { col: 28, row: 2, terrain: 'rock' },
      { col: 9, row: 1, terrain: 'tree' },
      { col: 29, row: 11, terrain: 'tree' },
      { col: 21, row: 10, terrain: 'tree' },
      { col: 20, row: 9, terrain: 'water' },
      { col: 25, row: 8, terrain: 'water' },
      { col: 3, row: 8, terrain: 'water' }
    ],
    paths: [
      p(12,0, ['D',4],['R',1],['D',4],['R',1],['D',3]),
      p(18,0, ['D',5],['L',1],['D',4],['L',1],['D',2]),
      p(0,5, ['R',4],['D',3],['R',5],['D',3],['R',6]),
    ],
  },

// ===== CENTER-BASE ch25-30 =====,
  ch25: {
    id: "ch25", cols: 32, rows: 12,
    base: { x: 15, y: 6 }, backgroundId: "ch25", actives: ACTIVES,
    blocked: [
      { col: 16, row: 10, terrain: 'rock' },
      { col: 4, row: 8, terrain: 'rock' },
      { col: 30, row: 5, terrain: 'rock' },
      { col: 30, row: 3, terrain: 'rock' },
      { col: 4, row: 2, terrain: 'rock' },
      { col: 16, row: 0, terrain: 'rock' },
      { col: 2, row: 11, terrain: 'tree' },
      { col: 24, row: 9, terrain: 'tree' },
      { col: 21, row: 8, terrain: 'tree' },
      { col: 23, row: 7, terrain: 'water' },
      { col: 0, row: 7, terrain: 'water' },
      { col: 15, row: 6, terrain: 'water' }
    ],
    paths: [
      p(0,5, ['R',4],['D',2],['R',5],['U',1],['R',6]),
      p(31,7, ['L',5],['U',2],['L',5],['D',1],['L',6]),
      p(15,0, ['D',2],['R',3],['D',2],['L',3],['D',2]),
    ],
  },
  ch26: {
    id: "ch26", cols: 32, rows: 12,
    base: { x: 15, y: 6 }, backgroundId: "ch26", actives: ACTIVES,
    blocked: [
      { col: 17, row: 7, terrain: 'rock' },
      { col: 9, row: 5, terrain: 'rock' },
      { col: 7, row: 3, terrain: 'rock' },
      { col: 11, row: 1, terrain: 'rock' },
      { col: 21, row: 11, terrain: 'rock' },
      { col: 4, row: 10, terrain: 'rock' },
      { col: 25, row: 8, terrain: 'tree' },
      { col: 20, row: 7, terrain: 'tree' },
      { col: 20, row: 6, terrain: 'tree' },
      { col: 27, row: 5, terrain: 'water' },
      { col: 7, row: 5, terrain: 'water' },
      { col: 26, row: 4, terrain: 'water' }
    ],
    paths: [
      p(0,5, ['R',5],['D',2],['R',5],['U',1],['R',5]),
      p(31,7, ['L',6],['U',2],['L',5],['D',1],['L',5]),
      p(15,0, ['D',2],['R',2],['D',2],['L',2],['D',2]),
    ],
  },
  ch27: {
    id: "ch27", cols: 32, rows: 12,
    base: { x: 15, y: 6 }, backgroundId: "ch27", actives: ACTIVES,
    blocked: [
      { col: 18, row: 4, terrain: 'rock' },
      { col: 14, row: 2, terrain: 'rock' },
      { col: 16, row: 0, terrain: 'rock' },
      { col: 24, row: 10, terrain: 'rock' },
      { col: 5, row: 9, terrain: 'rock' },
      { col: 24, row: 7, terrain: 'rock' },
      { col: 17, row: 6, terrain: 'tree' },
      { col: 16, row: 5, terrain: 'tree' },
      { col: 21, row: 4, terrain: 'tree' },
      { col: 31, row: 3, terrain: 'water' },
      { col: 16, row: 3, terrain: 'water' },
      { col: 7, row: 3, terrain: 'water' }
    ],
    paths: [
      p(0,5, ['R',4],['D',2],['R',6],['U',1],['R',5]),
      p(31,7, ['L',5],['U',2],['L',6],['D',1],['L',5]),
      p(15,0, ['D',3],['R',3],['D',1],['L',3],['D',2]),
    ],
  },
  ch28: {
    id: "ch28", cols: 32, rows: 12,
    base: { x: 15, y: 6 }, backgroundId: "ch28", actives: ACTIVES,
    blocked: [
      { col: 19, row: 1, terrain: 'rock' },
      { col: 19, row: 11, terrain: 'rock' },
      { col: 24, row: 9, terrain: 'rock' },
      { col: 3, row: 8, terrain: 'rock' },
      { col: 20, row: 6, terrain: 'rock' },
      { col: 11, row: 5, terrain: 'rock' },
      { col: 8, row: 4, terrain: 'tree' },
      { col: 11, row: 3, terrain: 'tree' },
      { col: 20, row: 2, terrain: 'tree' },
      { col: 3, row: 2, terrain: 'water' },
      { col: 24, row: 1, terrain: 'water' },
      { col: 18, row: 1, terrain: 'water' }
    ],
    paths: [
      p(0,5, ['R',5],['D',2],['R',4],['U',1],['R',6]),
      p(31,7, ['L',4],['U',2],['L',5],['D',1],['L',7]),
      p(15,0, ['D',2],['R',2],['D',2],['L',2],['D',2]),
    ],
  },
  ch29: {
    id: "ch29", cols: 32, rows: 12,
    base: { x: 15, y: 6 }, backgroundId: "ch29", actives: ACTIVES,
    blocked: [
      { col: 20, row: 10, terrain: 'rock' },
      { col: 23, row: 8, terrain: 'rock' },
      { col: 0, row: 7, terrain: 'rock' },
      { col: 15, row: 5, terrain: 'rock' },
      { col: 4, row: 4, terrain: 'rock' },
      { col: 31, row: 2, terrain: 'rock' },
      { col: 0, row: 2, terrain: 'tree' },
      { col: 7, row: 1, terrain: 'tree' },
      { col: 20, row: 0, terrain: 'tree' },
      { col: 7, row: 0, terrain: 'water' },
      { col: 0, row: 0, terrain: 'water' },
      { col: 31, row: 11, terrain: 'water' }
    ],
    paths: [
      p(0,5, ['R',6],['D',2],['R',4],['U',1],['R',5]),
      p(31,7, ['L',5],['U',2],['L',4],['D',1],['L',7]),
      p(15,0, ['D',3],['R',3],['D',2],['L',3],['D',1]),
    ],
  },
  ch30: {
    id: "ch30", cols: 32, rows: 12,
    base: { x: 15, y: 6 }, backgroundId: "ch30", actives: ACTIVES,
    blocked: [
      { col: 21, row: 7, terrain: 'rock' },
      { col: 28, row: 5, terrain: 'rock' },
      { col: 9, row: 4, terrain: 'rock' },
      { col: 28, row: 2, terrain: 'rock' },
      { col: 21, row: 1, terrain: 'rock' },
      { col: 20, row: 0, terrain: 'rock' },
      { col: 25, row: 11, terrain: 'tree' },
      { col: 3, row: 11, terrain: 'tree' },
      { col: 19, row: 10, terrain: 'tree' },
      { col: 9, row: 10, terrain: 'water' },
      { col: 5, row: 10, terrain: 'water' },
      { col: 8, row: 10, terrain: 'water' }
    ],
    paths: [
      p(0,5, ['R',4],['D',3],['R',4],['U',2],['R',7]),
      p(31,7, ['L',5],['U',3],['L',4],['D',2],['L',7]),
      p(15,0, ['D',2],['R',4],['D',1],['L',4],['D',3]),
    ],
  },
};
