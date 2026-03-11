# STP 框架部署指南

## 概述
STP (Three Departments and Six Ministries) 是一个基于唐朝三省六部制的软件架构框架。本文档提供单机部署配置指南。

## 部署架构

```
┌─────────────────────────────────────────────────────────┐
│                    STP 单机部署架构                      │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ STP API  │  │PostgreSQL│  │  Redis   │  │ Adminer │ │
│  │ Server   │◄─┤  Database│  │  Cache   │  │   UI    │ │
│  │ :3000    │  │  :5432   │  │  :6379   │  │  :8080  │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│         │            │            │            │        │
│         └────────────┴────────────┴────────────┘        │
│                    Docker Network                        │
└─────────────────────────────────────────────────────────┘
```

## 前置要求

### 1. 系统要求
- **操作系统**: Windows 10+, macOS 10.15+, Linux (Ubuntu 20.04+)
- **Docker**: 20.10.0+
- **Docker Compose**: 2.0.0+
- **Node.js**: 18.0.0+ (仅用于本地开发)
- **Git**: 2.20.0+

### 2. 端口要求
确保以下端口可用：
- **3000**: STP API 服务器
- **5432**: PostgreSQL 数据库
- **6379**: Redis 缓存
- **8080**: Adminer 数据库管理界面

## 快速开始

### 方法一：使用 Docker Compose (推荐)

```bash
# 1. 克隆仓库
git clone https://github.com/henryso6688-svg/stp.git
cd stp

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，根据需要修改配置

# 3. 启动所有服务
docker-compose up -d

# 4. 查看服务状态
docker-compose ps

# 5. 查看日志
docker-compose logs -f stp-framework

# 6. 停止服务
docker-compose down
```

### 方法二：仅使用 Docker

```bash
# 1. 构建 Docker 镜像
docker build -t stp-framework .

# 2. 运行容器
docker run -d \
  --name stp-framework \
  -p 3000:3000 \
  --env-file .env \
  stp-framework

# 3. 查看容器状态
docker ps

# 4. 查看日志
docker logs -f stp-framework
```

### 方法三：本地开发模式

```bash
# 1. 安装依赖
npm install

# 2. 构建项目
npm run build

# 3. 启动开发服务器
npm run server

# 或直接运行示例
npm run example
```

## 配置说明

### 1. 环境变量配置 (.env)

主要配置项：

```env
# STP 框架设置
STP_MODE=api                    # 运行模式: api, example, 或留空为交互模式
STP_PORT=3000                   # API 服务器端口
STP_HOST=0.0.0.0                # 绑定地址
STP_ENABLE_LOGGING=true         # 启用日志
STP_STRICT_VALIDATION=false     # 严格验证模式
STP_TIMEOUT=30000               # 请求超时时间(毫秒)

# 数据库配置
POSTGRES_HOST=stp-postgres
POSTGRES_PORT=5432
POSTGRES_DB=stp
POSTGRES_USER=stp_user
POSTGRES_PASSWORD=stp_password

# Redis 配置
REDIS_HOST=stp-redis
REDIS_PORT=6379

# 各部门配置
PERSONNEL_LOAD_BALANCING_STRATEGY=round-robin
REVENUE_DEFAULT_RATE_API_CALL=0.01
RITES_DEFAULT_PROTOCOL=REST
WAR_RATE_LIMIT_REQUESTS=100
JUSTICE_AUDIT_RETENTION_DAYS=90
WORKS_CPU_POOL_CAPACITY=100
```

### 2. Docker Compose 配置

服务说明：

| 服务名称 | 镜像 | 端口 | 说明 |
|---------|------|------|------|
| stp-framework | 自定义构建 | 3000 | STP 框架 API 服务器 |
| stp-postgres | postgres:15-alpine | 5432 | PostgreSQL 数据库 |
| stp-redis | redis:7-alpine | 6379 | Redis 缓存 |
| stp-admin | adminer:latest | 8080 | 数据库管理界面 |

### 3. 数据持久化

- **PostgreSQL 数据**: 存储在 `postgres-data` Docker 卷中
- **Redis 数据**: 存储在 `redis-data` Docker 卷中
- **应用日志**: 挂载到 `./logs` 目录
- **应用数据**: 挂载到 `./data` 目录

## API 接口

### 健康检查
```http
GET /health
```

响应：
```json
{
  "status": "healthy",
  "timestamp": "2026-03-11T09:05:32.147Z",
  "framework": "STP - Three Departments and Six Ministries",
  "departments": {
    "secretariat": "active",
    "chancellery": "active",
    "state_affairs": "active"
  },
  "ministries": ["personnel", "revenue", "rites", "war", "justice", "works"]
}
```

