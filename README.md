# 世界舆图 · TRPG 地图管理工具

> 面向 GM 的 TRPG **世界整理**工具（不是绘图工具）。
> 一张泛黄羊皮纸风格的无限画布，从左侧素材库拖拽黑白手绘素材，整理地点、地形、聚落、遗迹、事件关系与自由备注。

**视觉基调**：黑白手绘 + 微微泛黄的羊皮纸质感（详见 `进度文档.md` 的「设计基调」）。

## 技术栈

Vite · React · TypeScript · react-konva（画布）· Zustand（状态）· IndexedDB / idb（本地存储）· react-router-dom

## 快速开始

```bash
npm install      # 安装依赖
npm run dev      # 本地开发，自动打开 http://localhost:5173
npm run build    # 类型检查 + 生产构建到 dist/
npm run preview  # 预览构建产物
```

> 要求 Node ≥ 18。字体经 Google Fonts 在线加载，内测请保持联网。

## 目录结构

```
src/
  main.tsx / App.tsx        # 入口与路由（首页 ↔ 编辑器）+ 全局手绘 SVG 滤镜
  routes/
    HomePage.tsx            # 世界管理首页
    EditorPage.tsx          # 编辑器（顶栏 / 左素材库 / 中画布 / 右属性面板）
  canvas/Canvas.tsx         # 羊皮纸无限画布（缩放 / 平移 / 网格）
  store/worldStore.ts       # 当前世界画布状态（Zustand）+ 防抖落库
  db/
    schema.ts               # IndexedDB 表结构与版本
    idb.ts                  # 建库 + worlds/worldData/assets CRUD
  types.ts                  # 领域模型
  styles/global.css         # 设计系统（配色 / 字体 / 纹理 / 动效）
```

## 当前进度

已完成 **阶段 0 ~ 2**：脚手架、世界管理首页（IndexedDB 持久化）、羊皮纸画布（缩放/平移，刷新保留视图）。
完整路线与细节见 [`进度文档.md`](./进度文档.md) 与 [`开发计划.md`](./开发计划.md)。

## 数据存储

全部数据存浏览器 **IndexedDB**（库名 `trpg-maptool`），不上传服务器。清除浏览器数据会清空世界；导入/导出 JSON 存档功能见阶段 6。
