# Enterprise Fullstack Template (Solo Developer Edition)

面向“1 人全栈开发”的企业级模板，目标是：快速交付、长期可演进、支持商业化。

## 1. 核心特性

- Monorepo：pnpm + Turborepo
- Frontend：Vue 3 + TypeScript + Vite + Pinia + Vue Router
- Backend：NestJS + TypeScript（分层架构）
- Async：BullMQ + Redis
- Auth：JWT + Refresh Token + API Key（开放平台）
- Observability：OpenTelemetry + Prometheus + Grafana + Sentry
- Deployment：Docker + Docker Compose + GitHub Actions
- Database Compatibility：PostgreSQL / MongoDB 二选一运行

## 2. 设计原则

- 单人可维护：低认知负担、脚本化、文档化、自动化
- 业务可扩展：模块插件化，核心与业务隔离
- 数据层可替换：Repository Port + Adapter，避免 ORM 污染应用层
- 商业可演进：版本分层与功能开关（社区版/专业版/企业版）

## 3. 目录规划

```text
.
├─ apps/
│  ├─ web/              # 前端主应用
│  ├─ api/              # 后端 API 服务
│  └─ admin-worker/     # 异步任务/定时任务
├─ packages/
│  ├─ ui/               # 组件库
│  ├─ types/            # 前后端共享类型
│  ├─ sdk/              # OpenAPI 生成 SDK
│  └─ config/           # eslint/tsconfig/prettier 等共享配置
├─ infra/
│  ├─ docker/           # Dockerfile / compose / scripts
│  ├─ k8s/              # 可选：K8s 清单
│  └─ monitoring/       # prom/grafana/otel 配置
├─ docs/
│  ├─ architecture/
│  ├─ api/
│  ├─ operations/
│  └─ troubleshooting/
├─ PLAN.md              # 阶段计划清单
└─ README.md
```

## 4. 双数据库兼容策略（PostgreSQL / MongoDB）

### 4.1 核心思路

- 在领域层与应用层只依赖 Repository 接口（Port）
- 在基础设施层分别实现：
- PostgreSQL Adapter（Prisma）
- MongoDB Adapter（Mongoose 或 Prisma Mongo）
- 通过 `DB_PROVIDER=postgres|mongo` 决定运行时注入

### 4.2 兼容边界约束

- 业务逻辑层禁止出现 ORM 特定类型
- 跨数据库一致性由应用服务负责（避免依赖数据库特性）
- 复杂查询下沉到“查询服务”并提供双实现
- 事务能力差异通过“应用事务策略”兼容

### 4.3 配置示例

```env
# app
NODE_ENV=development
PORT=3000

# auth
JWT_SECRET=replace_me
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# db switch: postgres | mongo
DB_PROVIDER=postgres

# postgres
POSTGRES_URL=postgresql://postgres:postgres@postgres:5432/app

# mongo
MONGO_URL=mongodb://mongo:27017/app

# redis
REDIS_URL=redis://redis:6379
```

## 5. Docker 部署

- `infra/docker/Dockerfile.api` / `Dockerfile.web` / `Dockerfile.worker` 已改为多阶段构建（dev/build/prod）。
- `docker-compose.dev.yml` 与 `docker-compose.prod.yml` 已包含服务健康检查、启动顺序依赖与生产资源限制。

### 5.1 本地开发（推荐）

```bash
docker compose -f infra/docker/docker-compose.dev.yml up -d --build
```

说明：dev compose 使用 `target: dev` 运行热更新，依赖健康检查后再启动上层服务。

### 5.2 生产/演示环境

```bash
docker compose -f infra/docker/docker-compose.prod.yml up -d
```

说明：prod compose 使用 `target: prod`，web 使用 Nginx 托管静态资源（`5173 -> 80`）。

镜像变量支持：

- `WEB_IMAGE`
- `API_IMAGE`
- `WORKER_IMAGE`

未传入时默认使用 `ghcr.io/example/*:latest`。

### 5.3 CI 镜像发布与测试环境部署

1. GitHub Actions 镜像发布

- 工作流：[.github/workflows/docker-release.yml](.github/workflows/docker-release.yml)
- 推送 `main` 或手动触发后，构建并推送 web/api/worker 三个 prod 镜像到 GHCR。

2. 测试环境一键发布

```bash
REGISTRY_PREFIX=ghcr.io/<your-org> ./infra/docker/deploy-test.sh <tag>
```

3. 测试环境回滚

```bash
REGISTRY_PREFIX=ghcr.io/<your-org> ./infra/docker/rollback-test.sh <previous-tag>
```

### 5.4 商业化分层与白标

1. 版本分层开关

- 后端读取 `APP_EDITION=community|pro|enterprise`
- 能力接口：`GET /platform/capabilities`

