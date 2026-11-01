# 途记 TravelJournal（CHINA FOOTPRINT）

把走过的路 变成自己的故事。

一个面向微信生态的旅行日记小程序，配套 NestJS 后端与 Vue3 后台管理系统。核心载体是交互式中国足迹地图，用户可按旅程建立多本旅行册，每本包含封面、行程起止时间、地图标注点、图文游记与多人协同旅行账本。

## 项目结构

```
TravelJournal/
├── miniapp/   # uniapp + Vue3 + TypeScript 微信小程序
├── backend/   # NestJS + Prisma + MySQL + Redis 后端 API
└── admin/     # Vue3 + TypeScript + Element Plus 后台管理系统
```

## 技术栈

| 端 | 技术 |
| --- | --- |
| 小程序前端 | uniapp + Vue3 + TypeScript + Pinia |
| 后端 | NestJS + TypeScript + Prisma + MySQL + Redis + JWT |
| 后台管理 | Vue3 + TypeScript + Element Plus + Vite |

## 快速开始

### 1. 小程序前端（miniapp）

```bash
cd miniapp
npm install
npm run dev:mp-weixin   # 编译到微信开发者工具
# 或 npm run dev:h5      # 浏览器预览
```

前端默认使用内置 mock 数据（`src/mock/`），可独立预览全部 14 个页面；联调后端时将 `src/stores/app.ts` 中的 `useMock` 置为 `false` 并配置 `.env` 中的 `VITE_API_BASE`。

### 2. 后端（backend）

```bash
cd backend
npm install
cp .env.example .env   # 配置数据库连接、JWT 密钥等
npx prisma migrate dev # 初始化数据库
npm run start:dev
```

接口统一前缀 `/api`，健康检查 `/api/health`、就绪检查 `/api/health/ready`。

### 3. 后台管理（admin）

```bash
cd admin
npm install
npm run dev             # http://localhost:5173
```

## 核心功能

- **足迹地图**：中国地图可视化，城市点位（已到访绿 / 规划中橙）
- **旅行册**：多本旅行册、卡片列表、新建（封面/名称/起止时间/公开/邀请）、详情统计
- **游记**：新增/编辑/删除/查看，日期、天气、地点、正文（2000 字）、多图，公开/私密权限
- **标注点**：已到访/规划中两种状态、关联游记
- **账本**：收支结余、记一笔、账单分类（6 类）、周/月/年统计、人均支出
- **好友协同**：邀请码加入、成员角色（创建者/管理员/成员）
- **后台管理**：登录、数据看板、用户/旅行册/游记/账本管理、系统设置、操作日志

## 权限模型

- **旅行册级**（`bookIsPublic`）：控制点位是否对外可见
- **游记级**（`isPublic`）：控制游记是否对册子成员可见

两层权限相互独立：作者本人可见全部游记（含私密），册子其他成员仅见公开游记，陌生人即使看到公开册子点位也看不到游记内容。

## 字段对齐

字段严格对齐《途记 TravelJournal - UI 设计图.pdf》（23 页）与开发文档 V1.4。
