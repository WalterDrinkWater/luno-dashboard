# Luno Dashboard 加强版 — Handoff Document

## 1. 项目概述

### 目标
构建 Luno 交易平台的增强版仪表盘，核心功能是**展示每个资产的平均买入成本**，这是 Luno 官方界面缺少的功能。

### 用户痛点
- Luno 官方不显示各资产的平均成本
- 只能通过翻交易记录手动计算
- 无法直观看到盈亏情况

### 技术约束
- 无后端，无数据库
- API Key 存储在浏览器 localStorage
- 纯静态文件部署

---

## 2. 技术架构

### 技术栈
| 层 | 选择 | 原因 |
|----|------|------|
| 前端 | 纯 HTML/CSS/JS | 零依赖，单文件可部署 |
| 图表 | Chart.js (CDN) | 饼图展示资产分配 |
| 存储 | localStorage | API Key 持久化 |
| API 通信 | `fetch()` + Basic Auth | 标准浏览器 API |

### 架构图

```
┌──────────────────────────────────────────┐
│              Browser (SPA)                │
│                                          │
│  ┌──────────┐  ┌──────────────────────┐  │
│  │ localStorage │  │   Luno API Adapter  │  │
│  │  (API Key)   │  │  (fetch + btoa)     │  │
│  └──────────┘  └──────────┬───────────┘  │
│                           │               │
│  ┌────────────────────────▼────────────┐  │
│  │         Calculation Engine           │  │
│  │  - Average Cost per Asset           │  │
│  │  - P&L Calculation                  │  │
│  │  - Portfolio Aggregation            │  │
│  └────────────────────────┬────────────┘  │
│                           │               │
│  ┌────────────────────────▼────────────┐  │
│  │           Rendering Layer            │  │
│  │  - Asset Cards                      │  │
│  │  - P&L Table                        │  │
│  │  - Chart.js Pie Chart               │  │
│  └─────────────────────────────────────┘  │
└──────────────────────────────────────────┘
          │                  ▲
          ▼                  │
  ┌───────────────┐          │
  │  Luno API     │──────────┘
  │  api.luno.com │
  └───────────────┘
```

---

## 3. Luno API 使用清单

### 需要认证的接口

| 端点 | 用途 | 所需权限 |
|------|------|----------|
| `GET /api/1/balance` | 获取所有账户余额和资产列表 | `Perm_R_Balance` (1) |
| `GET /api/1/listtrades` | 获取交易历史记录 | `Perm_R_Orders` (32) |

### 公开接口（无需认证）

| 端点 | 用途 |
|------|------|
| `GET /api/1/tickers` | 获取所有交易对实时价格 |
| `GET /api/exchange/1/markets` | 获取市场配置（精度等） |

### 认证方式
```
HTTP Basic Auth:
  Username = API Key ID (e.g. "cnz2yjswbv3jd")
  Password = API Key Secret (e.g. "0hydMZDb9HRR3Qq...")
  
  Header: Authorization: Basic base64(KeyID:Secret)
```

### 关键 API 响应结构

#### GET /api/1/balance
```json
{
  "balance": [
    {
      "account_id": "237592692",
      "asset": "XBT",
      "balance": "1.500000",
      "name": "Trading account",
      "reserved": "0.000000",
      "unconfirmed": "0.000000"
    }
  ]
}
```

#### GET /api/1/listtrades (per pair)
```json
{
  "trades": [
    {
      "is_buy": true,
      "pair": "XBTMYR",
      "base": "0.001000",       // XBT volume
      "counter": "250.50",      // MYR amount
      "price": "250500",
      "fee_base": "0.000000",
      "fee_counter": "1.25",
      "timestamp": 1700000000000,
      "sequence": 1
    }
  ]
}
```

#### GET /api/1/tickers
```json
{
  "tickers": [
    {
      "pair": "XBTMYR",
      "ask": "251000",
      "bid": "249000",
      "last_trade": "250500",
      "rolling_24_hour_volume": "15.2",
      "status": "ACTIVE",
      "timestamp": 1700000000000
    }
  ]
}
```

