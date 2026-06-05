# 模型广场

基于 Vue 3 + Element Plus 构建的 AI 模型展示页面，支持多渠道聚合、价格展示、折扣计算（含人民币换算）。

## 功能

- 多渠道模型聚合（同一模型合并展示，点击查看各渠道折扣价）
- 按提供商分类筛选（OpenAI / Claude / 其他）
- 实时搜索模型名称
- 复制模型 ID
- 实时汇率换算人民币折扣价
- 侧边栏显示 QQ 群联系方式

## 快速开始

```bash
npm install
npm run dev        # 开发服务器 http://localhost:5173
npm run build      # 生产构建 → dist/
npm test           # 单元测试
```

## 配置说明

所有配置集中在两个文件，**不需要修改其他代码**。

### 渠道与折扣 — `src/config/index.ts`

```typescript
export const CHANNELS: Channel[] = [
  {
    key: 'sk-xxx...',   // API Key
    name: 'gpt 通道1',  // 显示名称
    discount: 0.8       // 折扣率，0.8 = 8折，1.0 = 无折扣
  },
  // 可继续添加...
]
```

### 模型上架日期 — `src/config/index.ts`

```typescript
export const MODEL_RELEASE_DATES: Record<string, string> = {
  'gpt-4o': '2024-05-13',
  'claude-sonnet-4-6': '2025-10-01',
  // 没有配置的模型详情页显示"未配置"
}
```

### 模型价格 — `src/data/pricing.json`

```json
{
  "gpt-4o": { "input": "2.5", "output": "10" },
  "claude-opus-4-7": { "input": "15", "output": "75" }
}
```

价格单位为 USD / 1M tokens。可手动编辑，也可运行脚本自动同步：

```bash
npm run update-pricing   # 从 LiteLLM 同步最新官方定价，已有手动值不会被覆盖
```

## 项目结构

```
src/
├── components/
│   ├── ModelCard.vue       # 模型卡片（原价、渠道数、复制按钮）
│   ├── ModelDetail.vue     # 详情弹窗（各渠道折扣价、人民币换算）
│   ├── SidebarFilter.vue   # 左侧分类筛选 + 价格单位说明
│   └── ProviderIcon.vue    # OpenAI / Claude / 其他 图标
├── composables/
│   └── useModels.ts        # 数据拉取、合并、去重、筛选
├── config/
│   └── index.ts            # 渠道配置、折扣、上架日期
├── data/
│   └── pricing.json        # 模型价格数据
└── App.vue                 # 根布局

scripts/
└── update-pricing.mjs      # 价格同步脚本（LiteLLM → pricing.json）

tests/
└── useModels.spec.ts       # 单元测试（10 个用例）
```

## 部署

构建产物在 `dist/` 目录，可直接部署到任意静态托管服务（Nginx、Vercel、Cloudflare Pages 等）。

> **注意：** 生产环境需配置反向代理将 `/v1` 请求转发到 `https://api.suirenai.com`，否则会跨域。开发环境由 Vite 代理自动处理。

## 联系方式

QQ 群：876203676
