# QB小工具 UI 设计规范

> 本规范定义了QB小工具系列的完整UI设计标准，包括按钮、色彩、布局、文字排版四大模块。遵循本规范可确保所有QB小工具保持一致的视觉风格和用户体验。

---

## 📦 模块概览

本设计规范包含以下CSS模块文件：
- `buttons.css` - 按钮样式
- `colors.css` - 色彩系统
- `layout.css` - 布局规范
- `typography.css` - 文字排版

**使用方式**：在HTML中按顺序引入所有CSS文件
```html
<link rel="stylesheet" href="colors.css">
<link rel="stylesheet" href="typography.css">
<link rel="stylesheet" href="layout.css">
<link rel="stylesheet" href="buttons.css">
```

---

## 🎨 一、色彩系统 (colors.css)

### 1.1 基础色板

| 颜色名称 | CSS变量 | 色值 | 用途 |
|---------|---------|------|------|
| NewBlue | `--qb-newblue` | #205AEF | 品牌主色 |
| Red | `--qb-red` | #F44837 | 警示/强调 |
| Orange | `--qb-orange` | #FF8A14 | 分数/评星 |
| Yellow | `--qb-yellow` | #FFC20D | 辅助色 |
| Gold | `--qb-gold` | #FBC56E | 金色/会员/等级 |
| Green | `--qb-green` | #0BB861 | 安全色 |
| Cyan | `--qb-cyan` | #0ACC9B | 辅助色 |
| Purple | `--qb-purple` | #7632FF | 辅助色 |
| Brown | `--qb-brown` | #78461A | 辅助色 |

### 1.2 文本 & 图标颜色

| 层级 | CSS变量 | 色值 | 用途 |
|------|---------|------|------|
| A1 | `--qb-text-a1` | #242424 | 主文本 |
| A2 | `--qb-text-a2` | #666666 | 次要文本 |
| A3 | `--qb-text-a3` | #8F8F8F | 辅助文本 |
| A4 | `--qb-text-a4` | #B3B3B3 | 占位文本 |

### 1.3 背景 & 框架颜色

| 名称 | CSS变量 | 色值 | 用途 |
|------|---------|------|------|
| BG_Grey | `--qb-bg-grey` | #F6F7FA | 浅灰色背景 |
| BG_White | `--qb-bg-white` | #FFFFFF | 卡片&列表背景 |
| BG_Frame | `--qb-bg-frame` | #F5F5F5 | 加载占位符 |
| BG_BlackT | `--qb-bg-blackt` | rgba(0,0,0,0.04) | 透明黑背景 |
| Mask | `--qb-mask` | rgba(0,0,0,0.40) | 弹窗蒙层 |

### 1.4 线条 & 描边颜色

| 名称 | CSS变量 | 色值 | 用途 |
|------|---------|------|------|
| Line | `--qb-line` | rgba(0,0,0,0.08) | 分割线 |
| Border | `--qb-border` | rgba(0,0,0,0.04) | 图标&封面描边 |

### 1.5 夜间模式

所有颜色都支持夜间模式，通过在body或容器上添加 `.dark-mode` 类即可切换。

**JavaScript切换示例**：
```javascript
// 切换夜间模式
document.body.classList.toggle('dark-mode');
```

### 1.6 常用工具类

```css
/* 文本颜色 */
.qb-text-a1          /* 主文本 */
.qb-text-a2          /* 次要文本 */
.qb-text-a3          /* 辅助文本 */
.qb-text-highlight   /* 高亮文本 (NewBlue) */
.qb-text-danger      /* 警示文本 (Red) */

/* 背景颜色 */
.qb-bg-white         /* 白色背景 */
.qb-bg-grey          /* 灰色背景 */
.qb-bg-newblue       /* 品牌色背景 */
```

---

## ✍️ 二、文字排版 (typography.css)

### 2.1 字体规范

- **主字体**：PingFang SC（苹方）
- **等宽字体**：SF Mono, Monaco, Consolas
- **字重**：Regular (400), Medium (500), Semibold (600)

### 2.2 文字层级系统

#### Bold 字重样式 (500)

| 类名 | 字号/行高 | 使用场景 |
|------|----------|---------|
| `.qb-heading1-bold` | 24px/32px | 大卡标题（12字以内） |
| `.qb-heading2-bold` | 20px/28px | 大卡标题（12字以上） |
| `.qb-heading3-bold` | 18px/24px | 大卡模块标题 |
| `.qb-body1-bold` | 16px/24px | 大卡聚合子标题、强化的小模块标题、tab选中态 |
| `.qb-body2-bold` | 14px/22px | 强化的正文信息 |
| `.qb-caption1-bold` | 12px/16px | 强化的辅助信息 |

#### Regular 字重样式 (400)

