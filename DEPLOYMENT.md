# STP 项目部署指南

## 项目概述
STP (Three Departments and Six Ministries) 是一个基于唐朝三省六部制的软件架构框架。

GitHub 仓库: https://github.com/henryso6688-svg/stp

## 部署方法

### 方法一：使用 Git 命令行（推荐）

#### 步骤 1: 安装 Git
1. 下载 Git: https://git-scm.com/download/win
2. 运行安装程序，使用默认设置
3. 安装完成后，重新打开命令行

#### 步骤 2: 部署到 GitHub
打开命令行，导航到项目目录，然后运行：

```cmd
cd C:\Users\henry\stp
deploy.bat
```

或者手动执行：

```cmd
cd C:\Users\henry\stp
git init
git add .
git commit -m "初始化 STP 项目：三省六部制软件架构框架"
git branch -M main
git remote add origin https://github.com/henryso6688-svg/stp.git
git push -u origin main
```

#### 步骤 3: 输入 GitHub 凭据
第一次推送时，可能需要：
- GitHub 用户名
- 个人访问令牌（推荐）或密码

创建个人访问令牌：
1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token"
3. 选择 "repo" 权限
4. 复制生成的令牌，在提示密码时使用它

### 方法二：使用 GitHub 网页界面

#### 步骤 1: 打开 GitHub 仓库
访问: https://github.com/henryso6688-svg/stp

#### 步骤 2: 上传文件
1. 点击 "Add file" 按钮
2. 选择 "Upload files"
3. 将 `C:\Users\henry\stp` 目录下的所有文件拖拽到上传区域
   **注意**: 不要上传 `node_modules` 目录
4. 添加提交信息: "初始化 STP 项目：三省六部制软件架构框架"
5. 点击 "Commit changes"

#### 需要上传的文件:
- [x] `.eslintrc.js`
- [x] `.gitignore`
- [x] `deploy.bat`
- [x] `jest.config.js`
- [x] `package.json`
- [x] `README.md`
- [x] `tsconfig.json`
- [x] `src/` 目录（全部内容）
- [x] `tests/` 目录（全部内容）
- [x] `examples/` 目录（全部内容）
- [x] `docs/` 目录（全部内容）
- [ ] `node_modules/` 目录（不需要上传）

### 方法三：使用 GitHub Desktop

1. 下载 GitHub Desktop: https://desktop.github.com/
2. 安装并登录
3. 点击 "Add" → "Add existing repository"
4. 选择 `C:\Users\henry\stp` 目录
5. 点击 "Publish repository"
6. 设置仓库名称: `stp`
7. 设置所有者: `henryso6688-svg`
8. 点击 "Publish repository"

## 验证部署

部署完成后，访问: https://github.com/henryso6688-svg/stp

应该能看到：
- ✅ README.md 文件
- ✅ src/ 目录和所有源码文件
- ✅ package.json 和配置文件
- ✅ 没有 node_modules/ 目录

## 项目测试

部署后，可以验证项目是否能正常工作：

```bash
# 检查项目结构
dir /b

# 查看主要文件
type README.md

# 运行部署脚本（如果已安装 Git）
deploy.bat
```

## 问题排查

### 问题 1: Git 命令未找到
**解决方案**: 确保 Git 已正确安装并添加到系统 PATH。

### 问题 2: GitHub 认证失败
**解决方案**: 
1. 使用个人访问令牌代替密码
2. 运行: `git config --global credential.helper manager`

### 问题 3: 仓库已存在但为空
**解决方案**: 
```bash
git pull origin main --allow-unrelated-histories
git push origin main
```

### 问题 4: 文件大小限制
**解决方案**: 确保不提交 `node_modules` 目录

## 后续步骤

1. **设置 GitHub Actions**: 添加自动测试和构建
2. **发布 npm 包**: 将框架发布到 npm
3. **添加文档**: 完善 API 文档和使用示例
4. **社区贡献**: 添加贡献指南

## 联系信息

如有问题，请参考:
- GitHub 仓库: https://github.com/henryso6688-svg/stp
- GitHub Issues: https://github.com/henryso6688-svg/stp/issues

---
*部署完成时间: 2026-03-11*