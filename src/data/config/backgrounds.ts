import type { ChapterBackground } from '../../types';

export const BACKGROUNDS: Record<string, ChapterBackground> = {
  // ── 宗门篇 ch1-5：一个宗门，从妖狼到魔尊 ──

  // ch1·山门初劫：月夜，宗门大殿金光照耀山道
  ch1: {
    id: 'ch1', cellA: '#0d0d1e', cellB: '#1a1a30', pathColor: '#1a1510',
    pathGlow: '#d4a843', baseGlow: '#ffd700',
    ambient: { color: '#ffe4b5', count: 12 },
  },

  // ch2·万妖攻山：血月当空，大地震动
  ch2: {
    id: 'ch2', cellA: '#1a0808', cellB: '#2e1410', pathColor: '#3d1a14',
    pathGlow: '#c62828', baseGlow: '#ff6b35',
    ambient: { color: '#ff4444', count: 8 },
  },

  // ch3·魔修乱世：魔气弥漫，紫雾笼罩
  ch3: {
    id: 'ch3', cellA: '#12081e', cellB: '#1e1030', pathColor: '#2a1440',
    pathGlow: '#9c27b0', baseGlow: '#ce93d8',
    ambient: { color: '#bb86fc', count: 10 },
  },

  // ch4·秘境凶兽：迷雾森林，妖兽潜伏
  ch4: {
    id: 'ch4', cellA: '#0a140a', cellB: '#142614', pathColor: '#1a3018',
    pathGlow: '#66bb6a', baseGlow: '#a5d6a7',
    ambient: { color: '#a5d6a7', count: 14 },
  },

  // ch5·血煞魔尊：血色天幕，尸山血海
  ch5: {
    id: 'ch5', cellA: '#200404', cellB: '#340a0a', pathColor: '#450808',
    pathGlow: '#e53935', baseGlow: '#ff8a80',
    ambient: { color: '#ff1744', count: 6 },
  },

  // ── 域外篇 ch6-10：黄沙异族，裂隙主宰 ──

  // ch6·域外荒漠：黄沙漫天，烈日灼人
  ch6: {
    id: 'ch6', cellA: '#1e1a0e', cellB: '#2e2814', pathColor: '#403418',
    pathGlow: '#d4a017', baseGlow: '#ffb74d',
    ambient: { color: '#ffe082', count: 10 },
  },

  // ch7·风沙峡谷：风蚀岩壁，一线天光
  ch7: {
    id: 'ch7', cellA: '#0e1a18', cellB: '#1a2e28', pathColor: '#1e3528',
    pathGlow: '#26c6da', baseGlow: '#80deea',
  },

  // ch8·幽暗矿脉：矿洞幽深，灵脉金辉
  ch8: {
    id: 'ch8', cellA: '#1a140a', cellB: '#2e2412', pathColor: '#3a2c14',
    pathGlow: '#ff8f00', baseGlow: '#ffd54f',
    ambient: { color: '#ffe082', count: 6 },
  },

  // ch9·源初荒漠：风暴将至，紫云压顶
  ch9: {
    id: 'ch9', cellA: '#16161e', cellB: '#262638', pathColor: '#2e2a30',
    pathGlow: '#7e57c2', baseGlow: '#b39ddb',
    ambient: { color: '#b39ddb', count: 8 },
  },

  // ch10·裂隙主宰：熔岩裂谷，主宰苏醒
  ch10: {
    id: 'ch10', cellA: '#1e0e06', cellB: '#341e10', pathColor: '#451a08',
    pathGlow: '#ff6d00', baseGlow: '#ffab40',
    ambient: { color: '#ff6d00', count: 8 },
  },

  // ── 大陆联盟篇 ch11-15：整片大陆，魔域远征 ──

  // ch11·大陆联盟：九宗联手，青白旗帜
  ch11: {
    id: 'ch11', cellA: '#0e121e', cellB: '#1a2232', pathColor: '#1e2a35',
    pathGlow: '#42a5f5', baseGlow: '#90caf9',
  },

  // ch12·联盟要塞：钢铁壁垒，烽火连天
  ch12: {
    id: 'ch12', cellA: '#121216', cellB: '#22222a', pathColor: '#2e2e38',
    pathGlow: '#78909c', baseGlow: '#b0bec5',
  },

  // ch13·联盟密林：古木参天，暗绿深邃
  ch13: {
    id: 'ch13', cellA: '#08140a', cellB: '#122414', pathColor: '#1a301e',
    pathGlow: '#4caf50', baseGlow: '#a5d6a7',
  },

  // ch14·联盟边境：大漠残阳，琥珀色天
  ch14: {
    id: 'ch14', cellA: '#1e1a10', cellB: '#2e2a18', pathColor: '#3a3418',
    pathGlow: '#ffa726', baseGlow: '#ffcc80',
  },

  // ch15·联盟终章：赤铁战场，最后一战
  ch15: {
    id: 'ch15', cellA: '#1e0e0e', cellB: '#2e1e1e', pathColor: '#3d2420',
    pathGlow: '#d32f2f', baseGlow: '#ef9a9a',
  },

  // ── 百族大战篇 ch16-20：天下万族，龙鬼天妖 ──

  // ch16·百族大战：幽蓝战火，远古遗址
  ch16: {
    id: 'ch16', cellA: '#080e1e', cellB: '#121e32', pathColor: '#181e35',
    pathGlow: '#1e88e5', baseGlow: '#64b5f6',
    ambient: { color: '#64b5f6', count: 6 },
  },

  // ch17·百族深谷：鬼气森森，紫雾弥漫
  ch17: {
    id: 'ch17', cellA: '#120820', cellB: '#1e1030', pathColor: '#2a1840',
    pathGlow: '#6a1b9a', baseGlow: '#ce93d8',
    ambient: { color: '#ce93d8', count: 8 },
  },

  // ch18·百族荒原：焦土万里，赤地无生
  ch18: {
    id: 'ch18', cellA: '#1e160e', cellB: '#2e2418', pathColor: '#3a2a1a',
    pathGlow: '#8d6e63', baseGlow: '#bcaaa4',
  },

  // ch19·百族冰原：冰川雪原，寒气逼人
  ch19: {
    id: 'ch19', cellA: '#0e1420', cellB: '#1a2232', pathColor: '#1e2a3d',
    pathGlow: '#4fc3f7', baseGlow: '#b3e5fc',
    ambient: { color: '#ffffff', count: 10 },
  },

  // ch20·百族终章：天妖蛊王，紫黑毒瘴
  ch20: {
    id: 'ch20', cellA: '#0e0410', cellB: '#20101e', pathColor: '#2e1028',
    pathGlow: '#7b1fa2', baseGlow: '#e040fb',
    ambient: { color: '#e040fb', count: 6 },
  },

  // ── 界域之战篇 ch21-25：规则崩坏，天劫审判 ──

  // ch21·界域之战：虚空裂痕，天道崩碎
  ch21: {
    id: 'ch21', cellA: '#040612', cellB: '#0c0e1e', pathColor: '#141028',
    pathGlow: '#455a64', baseGlow: '#78909c',
  },

  // ch22·界域星海：星辰大海，无尽虚空
  ch22: {
    id: 'ch22', cellA: '#040818', cellB: '#0a1028', pathColor: '#101838',
    pathGlow: '#1565c0', baseGlow: '#42a5f5',
    ambient: { color: '#ffffff', count: 24 },
  },

  // ch23·界域裂谷：血红裂谷，深渊凝视
  ch23: {
    id: 'ch23', cellA: '#1a0806', cellB: '#2e1410', pathColor: '#3d1814',
    pathGlow: '#b71c1c', baseGlow: '#ef5350',
  },

  // ch24·界域天穹：天劫金光，圣洁审判
  ch24: {
    id: 'ch24', cellA: '#10101a', cellB: '#1e1e30', pathColor: '#2a2a3a',
    pathGlow: '#fff176', baseGlow: '#fff9c4',
    ambient: { color: '#fff9c4', count: 14 },
  },

  // ch25·界域终章：劫雷紫电，金紫交加
  ch25: {
    id: 'ch25', cellA: '#0e0418', cellB: '#1e1030', pathColor: '#2e1840',
    pathGlow: '#e040fb', baseGlow: '#ffd700',
    ambient: { color: '#e040fb', count: 10 },
  },

  // ── 飞升篇 ch26-30：混沌原初，道祖魔影 ──

  // ch26·飞升篇：晨曦初现，大道金光
  ch26: {
    id: 'ch26', cellA: '#14100a', cellB: '#241e12', pathColor: '#342c18',
    pathGlow: '#ff8f00', baseGlow: '#ffd54f',
  },

  // ch27·飞升天梯：纯白流光，规则碎片
  ch27: {
    id: 'ch27', cellA: '#0e0e18', cellB: '#1c1c2e', pathColor: '#262640',
    pathGlow: '#eeeeee', baseGlow: '#ffffff',
    ambient: { color: '#ffffff', count: 30 },
  },

  // ch28·飞升雷劫：紫电穿空，劫雷淬体
  ch28: {
    id: 'ch28', cellA: '#0e0210', cellB: '#1e081e', pathColor: '#2e0e30',
    pathGlow: '#aa00ff', baseGlow: '#ea80fc',
    ambient: { color: '#aa00ff', count: 12 },
  },

  // ch29·飞升仙界：七彩琉璃，仙气氤氲
  ch29: {
    id: 'ch29', cellA: '#0a0e16', cellB: '#141e30', pathColor: '#1a2038',
    pathGlow: '#64ffda', baseGlow: '#ffd700',
    ambient: { color: '#64ffda', count: 18 },
  },

  // ch30·飞升终章：混沌归元，道祖魔影
  ch30: {
    id: 'ch30', cellA: '#060606', cellB: '#161616', pathColor: '#222222',
    pathGlow: '#e0e0e0', baseGlow: '#ffab00',
  },
};

export const DEFAULT_BACKGROUND: ChapterBackground = {
  id: 'default', cellA: '#0d1120', cellB: '#141a2e', pathColor: '#2a1f12', pathGlow: '#4a6fa5', baseGlow: '#ffd700',
};