2. 白标配置

- `VITE_BRAND_NAME`：品牌名称
- `VITE_BRAND_PRIMARY`：品牌主色

3. 验证

- 前端首页会显示当前 edition 与能力开关
- 前端顶部标题与主色会根据白标变量生效

### 5.5 最小服务清单

- web
- api
- admin-worker
- redis
- postgres（当 DB_PROVIDER=postgres）
- mongo（当 DB_PROVIDER=mongo）
- prometheus + grafana（可选）

### 5.6 一键验收清单（本地 + Docker）

1. 本地质量门禁（无需 Docker）

```bash
bash scripts/acceptance/local-gate.sh
```

2. Docker 实机验收（有 Docker 时执行）

```bash
bash scripts/acceptance/docker-smoke.sh
```

3. 对应验收项映射

- `local-gate.sh` 通过：覆盖 lint / test:coverage / build 基线
- `docker-smoke.sh` 通过：可用于回填“新环境可通过 Docker Compose 一键拉起”

## 6. 开发启动（已落地）

### 6.1 前置要求

- Node.js >= 20
- pnpm >= 10（推荐使用 corepack）
- Docker / Docker Compose（可选）

项目在根目录和各应用都已配置 `engines.node >= 20`，安装前会执行 Node 版本检查。
若本机 Node 版本较低，可先使用 nvm/fnm 升级再执行下述命令。

### 6.2 本地启动

```bash
corepack enable
pnpm env:check
pnpm install
pnpm --filter @apps/api prisma:generate
pnpm dev
```

常用脚本约定：

```bash
pnpm lint
pnpm test
pnpm build
pnpm format
```

API 双数据库合同测试：

```bash
pnpm --filter @apps/api test
```

说明：该测试已包含同一组 `users` API 在 PostgreSQL/MongoDB 两种模式下的 smoke 校验。

### 6.3 Docker 启动

```bash
docker compose -f infra/docker/docker-compose.dev.yml up -d --build
```

API Docs 页面（Swagger）：

```text
http://localhost:3000/api-docs
```

### 6.4 双数据库切换验证

1. 使用 PostgreSQL（默认）

```bash
DB_PROVIDER=postgres pnpm --filter @apps/api prisma:migrate
DB_PROVIDER=postgres pnpm --filter @apps/api db:init:postgres
DB_PROVIDER=postgres pnpm --filter @apps/api dev
```

请求接口：`GET http://localhost:3000/users?tenantId=t1`

2. 使用 MongoDB

```bash
DB_PROVIDER=mongo pnpm --filter @apps/api db:init:mongo
DB_PROVIDER=mongo pnpm --filter @apps/api dev
```

请求同一接口，返回中的 `dbProvider` 会变为 `mongo`。

### 6.5 鉴权链路验证（JWT + Refresh Token）

1. 登录获取 token

```bash
curl -X POST http://localhost:3000/auth/login \
	-H "Content-Type: application/json" \
	-d '{"email":"owner@example.com","password":"pass123","tenantId":"t1"}'
```

2. 使用 access token 访问受保护接口

```bash
curl http://localhost:3000/auth/profile \
	-H "Authorization: Bearer <accessToken>"
```

3. 刷新 token

```bash
curl -X POST http://localhost:3000/auth/refresh \
	-H "Content-Type: application/json" \
	-d '{"refreshToken":"<refreshToken>"}'
```

4. 使用守卫验证 users 受保护接口

```bash
curl http://localhost:3000/users/me \
	-H "Authorization: Bearer <accessToken>"
```

5. 使用 token 内 tenantId 验证租户隔离读取

```bash
curl http://localhost:3000/users/tenant \
	-H "Authorization: Bearer <accessToken>"
```

6. 使用权限守卫验证管理员接口（owner@example.com 可通过）

```bash
curl http://localhost:3000/users/admin-overview \
	-H "Authorization: Bearer <accessToken>"
```

7. 验证数据级权限策略（管理员看到租户数据，普通成员仅看到自己）

```bash
curl http://localhost:3000/users/visible \
	-H "Authorization: Bearer <accessToken>"
```

8. 验证组织模型与租户上下文（`x-tenant-id`）

```bash
curl http://localhost:3000/org/permissions \
	-H "Authorization: Bearer <accessToken>"

curl -X POST http://localhost:3000/org/teams \
	-H "Content-Type: application/json" \
	-H "x-tenant-id: t1" \
	-H "Authorization: Bearer <accessToken>" \
	-d '{"id":"team-ops","name":"Ops Team"}'
```

### 6.6 前端动态路由与权限指令验证

1. 启动前端

```bash
pnpm --filter @apps/web dev
```

2. 打开 `http://localhost:5173/login` 并使用默认账号登录：