---

## 4. 核心算法

### 平均成本计算

```
对于每个资产 (如 XBT)：

1. 识别相关交易对
   - 对于 XBT: XBTMYR, XBTZAR (如果跨不同法币购买)

2. 遍历该对的交易记录
   for trade in trades:
     if trade.is_buy == true:
       // 花费的报价货币 (含手续费)
       total_cost += parseFloat(trade.counter) + parseFloat(trade.fee_counter)
       // 实际获得的基础货币 (减去手续费)
       total_volume += parseFloat(trade.base) - parseFloat(trade.fee_base)

3. 平均成本
   average_cost = total_cost / total_volume

4. 盈亏计算
   当前价值 = balance × 当前价格
   总投入 = average_cost × balance
   P&L = 当前价值 - 总投入
   P&L% = (当前价格 - average_cost) / average_cost × 100
```

### 注意事项
- **跨法币购买**：如果用户用 MYR 和 ZAR 都买过 XBT，需要汇率换算。第一期仅处理默认法币 (MYR)。
- **分页**：`listtrades` 最多返回 100 条/次，交易多时需要循环获取
- **手续费**：`fee_base` 是基础货币扣除，`fee_counter` 是报价货币扣除，都会影响实际成本

---

## 5. 数据模型

### localStorage 结构

```javascript
// Key: "luno_api_key"
{
  "keyId": "cnz2yjswbv3jd",
  "keySecret": "0hydMZDb9HRR3Qq...",
  "label": "My API Key"          // 可选标识
}

// Key: "luno_dashboard_settings"
{
  "defaultCurrency": "MYR",
  "refreshInterval": 30,         // 秒
  "theme": "dark"                // 可选
}
```

### 内存状态模型

```javascript
{
  apiKey: { keyId, keySecret, label },
  assets: [
    {
      asset: "XBT",
      balance: "1.5",
      account_id: "123",
      name: "Trading",
      averageCost: 245000.00,   // 计算得到的均价
      currentPrice: 250500.00,  // 来自 ticker
      totalInvested: 367500.00, // 总投入 = avgCost × balance
      currentValue: 375750.00,  // 当前市值
      pnl: 8250.00,             // 盈亏金额
      pnlPercent: 2.24           // 盈亏百分比
    }
  ],
  totalPortfolioValue: 0,
  totalInvestedValue: 0,
  totalPnl: 0,
  loading: false,
  error: null
}
```

---

## 6. 页面布局

