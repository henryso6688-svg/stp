# STP - Three Departments and Six Ministries Architecture Framework

A software architecture framework inspired by the Three Departments and Six Ministries (三省六部制) system of Tang Dynasty China.

## Overview

The Three Departments and Six Ministries system was a sophisticated administrative structure in imperial China. This framework adapts that historical governance model to modern software architecture:

### Three Departments (三省)
1. **中书省 (Secretariat)** - Decision making layer: Receives external requests and formulates policies
2. **门下省 (Chancellery)** - Review layer: Validates, authorizes, and audits decisions
3. **尚书省 (Department of State Affairs)** - Execution layer: Distributes tasks to specialized ministries

### Six Ministries (六部)
1. **吏部 (Ministry of Personnel)** - Service discovery, load balancing, and resource allocation
2. **户部 (Ministry of Revenue)** - Billing, quota management, and resource accounting
3. **礼部 (Ministry of Rites)** - API standardization, protocol conversion, and interface management
4. **兵部 (Ministry of War)** - Security, defense, rate limiting, and threat protection
5. **刑部 (Ministry of Justice)** - Error handling, auditing, logging, and compliance
6. **工部 (Ministry of Works)** - Infrastructure, resource provisioning, and maintenance

## Installation

```bash
npm install stp
```

## Basic Usage

```typescript
import { STP } from 'stp';

const stp = new STP({
  // Configuration options
});

// Define your services according to the Six Ministries
stp.registerMinistry('personnel', PersonnelMinistry);
stp.registerMinistry('revenue', RevenueMinistry);

// Process requests through the Three Departments
const result = await stp.process(request);
```

## Architecture

```
External Request
        ↓
   中书省 (Secretariat)
        ↓
   门下省 (Chancellery)
        ↓
   尚书省 (Department of State Affairs)
        ↓
   ┌─────────────────────┐
   │   Six Ministries    │
   ├─────────────────────┤
   │ 吏部 户部 礼部       │
   │ 兵部 刑部 工部       │
   └─────────────────────┘
```

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run example
npm run example
```

## Deployment to GitHub

This project is configured for deployment to [https://github.com/henryso6688-svg/stp](https://github.com/henryso6688-svg/stp).

### Option 1: Using Git (Recommended)

1. **Install Git** if not already installed:
   - Download from [https://git-scm.com/download/win](https://git-scm.com/download/win)
   - Install with default settings

2. **Run deployment script**:
   ```bash
   deploy.bat
   ```

3. **Or manually execute**:
   ```bash
   git init
   git add .
   git commit -m "初始化 STP 项目：三省六部制软件架构框架"
   git branch -M main
   git remote add origin https://github.com/henryso6688-svg/stp.git
   git push -u origin main
   ```

### Option 2: Manual Upload via GitHub Web Interface

1. Visit [https://github.com/henryso6688-svg/stp](https://github.com/henryso6688-svg/stp)
2. Click "Add file" → "Upload files"
3. Select all files and folders from the `C:\Users\henry\stp` directory
4. Add commit message: "初始化 STP 项目：三省六部制软件架构框架"
5. Click "Commit changes"

### Project Structure

```
stp/
├── src/                    # Source code
│   ├── core/              # Core types and interfaces
│   ├── three-departments/ # 三省实现
│   │   ├── secretariat.ts
│   │   ├── chancellery.ts
│   │   └── state-affairs.ts
│   └── six-ministries/    # 六部实现
│       ├── personnel.ts   # 吏部
│       ├── revenue.ts     # 户部
│       ├── rites.ts       # 礼部
│       ├── war.ts         # 兵部
│       ├── justice.ts     # 刑部
│       └── works.ts       # 工部
├── tests/                 # Unit tests
├── examples/              # Usage examples
├── docs/                  # Documentation
├── package.json          # Node.js dependencies
├── tsconfig.json         # TypeScript configuration
├── jest.config.js        # Jest test configuration
└── README.md            # This file
```

## Project Status

✅ 完成的三省六部制软件架构框架：
- ✅ 三省核心模块实现
- ✅ 六部功能模块实现
- ✅ TypeScript类型定义
- ✅ 单元测试配置
- ✅ 使用示例
- ✅ 构建和开发脚本
- ✅ GitHub部署配置

## Next Steps

1. Run the example: `npm run example`
2. Add more use cases and demonstrations
3. Extend with real-world integrations
4. Add CI/CD pipeline

## License

MIT