- email: `owner@example.com`
- password: `pass123`
- tenantId: `t1`

3. 登录后访问：

- `/`：基础首页（需要登录）
- `/admin`：管理员页（需要 `users:admin`）
- `/forbidden`：无权限兜底页

4. 在管理员页验证 `v-permission`：

- 当 token 含 `org:manage` 时按钮显示
- 当 token 不含 `org:manage` 时按钮隐藏

5. 访问 `http://localhost:5173/ops`：

- 统一查看任务健康、发送通知、上传文件、查询审计日志
- 路由需要 `org:manage` 权限

### 6.7 任务中心与审计中心验证

1. 入队异步任务（需 `org:manage`）

```bash
curl -X POST http://localhost:3000/jobs/enqueue \
	-H "Content-Type: application/json" \
	-H "Authorization: Bearer <accessToken>" \
	-H "x-tenant-id: t1" \
	-d '{"name":"notification.send","payload":{"to":"owner@example.com","title":"Hello"}}'
```

2. 查询队列健康

```bash
curl http://localhost:3000/jobs/health \
	-H "Authorization: Bearer <accessToken>"
```

3. 查看审计日志

```bash
curl http://localhost:3000/audit/entries \
	-H "Authorization: Bearer <accessToken>" \
	-H "x-tenant-id: t1"
```

### 6.8 通知中心验证

1. 获取通知渠道列表

```bash
curl http://localhost:3000/notifications/channels \
	-H "Authorization: Bearer <accessToken>"
```

2. 发送通知（统一抽象：email/sms/inapp）

```bash
curl -X POST http://localhost:3000/notifications/send \
	-H "Content-Type: application/json" \
	-H "Authorization: Bearer <accessToken>" \
	-H "x-tenant-id: t1" \
	-d '{"channel":"email","to":"owner@example.com","title":"Hello","content":"Welcome"}'
```

3. 查看通知发送记录

```bash
curl http://localhost:3000/notifications/messages \
	-H "Authorization: Bearer <accessToken>" \
	-H "x-tenant-id: t1"
```

### 6.9 文件中心验证

1. 查看当前存储提供方（`local` 或 `object`）

```bash
curl http://localhost:3000/files/provider \
	-H "Authorization: Bearer <accessToken>"
```

2. 上传文本文件（后端会按 `FILE_PROVIDER` 写本地或对象存储路径）

```bash
curl -X POST http://localhost:3000/files/upload \
	-H "Content-Type: application/json" \
	-H "Authorization: Bearer <accessToken>" \
	-H "x-tenant-id: t1" \
	-d '{"fileName":"readme.txt","content":"hello template","contentType":"text/plain"}'
```

3. 查询租户文件列表

```bash
curl http://localhost:3000/files/list \
	-H "Authorization: Bearer <accessToken>" \
	-H "x-tenant-id: t1"
```

### 6.10 开放平台基础验证（API Key + 签名 + 调用日志）

1. 创建 API Key（返回一次性 secret）

```bash
curl -X POST http://localhost:3000/open-platform/keys \
	-H "Content-Type: application/json" \
	-H "Authorization: Bearer <accessToken>" \
	-H "x-tenant-id: t1" \
	-d '{"name":"partner-a"}'
```

2. 查看 API Key 列表（secret 仅返回脱敏摘要）

```bash
curl http://localhost:3000/open-platform/keys \
	-H "Authorization: Bearer <accessToken>" \
	-H "x-tenant-id: t1"
```

3. 调用开放接口（签名串：`<timestamp>.<METHOD>.<path>.<bodyJson>`，HMAC-SHA256）

```bash
# 伪代码：signature = HMAC_SHA256(secret, `${timestamp}.POST./open-platform/public/echo.${bodyJson}`)
curl -X POST http://localhost:3000/open-platform/public/echo \
	-H "Content-Type: application/json" \
	-H "x-api-key: <apiKey>" \
	-H "x-api-timestamp: <timestampMs>" \
	-H "x-api-signature: <signatureHex>" \
	-d '{"ping":"pong"}'
```

4. 查看调用日志

```bash
curl http://localhost:3000/open-platform/call-logs \
	-H "Authorization: Bearer <accessToken>" \
	-H "x-tenant-id: t1"
```

### 6.11 SDK 生成链路（OpenAPI -> packages/sdk）

1. 导出 API OpenAPI 文档到 SDK 包

```bash
pnpm --filter @apps/api openapi:export
```

2. 生成 TypeScript SDK 类型

```bash
pnpm --filter @packages/sdk generate
```

3. （可选）构建 SDK 包

```bash
pnpm --filter @packages/sdk build
```

### 6.12 OpenTelemetry Trace 验证

1. 启动 API（默认开启控制台 span 输出）

