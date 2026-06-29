# Lumen IM — Rocket.Chat 客户端

基于 [LumenIM](https://github.com/gzydong/LumenIM) 前端 UI 改造的 **Rocket.Chat 聊天客户端**，完整保留原版视觉效果，后端对接 Rocket.Chat REST API + DDP WebSocket 实时推送。

---

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | Vue 3 + TypeScript | 3.5 / 5.2 |
| 构建 | Vite | 6.3 |
| UI 库 | Naive UI | 2.41 |
| 状态管理 | Pinia | 3.0 |
| 路由 | Vue Router | 4.5 |
| 样式 | Less | 4.3 |
| 实时通信 | DDP over WebSocket | 原生实现 |
| HTTP 客户端 | 自封装 ApiClient（fetch + 拦截器） | — |
| 桌面端 | Electron | — |

---

## 功能概览

- 🔐 **用户认证** — 用户名/密码登录 + 注册，`X-Auth-Token` + `X-User-Id` 认证头
- 💬 **实时聊天** — DDP WebSocket 订阅 `stream-room-messages`，消息即时送达
- 📋 **三种会话类型** — 公开频道（`#channel`）、私有群组、私聊
- 👥 **用户搜索** — 在线用户列表 + 搜索，支持发起私聊
- ✏️ **消息操作** — 发送 / 删除 / 编辑，去重显示
- 🎨 **暗黑模式** — 跟随原版 Less 变量，自动适配主题
- 🖥️ **Electron 桌面端** — `pnpm electron:dev` / `pnpm electron:build`

---

## 项目结构

```
LumenIM-master/
├── public/                      # 静态资源
├── electron/                    # Electron 主进程 & preload
│   ├── main.cjs
│   └── preload.cjs
├── build/icons/                 # 桌面端图标
├── src/
│   ├── main.ts                  # 应用入口，注册 Naive UI / Pinia / Router
│   ├── App.vue                  # 根组件
│   ├── env.d.ts                 # 环境变量类型声明
│   ├── apis/                    # API 层
│   │   ├── client.ts            # 通用 HTTP 客户端（超时/重试/拦截器）
│   │   ├── request.ts           # 请求/响应拦截器，认证头注入，401 处理
│   │   ├── rocket-api.ts        # Rocket.Chat REST API（30 个端点）
│   │   ├── rocket-customize.ts  # 文件上传等自定义接口
│   │   ├── api.ts               # 原项目 API（保留，未使用）
│   │   ├── customize.ts         # 原项目自定义接口（保留）
│   │   └── types.d.ts           # 原项目类型定义（保留）
│   ├── services/
│   │   └── ddp-client.ts        # DDP WebSocket 客户端（连接/登录/订阅/重连）
│   ├── stores/                  # Pinia 状态管理
│   │   ├── useAuthStore.ts      # 认证状态（login/logout/register/init）
│   │   ├── useChatStore.ts      # 聊天状态（会话/消息/DDP 实时推送）
│   │   └── useUserStore.ts      # 用户设置（主题/偏好）
│   ├── router/
│   │   └── index.ts             # 路由配置 + 登录守卫
│   ├── views/                   # 页面组件
│   │   ├── auth/
│   │   │   ├── LoginView.vue    # 登录页
│   │   │   └── RegisterView.vue # 注册页
│   │   └── chat/
│   │       ├── ChatView.vue     # 三栏布局主界面
│   │       ├── ConversationList.vue  # 会话列表（左栏）
│   │       ├── MessagePanel.vue      # 消息面板（中栏）
│   │       └── UserSearch.vue        # 用户搜索（右栏）
│   ├── layout/
│   │   └── AppProvider.vue      # Naive UI 全局 Provider
│   ├── composables/
│   │   └── useChat.ts           # 聊天组合函数
│   ├── types/
│   │   ├── rocket.ts            # Rocket.Chat 原生类型（User/Room/Message）
│   │   └── view.ts              # 视图层统一模型（Conversation/ChatMessage）
│   ├── utils/
│   │   ├── auth.ts              # Token 存储/读取工具
│   │   └── format.ts            # 时间/内容格式化
│   └── assets/
│       └── css/                 # 原 LumenIM 样式（完整保留）
│           ├── login.less       # 登录页飞行动画
│           ├── contact.less     # 联系人/会话样式
│           ├── settting.less    # 设置页样式
│           ├── dropsize.less
│           ├── editor-mention.less
│           └── define/
│               ├── global.less  # 全局 CSS 变量
│               └── theme.less   # 暗黑模式变量
├── .env                         # 开发环境变量
├── .env.production              # 生产环境变量
├── .env.electron                # Electron 环境变量
├── vite.config.ts               # Vite 配置（含 API/WS 代理）
├── tsconfig.json
├── tsconfig.node.json
├── package.json
└── pnpm-lock.yaml
```

---

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm（推荐，也可用 npm / yarn）
- Rocket.Chat 服务端运行中（默认 `http://192.168.1.189:3000`）

### 安装 & 启动

```bash
# 安装依赖
pnpm install

# 启动开发服务器（默认 http://localhost:5173）
pnpm dev
```

### 配置 Rocket.Chat 地址

编辑 `.env` 文件，修改后端地址和 WebSocket 地址：

```env
# 开发环境 — 空值走 Vite 代理（解决 CORS）
VITE_BASE_API=
VITE_SOCKET_API=ws://localhost:5173
```

Vite 代理配置在 `vite.config.ts` 中：

```ts
server: {
  proxy: {
    '/api': {
      target: 'http://192.168.1.189:3000',  // ← 改为你的 Rocket.Chat 地址
      changeOrigin: true
    },
    '/websocket': {
      target: 'http://192.168.1.189:3000',  // ← WebSocket 代理
      changeOrigin: true,
      ws: true
    }
  }
}
```

### 生产环境

```env
# .env.production — 直接指向 Rocket.Chat
VITE_BASE_API=http://192.168.1.189:3000
VITE_SOCKET_API=ws://192.168.1.189:3000
```

```bash
pnpm build          # 构建到 dist/
pnpm preview        # 本地预览构建产物
```

---

## Rocket.Chat API 对接

| 功能 | Rocket.Chat REST API |
|------|---------------------|
| 登录 | `POST /api/v1/login` |
| 注册 | `POST /api/v1/users.register` |
| 登出 | `POST /api/v1/logout` |
| 当前用户 | `GET /api/v1/me` |
| 会话列表 | `GET /api/v1/channels.list` + `groups.list` + `im.list` |
| 消息历史 | `GET /api/v1/{type}.messages?roomId=xxx&count=50` |
| 发送消息 | `POST /api/v1/chat.postMessage` `{roomId, text}` |
| 删除消息 | `POST /api/v1/chat.delete` |
| 编辑消息 | `POST /api/v1/chat.update` |
| 用户列表 | `GET /api/v1/users.list` |
| 用户信息 | `GET /api/v1/users.info?userId=xxx` |
| 创建频道 | `POST /api/v1/channels.create` |
| 创建私聊 | `POST /api/v1/im.create` |
| 成员管理 | `GET` members / `POST` invite / `POST` leave |

### 认证机制

| | 原 LumenIM | 现 Rocket.Chat |
|------|-----------|----------------|
| 认证头 | `Authorization: Bearer ${token}` | `X-Auth-Token` + `X-User-Id` |
| Token 格式 | JWT 字符串 | `{ userId, authToken }` 存储于 localStorage |

### 响应拦截

Rocket.Chat 返回 `{ success: true, data: {...} }`，拦截器自动解包 `data` 字段，上层直接拿到业务数据。

---

## 实时消息（DDP WebSocket）

使用 **Meteor DDP 协议** 通过 WebSocket 连接 Rocket.Chat 实现实时消息推送，替代轮询方案。

### 协议流程

```
1. 连接    → {"msg":"connect","version":"1","support":["1","pre2","pre1"]}
2. 响应    ← {"msg":"connected","session":"xxx"}
3. 登录    → {"msg":"method","method":"login","params":[{"resume":"TOKEN"}]}
4. 订阅    → {"msg":"sub","name":"stream-room-messages","params":["ROOM_ID",false]}
5. 推送    ← {"msg":"changed","fields":{"args":[{新消息对象}]}}
```

### 客户端特性

- 登录后自动建连
- 选择会话时 DDP 订阅，切换自动退订
- 指数退避自动重连（最多 10 次，间隔 1s → 2s → 4s → … → 30s）
- 30 秒心跳 keepalive
- 消息 `_id` 去重，防止重复显示

详见 `src/services/ddp-client.ts`。

---

## Nginx 部署

```nginx
server {
    listen       80;
    server_name  yourdomain.com;

    root /path/to/LumenIM-master/dist;
    index  index.html;

    location / {
      try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~ .*\.(gif|jpg|jpeg|png|bmp|swf|flv|ico)$ {
        expires 7d;
    }
    location ~ .*\.(js|css)?$ {
        expires 7d;
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://192.168.1.189:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket 代理
    location /websocket {
        proxy_pass http://192.168.1.189:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

---

## 与原版差异

| | 原 LumenIM | 本版适配 |
|------|-----------|----------|
| 后端 | Go 微服务 | Rocket.Chat |
| 实时通信 | 自建 WebSocket | DDP over WebSocket |
| 认证 | JWT Bearer | X-Auth-Token + X-User-Id |
| RSA 加密 | ✅ | ❌ (移除) |
| 文章/笔记 | ✅ | ❌ (移除) |
| 群投票 | ✅ | ❌ (移除) |
| 表情包管理 | ✅ | ❌ (移除) |
| UI 样式 | ✅ | ✅ 完整保留 |
| 暗黑模式 | ✅ | ✅ 保留 |

---

## 开源协议

基于 [LumenIM](https://github.com/gzydong/LumenIM) 二次开发，保留原项目许可。
