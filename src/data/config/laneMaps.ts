import type { LaneConfig, GridPoint } from '../../types';

// 车道防守异变关地图（v0.89 Phase 1，PvZ 式）：等长横向车道，敌人从右侧压入，守左端宗门。
// 五个异变关复用同一张车道骨架（列数按章节 tiers 递增压迫感），mechanic 参数见 LANE_LEVELS。

export interface LaneMapSpec {
  cols: number;
  rows: number;
  laneRows: number[];       // 车道行号（即活跃路径行）
  paths: GridPoint[][];     // 等长直线车道（敌从右 x=cols-1 进入，向左推进）
  base: GridPoint;          // 宗门在左端
  lane: LaneConfig;
}

/** 由车道行生成车道地图：paths[i][0] = 敌人出生点（右端），末端 = 宗门（左端） */
export function makeLaneMap(cols: number, rows: number, laneRows: number[], sweepCol: number, pickup: LaneConfig['pickup']): LaneMapSpec {
  const paths = laneRows.map((y) => [{ x: cols - 1, y }, { x: 0, y }]);
  return {
    cols, rows,
    laneRows,
    paths,
    base: { x: 0, y: laneRows[Math.floor(laneRows.length / 2)] },
    lane: { sweepCol, pickup },
  };
}

// 五个异变关的地图参数：章节越后车道越多/拾取越密
// ch5-l2  3 道（教学）；ch10/15-l2 4 道；ch20/25-l2 5 道
// sweepCol=1：横扫符在路线末端（宗门前最后一格），PvZ 式"最后防线"——
// 敌人几乎走完全程才触发，塔有最长时间输出，符只兜真正的漏怪
export const LANE_MAPS: Record<string, LaneMapSpec> = {
  'ch5-l2': makeLaneMap(20, 10, [1, 5, 8], 1, { value: 8, intervalSec: 7, maxPerWave: 4 }),
  'ch10-l2': makeLaneMap(20, 10, [1, 4, 6, 9], 1, { value: 10, intervalSec: 6.5, maxPerWave: 5 }),
  'ch15-l2': makeLaneMap(22, 10, [1, 4, 6, 9], 1, { value: 12, intervalSec: 6, maxPerWave: 5 }),
  'ch20-l2': makeLaneMap(22, 12, [1, 4, 7, 10], 1, { value: 14, intervalSec: 6, maxPerWave: 6 }),
  'ch25-l2': makeLaneMap(24, 12, [1, 4, 6, 9, 11], 1, { value: 16, intervalSec: 5.5, maxPerWave: 6 }),
};
