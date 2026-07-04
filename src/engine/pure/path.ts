// 路径几何的纯函数（设计文档 §5.1 速度单位 / 路径插值）
// 坐标约定：waypoints 是"格坐标"(col,row)，转换为格中心 (col+0.5, row+0.5)。

export interface Point { x: number; y: number; }
export interface Segment { x1: number; y1: number; x2: number; y2: number; len: number; }

type Waypoint = Readonly<Point>;

/** 由格坐标路点序列构造正交折线段（格中心坐标） */
export function buildSegments(waypoints: ReadonlyArray<Waypoint>): Segment[] {
  const segs: Segment[] = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i], b = waypoints[i + 1];
    const x1 = a.x + 0.5, y1 = a.y + 0.5, x2 = b.x + 0.5, y2 = b.y + 0.5;
    segs.push({ x1, y1, x2, y2, len: Math.hypot(x2 - x1, y2 - y1) });
  }
  return segs;
}

/** 路径总长度 */
export function totalLength(segs: ReadonlyArray<Segment>): number {
  return segs.reduce((sum, s) => sum + s.len, 0);
}

/** 沿路径走 dist 距离后的坐标；dist 超出总长则钳制到终点 */
export function positionAt(segs: ReadonlyArray<Segment>, dist: number): Point {
  let d = Math.max(0, dist);
  for (const s of segs) {
    if (d <= s.len) {
      const t = s.len === 0 ? 0 : d / s.len;
      return { x: s.x1 + (s.x2 - s.x1) * t, y: s.y1 + (s.y2 - s.y1) * t };
    }
    d -= s.len;
  }
  const last = segs[segs.length - 1];
  return last ? { x: last.x2, y: last.y2 } : { x: 0, y: 0 };
}
