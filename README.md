# 仙侠塔防

一款文字 + 简易网格的仙侠塔防网页游戏。你是宗门护阵长老，布修士、设阵法，抵御五章节的妖潮魔劫。

纯前端（TypeScript + Vite + Canvas + Web Audio），**单机可玩、预留联网接口**，无后端依赖。

---

## 特色

- **15 关 / 5 章剧情**：从山门初劫到血煞魔尊，路径形态递进（单/L/U/双/三路径）
- **6 种塔 × 5 境界**：飞剑、符箓、长枪、聚灵阵、火法（溅射）、雷法（链电），4 种攻击行为
- **14 种敌人 × 9 种机制**：飞行 / 护盾 / 受击回血 / 高甲 / 撞塔 / 隐身 / 分裂 / BOSS 魅惑召唤 / 多阶段狂暴
- **完整 meta 养成**：法宝 / 天命阶（VIP）/ 天赋树 / 皮肤 / 充值，三货币闭环
- **弹出式剧情** + **程序合成背景乐/音效**（Web Audio，无需音频文件）
- **确定性引擎**（固定步长 + 种子化 PRNG），为联网重放校验铺路

---

## 快速开始

```bash
npm install
npm run dev      # 开发服务器 http://localhost:5173（自动开浏览器）
```

环境要求：**Node 18+**（已在 Node 24 验证）。

首次进入：选关界面 → 点关卡 → 开场剧情 → 「领命布阵」→ 布防 → 自动开波。

---

## 构建与部署

```bash
npm run build     # 类型检查 + 生产构建，输出到 dist/
npm run preview   # 本地预览生产构建
```

`dist/` 是纯静态产物（`index.html` + 一个 JS bundle），**可直接丢到任意静态托管**：
- Vercel / Netlify / Cloudflare Pages：连仓库后框架选 Vite，或直接上传 `dist/`
- GitHub Pages：把 `dist/` 内容推到 `gh-pages` 分支
- Nginx / 本地：把 `dist/` 当静态根目录即可（无路由，无需 server 配置）

无需 SSR、无需数据库、无需环境变量。

---

## 玩法

| 操作 | 效果 |
|---|---|
| 下方塔按钮 | 选择要建造的塔（灵石不足会置灰） |
| 左键空地 | 建造当前选中塔 |
| 左键己方塔 | 弹出操作面板（升级 / 出售 / 切换目标 AI） |
| 右键己方塔 | 快捷出售 |
| 顶部 ⏸/1×/2× | 暂停 / 正常 / 加速 |
| 顶部「立即迎敌」 | 跳过波次倒计时 |
| 选关界面「修炼」 | 法宝阁 / 天命阶 / 天赋 / 皮肤 / 充值 |

**目标循环**：通关赚贡献 → 升天赋/买法宝（永久变强）→ 冲三星。充值仙玉 → 晋升天命阶 / 买皮肤。波次自动来袭，倒计时归零开始，血量归零失败。

---

## 项目结构

```
src/
├── types.ts                 # 全部配置 schema
├── main.ts                  # 入口控制器：棋盘/HUD/塔栏/塔面板/输入/主循环
├── app/
│   ├── state.ts             # 共享状态 + 持久服务 + Modifier 合成
│   └── screens.ts           # 覆盖层：选关/剧情/修炼界面/关卡流程
├── engine/
│   ├── Game.ts              # 引擎核心（主循环/多路径/战斗/波次/经济/BOSS）
│   ├── WaveDirector.ts      # 波次调度
│   ├── PRNG.ts              # 种子化随机
│   ├── combat/
│   │   └── AttackStrategies.ts   # 攻击策略注册表（projectile/pierce/aoe/chain）
│   └── pure/                # 纯函数（可单测）：战斗/路径/经济/波次/目标
├── data/
│   ├── Modifier.ts          # 加成管线（装备+VIP+天赋 统一封顶）
│   ├── Registry.ts          # 按 id 查配置
│   └── config/              # 策划改数值的总入口（塔/敌人/关卡/法宝/天命/天赋/皮肤）
├── repo/
│   ├── progress.ts          # SaveRepo + 进度/装备/天赋纯函数
│   └── iap.ts               # IAPRepo（充值，本地 mock / 联网换 Remote）
├── audio/
│   └── AudioManager.ts      # Web Audio 合成背景乐 + 音效
└── ui/
    └── Board.ts             # Canvas 渲染 + 输入
```

**分层**：引擎（纯逻辑，无 DOM）↔ 数据（配置 + Modifier）↔ UI（DOM/Canvas）↔ 仓储（接口，本地/远程可换）。加内容只动 `data/config/`，加机制走 `behavior/ability` 注册表。

设计文档见根目录：[设计文档.md](设计文档.md)、[关卡剧情设计.md](关卡剧情设计.md)、[装备与皮肤设计.md](装备与皮肤设计.md)。

---

## 技术栈

- **TypeScript**（strict）+ **Vite**（dev/build）
- **Canvas 2D**（棋盘渲染）
- **Web Audio API**（合成音乐音效，无音频文件）
- **localStorage**（存档）
- **Vitest**（单元测试）

---

## 测试

```bash
npm test         # 跑全部单测
npm run typecheck
```

共 **60+ 个单元测试**，覆盖：战斗结算（护甲/护盾/回血/暴击）、路径几何、波次队列、目标选择、攻击策略（projectile/pierce/aoe/chain）、Modifier 封顶与跨 stat 合并、BOSS 狂暴、经济、星级、解锁逻辑。

---

## 扩展指南

| 想加什么 | 怎么做 |
|---|---|
| 新关卡 | `src/data/config/levels/` 加一个 `chX-lY.ts`，在 `index.ts` 的 `LEVELS` + `MANIFEST` 各加一行 |
| 新塔（数值） | `towers.ts` 加一条，复用已有 `behavior` |
| 新塔（新攻击机制） | `AttackStrategies.ts` 加策略类 + 注册（OCP，不改 Game） |
| 新敌人（新能力） | `enemies.ts` 加条目；新机制在 `Game.ts` 接 `ability` 钩子 |
| 新装备/天赋/皮肤 | `equipment.ts` / `talents.ts` / `skins.ts` 各加一条 |
| 联网 | `repo/` 加 `RemoteSaveRepo` / `RemoteIAPRepo`，启动时注入即可，引擎不动 |

---

## 已知限制 / 后续

- 充值为 **mock**（本地直接发仙玉）；联网后接真实支付 + 服务端校验（设计文档 §11.2）
- 存档在 localStorage（单机）；联网后换云端 SaveRepo
- 配置仍为 TS（类型安全）；需要策划无代码编辑时可迁移为 JSON + ConfigLoader
- 数值平衡以"可玩"为目标，欢迎反馈调整