```
┌────────────────────────────────────────────────────────┐
│  🏦 Luno Dashboard 加强版            [⚙ 设置 API Key]  │
│                                      [🔄 刷新]        │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐     │
│  │ 💰 总资产     │ │ 📊 总投入     │ │ 📈 总盈亏     │       │
│  │ RM 12,345    │ │ RM 10,000   │ │ +RM 2,345   │     │
│  │             │ │             │ │ +23.45%     │     │
│  └─────────────┘ └─────────────┘ └─────────────┘     │
│                                                        │
│  ┌─────────────────────┬──────────────────────────┐   │
│  │   📊 资产分配        │   资产详情表格              │   │
│  │                     │                          │   │
│  │   [         ]       │ 资产 | 余额 | 均价 | 现价  │   │
│  │   [  Pie    ]       │      |      |      | 盈亏  │   │
│  │   [ Chart   ]       │ XBT  | 0.5  | 245k | 250k │   │
│  │   [         ]       │      |      |      |+2.2% │   │
│  │                     │ ETH  | 2.0  | 12k  | 13k  │   │
│  │                     │      |      |      |+8.3% │   │
│  │                     │ USDT | 1000 | 1.00 | 1.00 │   │
│  └─────────────────────┴──────────────────────────┘   │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │  API Key 状态: ✅ 已连接 | 最后更新: 2s 前         │ │
│  └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

---

## 7. 文件结构

```
luno-dashboard/
├── index.html           # 主页面入口
├── css/
│   └── style.css        # 所有样式（暗色主题）
├── js/
│   ├── config.js        # 常量、配置、默认设置
│   ├── storage.js       # localStorage 读写封装
│   ├── api.js           # Luno API 调用封装 (fetch + basic auth)
│   ├── calculator.js    # 平均成本、盈亏计算引擎
│   ├── render.js        # DOM 渲染、Chart.js 图表
│   └── app.js           # 主入口，协调各模块
├── docs/
│   └── handoff.md       # 本文档
└── README.MD            # 项目说明
```

---

## 8. 实现步骤（有序）

### Phase 1：基础框架
- [ ] 创建 `index.html` — 页面结构 + Chart.js CDN
- [ ] 创建 `css/style.css` — 暗色主题样式
- [ ] 创建 `js/config.js` — 常量定义

### Phase 2：API Key 管理
- [ ] 创建 `js/storage.js` — localStorage 封装
- [ ] API Key 输入表单（Modal 弹出）
- [ ] basic auth 编码：`btoa(keyId:secret)`
- [ ] Key 验证（调用 GET /api/1/balance 测试）
- [ ] 错误状态显示（401、Key 过期等）

### Phase 3：数据获取
- [ ] 创建 `js/api.js` — `fetchBalance()`, `fetchTickers()`, `fetchTrades(pair)`
- [ ] `GET /api/1/balance` 获取所有资产
- [ ] `GET /api/1/tickers` 获取所有价格
- [ ] `GET /api/1/listtrades` 分页获取交易历史

### Phase 4：计算引擎
- [ ] 创建 `js/calculator.js` — 核心计算逻辑
- [ ] 每个资产的平均成本计算
- [ ] 盈亏金额和百分比
- [ ] 投资组合总计

### Phase 5：渲染层
- [ ] 创建 `js/render.js` — UI 渲染
- [ ] 顶部概述卡片（总资产、总投入、总盈亏）
- [ ] 资产详情表格
- [ ] Chart.js 饼图（资产分配）
- [ ] 加载和错误状态 UI

### Phase 6：主应用
- [ ] 创建 `js/app.js` — 主入口，初始化流程
- [ ] 定时刷新（30 秒间隔）
- [ ] 手动刷新按钮
- [ ] 响应式适配（移动端）

### Phase 7：优化和边缘情况
- [ ] 交易历史分页（超过 100 条时）
- [ ] 手续费计算（fee_base + fee_counter）
- [ ] 空状态（无 API Key、无交易历史、零余额资产过滤）
- [ ] 错误重试机制
- [ ] README 更新

---

## 9. 潜在风险 & 缓解措施

| 风险 | 影响 | 缓解 |
|------|------|------|
| **CORS 限制** | 浏览器无法直接调 Luno API | 添加 Node.js proxy 或 Cloudflare Worker 转发 |
| **交易历史过大** | 分页获取慢 | 缓存已获取数据到 localStorage，增量更新 |
| **跨法币交易** | 多法币购买同一资产难计算 | V1 只处理默认法币 (MYR)；V2 加汇率换算 |
| **API 限流 (300/min)** | 多个并发请求可能达到限制 | 控制并发数，加请求间隔 |
| **Chart.js CDN 不可用** | 图表无法渲染 | 纯表格数据仍可用；也可本地打包 |

---

## 10. 验收标准

1. ✅ 用户输入 API Key ID + Secret 后可成功保存到 localStorage
2. ✅ 页面正确显示所有资产余额（至少 XBT, ETH, MYR）
3. ✅ 每个资产显示实时价格
4. ✅ 每个资产显示平均买入成本
5. ✅ 每个资产显示盈亏金额和百分比
6. ✅ 饼图正确展示资产分配比例
7. ✅ 30 秒自动刷新价格
8. ✅ 无效 API Key 时显示友好错误提示
9. ✅ 移动端基本可读可用
10. ✅ 无需任何后端/数据库即可运行