### 处理请求
```http
POST /api/process
Content-Type: application/json

{
  "type": "api.user.login",
  "payload": {
    "username": "user@example.com",
    "password": "securepassword123"
  },
  "metadata": {
    "userId": "user_001",
    "clientIP": "192.168.1.100",
    "resource": "api.call"
  }
}
```

### 获取部门信息
```http
GET /api/ministry/{ministryName}
```

### 获取审计日志
```http
GET /api/audit/logs
```

### 获取基础设施状态
```http
GET /api/infrastructure/status
```

## 运维管理

### 1. 数据库管理

访问 Adminer 界面：
```
http://localhost:8080
```
- 服务器: `stp-postgres`
- 用户名: `stp_user`
- 密码: `stp_password`
- 数据库: `stp`

### 2. 监控检查

```bash
# 检查所有服务健康状态
docker-compose ps

# 查看实时日志
docker-compose logs -f

# 检查 STP 框架健康
curl http://localhost:3000/health

# 检查数据库连接
docker exec stp-postgres pg_isready -U stp_user

# 检查 Redis 连接
docker exec stp-redis redis-cli ping
```

### 3. 备份与恢复

```bash
# 备份 PostgreSQL 数据库
docker exec stp-postgres pg_dump -U stp_user stp > backup_$(date +%Y%m%d).sql

# 恢复 PostgreSQL 数据库
cat backup.sql | docker exec -i stp-postgres psql -U stp_user stp

# 备份 Redis 数据
docker exec stp-redis redis-cli SAVE
docker cp stp-redis:/data/dump.rdb ./redis_backup_$(date +%Y%m%d).rdb
```

### 4. 日志管理

```bash
# 查看 STP 框架日志
docker-compose logs stp-framework

# 查看数据库日志
docker-compose logs stp-postgres

# 查看 Redis 日志
docker-compose logs stp-redis

# 清理旧日志
find ./logs -name "*.log" -mtime +7 -delete
```

## 故障排除

### 常见问题

#### 1. 端口冲突
```
Error: port is already allocated
```
**解决方案**:
- 修改 `.env` 文件中的端口配置
- 或停止占用端口的服务

#### 2. 数据库连接失败
```
Error: connection to database failed
```
**解决方案**:
```bash
# 等待数据库启动
sleep 10

# 检查数据库状态
docker-compose logs stp-postgres

# 重新启动服务
docker-compose restart stp-framework
```

#### 3. 内存不足
```
Error: out of memory
```
**解决方案**:
- 增加 Docker 内存限制
- 或调整服务配置，减少资源使用

#### 4. 构建失败
```
Error: npm install failed
```
**解决方案**:
```bash
# 清理缓存
docker system prune -a

# 重新构建
docker-compose build --no-cache
```

### 性能优化

#### 1. 调整资源限制
在 `docker-compose.yml` 中添加资源限制：

```yaml
services:
  stp-framework:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

#### 2. 启用缓存
```env
# 在 .env 文件中
REDIS_CACHE_ENABLED=true
REDIS_CACHE_TTL=3600
```

#### 3. 数据库优化
```sql
-- 定期清理旧数据
DELETE FROM audit_logs WHERE timestamp < NOW() - INTERVAL '90 days';
DELETE FROM security_logs WHERE timestamp < NOW() - INTERVAL '30 days';
```

## 安全建议

### 1. 生产环境配置
```env
# 禁用调试日志
STP_ENABLE_LOGGING=false

# 启用严格验证
STP_STRICT_VALIDATION=true

# 使用强密码
POSTGRES_PASSWORD=StrongP@ssw0rd!2024
REDIS_PASSWORD=AnotherStrongP@ssw0rd!

# 禁用 Adminer (或使用身份验证)
ADMIN_ENABLED=false
```

### 2. 网络安全
```bash
# 使用防火墙限制访问
ufw allow 3000/tcp  # 仅允许 STP API 端口
ufw allow from 192.168.1.0/24 to any port 5432  # 限制数据库访问
```

### 3. 定期更新
```bash
# 更新 Docker 镜像
docker-compose pull
docker-compose up -d

# 更新依赖
npm update
```

## 扩展部署

### 1. 添加负载均衡器
```yaml
# docker-compose.yml 添加
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - stp-framework
```

### 2. 添加监控
```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
  
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

### 3. 添加消息队列
```yaml
services:
  rabbitmq:
    image: rabbitmq:management
    ports:
      - "5672:5672"
      - "15672:15672"
```

## 联系支持

- **GitHub 仓库**: https://github.com/henryso6688-svg/stp
- **问题反馈**: https://github.com/henryso6688-svg/stp/issues
- **文档更新**: 查看 `docs/` 目录

---

**部署完成时间**: 2026-03-11  
**STP 版本**: 0.1.0  
**部署架构**: 单机 Docker Compose