| 类名 | 字号/行高 | 使用场景 |
|------|----------|---------|
| `.qb-heading1` | 24px/32px | 短答案（14字以内） |
| `.qb-heading2` | 20px/28px | 短答案（14字以上）、普通结果标题 |
| `.qb-heading3` | 18px/24px | 普通标题 |
| `.qb-body1` | 16px/24px | 聚合子标题、长答案 |
| `.qb-body2` | 14px/22px | tab未选中、普通信息、摘要、来源、组件文字 |
| `.qb-caption1` | 12px/16px | 辅助信息、标签文字、小图标文字、列表文字 |
| `.qb-caption2` | 11px/15px | 标签文字 |
| `.qb-caption3` | 10px/14px | 小标签文字 |

### 2.3 常用工具类

```css
/* 字重 */
.qb-font-regular     /* 400 */
.qb-font-medium      /* 500 */
.qb-font-semibold    /* 600 */

/* 文本对齐 */
.qb-text-left
.qb-text-center
.qb-text-right

/* 文本溢出 */
.qb-truncate         /* 单行省略 */
.qb-line-clamp-2     /* 两行省略 */
.qb-line-clamp-3     /* 三行省略 */
```

---

## 📐 三、布局规范 (layout.css)

### 3.1 核心设计原则

- ✅ Body无内边距，两侧不留边距
- ✅ 透明背景 `background-color: transparent`
- ✅ `overflow: hidden` 隐藏溢出内容
- ✅ 容器宽度100%自适应
- ✅ 无固定高度，不使用fixed height和position

### 3.2 栅格系统

**12列栅格**，基于4px网格系统，无两侧边距

```html
<div class="qb-grid">
  <div class="qb-col-6">左侧 50%</div>
  <div class="qb-col-6">右侧 50%</div>
</div>
```

**响应式栅格**：
```css
.qb-col-mobile-12    /* 移动端全宽 */
.qb-col-tablet-6     /* 平板端半宽 */
.qb-col-desktop-4    /* 桌面端1/3宽 */
```

### 3.3 间距规范

基于4px网格系统的标准间距：

| 间距值 | 使用场景 |
|--------|---------|
| 4px | 头像与名称之间 |
| 6px | 标签与文字/标签之间（特殊） |
| 8px | 组件与组件之间 |
| 12px | 字段与字段、图片与文字、卡片四周边距 |
| 16px | 内容与内容之间 |
| 24px | 模块分段文本之间 |

**工具类**：
```css
/* Margin */
.qb-m-4, .qb-m-8, .qb-m-12, .qb-m-16, .qb-m-24
.qb-mt-*, .qb-mr-*, .qb-mb-*, .qb-ml-*
.qb-mx-*, .qb-my-*

/* Padding */
.qb-p-4, .qb-p-8, .qb-p-12, .qb-p-16, .qb-p-24
.qb-pt-*, .qb-pr-*, .qb-pb-*, .qb-pl-*
.qb-px-*, .qb-py-*

/* Gap (用于Flex/Grid) */
.qb-gap-4, .qb-gap-8, .qb-gap-12, .qb-gap-16, .qb-gap-24
```

### 3.4 模块间距

标准模块结构包含标题区域和内容区域：

```html
<div class="qb-module">
  <!-- 标题区域（可选） -->
  <div class="qb-module-header">
    <h2 class="qb-module-title">主标题</h2>
    <p class="qb-module-subtitle">副标题</p>
  </div>
  
  <!-- 内容区域 -->
  <div class="qb-module-content">
    <!-- 内容 -->
  </div>
</div>
```

**规范**：
- 主标题：24px字号，600字重，32px行高
- 副标题：14px字号，400字重，22px行高
- 主副标题间距：8px
- 标题与内容间距：12px
- 内容区域背景：#F8F8F8

### 3.5 响应式断点

```css
Mobile:  320px - 768px
Tablet:  768px - 1024px
Desktop: 1024px+
```

### 3.6 常用布局工具类

```css
/* Flex布局 */
.qb-flex
.qb-flex-row
.qb-flex-column
.qb-justify-start / center / end / between / around
.qb-align-start / center / end / stretch

/* Grid布局 */
.qb-grid
.qb-grid-cols-2 / 3 / 4

/* 卡片 */
.qb-card              /* 12px内边距，8px圆角 */
```

### 3.7 PostMessage通信

**高度自适应**：自动计算body高度并通知父页面
```javascript
function updateHeight() {
  const height = document.body.scrollHeight;
  window.parent.postMessage({
    type: 'qb-resize',
    height: height
  }, '*');
}
```

**Alert通信**：将alert信息传递给父页面
```javascript
function qbAlert(message, type = 'info') {
  window.parent.postMessage({
    type: 'qb-alert',
    message: message,
    alertType: type
  }, '*');
}
```

---

## 🔘 四、按钮样式 (buttons.css)

### 4.1 按钮尺寸规范

| 尺寸 | 高度 | 字号 | 圆角 | 水平内边距 |
|------|------|------|------|-----------|
| XL | 40px | 14px | 8px | 24px |
| L | 32px | 14px | 8px | 20px |
| M | 28px | 12px | 8px | 16px |
| S | 24px | 12px | 6px | 12px |

