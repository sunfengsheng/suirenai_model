# 模型广场设计文档

## 目标

仿照 new-api 模型广场，构建一个 Vue 3 + Element Plus 的静态前端页面，展示来自 sub2api 的模型列表，支持分类筛选、搜索、详情查看和一键复制模型 ID。

---

## 技术栈

- **框架**：Vue 3 + TypeScript
- **构建工具**：Vite
- **UI 组件库**：Element Plus
- **状态管理**：不需要（数据通过 composable 管理）
- **HTTP 请求**：原生 fetch

---

## API 说明

- **Base URL**：`https://api.suirenai.com`
- **接口路径**：`/v1/models`（OpenAI 兼容格式）
- **两个 Key**：
  - OpenAI Key：`sk-8e7bc96941b74e6f5dd2c4f551be12c34b5fa0767a0ac6d50a19e7f234cc241e`
  - Claude Key：`sk-d0cd7b1c19a8532783d62eaa44137a7a65d670af8c269052f69398939b7a073d`
- **返回格式**：
  ```json
  {
    "data": [
      {"id": "gpt-5.2", "type": "model", "display_name": "gpt-5.2", "created_at": "2024-01-01T00:00:00Z"}
    ],
    "object": "list"
  }
  ```

---

## 配置文件

`src/config/index.ts`：存放 BASE_URL 和两个 API Key，不做运行时配置，用户直接修改此文件。

---

## 文件结构

```
model/
├── src/
│   ├── components/
│   │   ├── ModelCard.vue       # 单个模型卡片
│   │   ├── ModelDetail.vue     # 详情弹窗（El Dialog）
│   │   └── SidebarFilter.vue   # 左侧分类筛选
│   ├── composables/
│   │   └── useModels.ts        # 并发拉取两个 key 的数据，合并去重，推断提供商
│   ├── config/
│   │   └── index.ts            # BASE_URL、OPENAI_KEY、CLAUDE_KEY
│   ├── data/
│   │   └── pricing.json        # 本地价格配置，格式见下
│   ├── App.vue                 # 根组件，布局：顶栏 + 侧边栏 + 主内容
│   └── main.ts
├── vite.config.ts              # 代理 /v1 → BASE_URL（解决开发时跨域）
├── index.html
├── package.json
└── tsconfig.json
```

---

## 数据处理逻辑

1. 页面加载时，并发调用两个 Key 的 `/v1/models`
2. 合并两组数据，按 `id` 去重
3. 根据 `id` 前缀推断提供商：
   - `claude-*` → Claude
   - `gpt-*` 或 `openai/*` → OpenAI
   - 其他 → Other
4. 与 `pricing.json` 合并价格信息（按 `id` 匹配）
5. 渲染到页面

---

## 价格配置格式

`src/data/pricing.json`：

```json
{
  "gpt-4o": {
    "input": "2.5",
    "output": "10",
    "unit": "USD/1M tokens"
  },
  "claude-opus-4-7": {
    "input": "15",
    "output": "75",
    "unit": "USD/1M tokens"
  }
}
```

---

## 主页面布局（App.vue）

```
┌─────────────────────────────────────────────┐
│  顶栏：模型广场（标题）                         │
├───────────────┬─────────────────────────────┤
│ 侧边栏         │ 主内容区                      │
│               │  ┌────────────────────────┐  │
│ ○ 全部         │  │ 搜索框                  │  │
│ ○ OpenAI      │  └────────────────────────┘  │
│ ○ Claude      │  ┌──┐ ┌──┐ ┌──┐ ┌──┐        │
│ ○ 其他         │  │卡│ │卡│ │卡│ │卡│        │
│               │  └──┘ └──┘ └──┘ └──┘        │
└───────────────┴─────────────────────────────┘
```

---

## 模型卡片（ModelCard.vue）

每张卡展示：
- 提供商图标（emoji 或 SVG）
- 模型 ID（display_name）
- 提供商 Tag（El Tag）
- 输入/输出价格（无配置则显示"暂无定价"）
- 复制 ID 按钮（El Button + 点击成功提示）
- 点击卡片整体 → 打开详情弹窗

---

## 详情弹窗（ModelDetail.vue）

使用 El Dialog，展示：
- 完整模型 ID
- 提供商
- 上架时间（`created_at` 格式化）
- 输入价格 / 输出价格
- 一键复制 ID 按钮

---

## 错误处理

- 某个 Key 请求失败时，显示警告 Toast，仍展示另一 Key 的数据
- 两个都失败时，显示 El Empty 空状态组件

---

## 不在范围内

- 用户认证
- 后端服务
- 动态价格接口
- 模型排序/收藏
