import type { GridPoint } from '../../../types';

/** 多条路径上经过的所有格子（正交线段栅格化） */
function cellsOnPaths(paths: ReadonlyArray<ReadonlyArray<GridPoint>>): Set<string> {
  const set = new Set<string>();
  for (const waypoints of paths) {
    for (let i = 0; i < waypoints.length - 1; i++) {
      let ax = waypoints[i].x, ay = waypoints[i].y;
      const bx = waypoints[i + 1].x, by = waypoints[i + 1].y;
      const dx = Math.sign(bx - ax), dy = Math.sign(by - ay);
      set.add(`${ax},${ay}`);
      while (ax !== bx || ay !== by) { ax += dx; ay += dy; set.add(`${ax},${ay}`); }
    }
  }
  return set;
}

/** 由多条路点路径生成 buildable 网格：路径格不可建塔，其余可建 */
export function buildableFromPaths(cols: number, rows: number, paths: ReadonlyArray<ReadonlyArray<GridPoint>>): boolean[][] {
  const onPath = cellsOnPaths(paths);
  const grid: boolean[][] = [];
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) grid[r][c] = !onPath.has(`${c},${r}`);
  }
  return grid;
}
