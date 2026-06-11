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

## 功能一览（阶段 0 ~ 7 全部完成）

- **世界管理**：创建 / 删除 / 进入世界；导入、导出单 JSON 存档。数据全部存浏览器 IndexedDB，刷新不丢。
- **羊皮纸无限画布**：滚轮缩放（锚定鼠标）、拖拽平移、世界网格。
- **素材与节点**：11 类内置黑白手绘素材 + 自上传素材（PNG/JPG/WEBP/SVG，可重命名/删除）；拖入画布成节点，移动 / 缩放 / 旋转 / 复制 / 删除 / 调层级。
- **属性**：每个节点可填名称、描述，并自定义任意属性行（文本 / 多行 / 复选 / 下拉 / 数字 / 星级 / 进度格）。
- **连线**：节点间建立关系连线，带名称 / 类型 / 描述，节点移动时连线跟随。
- **文本备注**：在画布任意处放置自由文本框，双击编辑，可调字号与背景。

## 编辑器操作

| 工具 | 作用 |
| --- | --- |
| 选择 | 点选 / 拖动 / 缩放节点、文本；空白拖拽平移 |
| 漫游 | 任意处拖拽平移画布 |
| 连线 | 依次点选两个节点建立连线 |
| 文本 | 在空白处点击放置文本备注 |
| 导出 | 下载当前世界为 `*.world.json` |

**快捷键**：`Delete` 删除选中 · `Ctrl/⌘+C` / `Ctrl/⌘+V` 复制粘贴 · `Ctrl/⌘+D` 复制 · `Esc` 退出当前模式。

完整阶段细节见 [`进度文档.md`](./进度文档.md) 与 [`开发计划.md`](./开发计划.md)。

## 截图核对（可选，开发用）

```bash
npx playwright install chromium   # 首次
npm run dev                       # 另开终端
node scripts/shot.mjs             # 跑全流程并输出到 screenshots/
```

## 数据存储

全部数据存浏览器 **IndexedDB**（库名 `trpg-maptool`），不上传服务器。清除浏览器数据会清空世界；导入/导出 JSON 存档功能见阶段 6。