```bash
OTEL_TRACE_CONSOLE=true pnpm --filter @apps/api dev
```

2. 分别触发以下链路，观察 API 控制台中的 span：

- `POST /auth/login` -> `auth.login`
- `POST /notifications/send` -> `notification.send`
- `POST /files/upload` -> `file.upload`

3. 若不希望本地打印 span，可关闭：

```bash
OTEL_TRACE_CONSOLE=false pnpm --filter @apps/api dev
```

### 6.13 Prometheus 与 Grafana 验证

1. 启动监控栈

```bash
docker compose -f infra/docker/docker-compose.dev.yml up -d prometheus grafana
```

2. 验证指标端点

```bash
curl http://localhost:3000/metrics
```

3. 访问监控页面

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3002
- 默认账号: admin / admin

4. Grafana 检查

- 数据源 Prometheus 已自动注入
- Dashboard 中可看到请求速率、P95 延迟和按路由状态聚合表

### 6.14 Sentry 前后端异常验证

1. 配置环境变量

```bash
SENTRY_DSN=<your_backend_dsn>
SENTRY_TRACES_SAMPLE_RATE=0.1
VITE_SENTRY_DSN=<your_frontend_dsn>
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
```

2. 启动服务并触发异常

- 后端：触发一个未捕获异常，确认 Sentry 项目收到事件
- 前端：在浏览器控制台抛出异常，确认 Sentry 项目收到事件

3. 验证要点

- 后端异常由全局过滤器上报
- 前端错误与路由性能追踪已初始化

### 6.15 测试分层执行

```bash
# 单元测试
pnpm --filter @apps/api test:unit

# 集成测试
pnpm --filter @apps/api test:integration

# 端到端测试
pnpm --filter @apps/api test:e2e
```

### 6.16 覆盖率阈值与 CI 门禁

1. 本地覆盖率检查（API）

```bash
pnpm --filter @apps/api test:coverage
```

2. 当前阈值（见 `apps/api/vitest.config.ts`）

- lines >= 10
- functions >= 10
- branches >= 10
- statements >= 10

3. PR 门禁

- CI 工作流会执行 lint/build/test 和 `pnpm --filter @apps/api test:coverage`
- 覆盖率未达阈值时会阻断 PR 合并

### 6.17 安全扫描（依赖/Secret/镜像）

- 已新增工作流：[.github/workflows/security.yml](.github/workflows/security.yml)

包含三类扫描：

1. 依赖漏洞扫描

- `pnpm audit --audit-level high`

2. Secret 扫描

- 使用 `gitleaks/gitleaks-action`

3. API 镜像扫描

- 先构建 `infra/docker/Dockerfile.api`
- 使用 Trivy 扫描 `CRITICAL,HIGH` 漏洞并阻断

### 6.18 数据安全（字段脱敏 + 敏感字段加密）

1. 配置数据加密密钥

```bash
DATA_ENCRYPTION_KEY=<strong-random-secret>
```

2. 已启用的安全能力

- Open Platform API Key `secret` 采用 AES-256-GCM 加密后存储
- API Key 列表返回中 `key` 与 `secretHint` 脱敏显示
- Open Platform 调用日志中的 `keyId` 脱敏显示
- 通知记录新增 `toMasked` 字段，避免直接暴露完整收件地址

3. 验证

```bash
pnpm --filter @apps/api test:coverage
```

## 7. 阶段推进方式（非按天）

项目节奏按“阶段里程碑”推进，不按自然日拆分。

- 阶段 1：基础骨架与工程规范
- 阶段 2：后端分层与双数据库底座
- 阶段 3：认证、权限、多租户闭环
- 阶段 4：通知/文件/审计/队列/开放平台
- 阶段 5：可观测性、安全门禁、质量体系
- 阶段 6：Docker 化交付与商业化版本

详细清单见 [PLAN.md](PLAN.md)。

## 8. 商业化版本策略

- 社区版：组织与基础权限 + 通用后台
- 专业版：多租户 + 审计中心 + 通知中心
- 企业版：白标 + SSO + 计费中心 + SLA
- 增值插件：支付网关、短信渠道、AI 模块、行业模板

## 9. 交付标准（Definition of Done）

- 新项目可一键启动并登录
- PostgreSQL / MongoDB 任一模式可稳定运行
- 核心链路测试在 CI 稳定通过
- 关键操作可追踪到审计记录
- 一键部署测试环境并支持回滚
- 文档覆盖开发、部署、运维、二开、排障

## 10. 下一步建议

- 按 [PLAN.md](PLAN.md) 从阶段 1 开始执行
- 先完成最小可运行骨架，再逐阶段补齐企业能力
- 每完成一个阶段立刻补文档与测试，避免后期集中偿还技术债