### 4.2 按钮类型

#### 一级按钮 (Primary)
- 背景色：NewBlue (#205AEF)
- 文字色：白色
- 用途：主要操作

#### 二级按钮 (Secondary)
- 背景色：透明
- 边框：1px NewBlue
- 文字色：NewBlue
- 用途：次要操作

#### 三级按钮 (Tertiary)
- 背景色：灰色 (#F5F5F5)
- 文字色：主文本色
- 用途：辅助操作

#### 反白按钮 (White)
- 背景色：白色
- 边框：1px rgba(0,0,0,0.08)
- 文字色：主文本色
- 用途：深色背景上的按钮

#### 进度按钮 (Progress)
- 带进度条效果
- 用途：显示操作进度

### 4.3 按钮状态

| 状态 | 样式变化 |
|------|---------|
| 默认 (Default) | 正常显示 |
| 悬停 (Hover) | opacity: 0.60 |
| 点击 (Pressed) | opacity: 0.60 |
| 禁用 (Disabled) | opacity: 0.30, cursor: not-allowed |

### 4.4 使用示例

```html
<!-- XL尺寸一级按钮 -->
<button class="qb-btn qb-btn-xl qb-btn-primary">确认</button>

<!-- L尺寸二级按钮 -->
<button class="qb-btn qb-btn-l qb-btn-secondary">取消</button>

<!-- M尺寸三级按钮 -->
<button class="qb-btn qb-btn-m qb-btn-tertiary">更多</button>

<!-- S尺寸反白按钮 -->
<button class="qb-btn qb-btn-s qb-btn-white">关闭</button>

<!-- 禁用状态 -->
<button class="qb-btn qb-btn-l qb-btn-primary" disabled>已禁用</button>

<!-- 全宽按钮 -->
<button class="qb-btn qb-btn-l qb-btn-primary qb-btn-block">全宽按钮</button>
```

### 4.5 按钮规范

- ✅ 文字始终居中对齐
- ✅ 文字大小与按钮尺寸固定对应
- ✅ 按钮可扩展宽度，但高度必须遵守规范
- ✅ 颜色可通过CSS变量替换（配合colors.css）

---

## 📝 使用指南

### 完整引入示例

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QB小工具</title>
  
  <!-- 按顺序引入CSS文件 -->
  <link rel="stylesheet" href="colors.css">
  <link rel="stylesheet" href="typography.css">
  <link rel="stylesheet" href="layout.css">
  <link rel="stylesheet" href="buttons.css">
</head>
<body>
  <!-- 标准模块结构 -->
  <div class="qb-module">
    <div class="qb-module-header">
      <h2 class="qb-module-title">模块标题</h2>
      <p class="qb-module-subtitle">这是副标题</p>
    </div>
    
    <div class="qb-module-content qb-p-12">
      <p class="qb-body2 qb-text-a1 qb-mb-12">这是正文内容</p>
      
      <div class="qb-flex qb-gap-8">
        <button class="qb-btn qb-btn-m qb-btn-primary">确认</button>
        <button class="qb-btn qb-btn-m qb-btn-secondary">取消</button>
      </div>
    </div>
  </div>
  
  <!-- PostMessage通信脚本 -->
  <script>
    // 高度自适应
    function updateHeight() {
      const height = document.body.scrollHeight;
      window.parent.postMessage({
        type: 'qb-resize',
        height: height
      }, '*');
    }
    
    // 监听DOM变化
    const observer = new ResizeObserver(updateHeight);
    observer.observe(document.body);
    
    // 初始化
    updateHeight();
  </script>
</body>
</html>
```

### 夜间模式切换

```javascript
// 切换夜间模式
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// 页面加载时恢复夜间模式设置
if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark-mode');
}
```

---

## 🎯 设计原则

1. **一致性**：所有QB小工具使用统一的视觉语言
2. **模块化**：每个CSS文件独立，可按需引入
3. **可扩展**：通过CSS变量支持主题定制
4. **响应式**：适配移动端、平板、桌面多种设备
5. **语义化**：类名清晰，易于理解和维护
6. **轻量级**：无外部依赖，纯CSS实现

---

## 📌 注意事项

1. **引入顺序**：必须按 colors → typography → layout → buttons 的顺序引入CSS文件
2. **Body设置**：Body必须设置 `overflow: hidden` 和 `background-color: transparent`
3. **高度通信**：使用PostMessage机制与父页面通信，不要固定body高度
4. **颜色替换**：修改颜色时，优先修改CSS变量而非直接修改类样式
5. **响应式**：使用提供的响应式工具类，避免硬编码断点
6. **命名规范**：所有自定义类名以 `qb-` 开头，避免命名冲突

---

## 🔄 版本信息

- **当前版本**：v1.0
- **创建日期**：2025-10-15
- **适用范围**：QB小工具系列
- **维护状态**：持续更新中

---

## 📮 反馈与支持

如有问题或建议，请联系开发团队进行规范更新。
