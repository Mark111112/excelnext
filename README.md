# Excel Merger - Next.js Version

# WORK IN PROGRESS! CANNOT PLAY! 

一个基于 Next.js 的 Excel 文件合并工具，用于上传、比较和合并 Excel 文件。这个版本是为 Vercel 部署而优化的。

## 功能特点

- 上传多个 Excel 文件 (.xls, .xlsx)
- 比较不同 Excel 文件中的表头
- 合并具有相同结构的 Excel 文件
- 下载合并后的 Excel 文件
- 文件管理（查看、删除）

## 技术栈

- Next.js 14
- React 18
- Material UI
- XLSX 库用于 Excel 文件处理
- TypeScript
- Vercel Serverless Functions

## 部署到 Vercel

本项目已针对 Vercel 部署进行了优化。API 路由被设计为 Serverless 函数，遵循 Vercel 的最佳实践。

### 部署步骤

1. 将代码推送到 GitHub 仓库
2. 在 Vercel 上导入项目
3. 无需额外配置，Vercel 将自动识别 Next.js 项目并正确部署

## 本地开发

### 先决条件

- Node.js 18+ 及 npm

### 安装依赖

```bash
npm install
```

### 运行开发服务器

```bash
npm run dev
```

然后打开 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本

```bash
npm run build
```

### 运行生产版本

```bash
npm start
```

## 使用说明

1. **上传文件**: 点击"Upload Files"按钮上传一个或多个 Excel 文件
2. **比较表头**: 切换到"Compare Headers"选项卡，指定工作表索引和表头行，然后点击"Compare"
3. **合并文件**: 切换到"Merge Files"选项卡，指定工作表索引和表头行，然后点击"Merge"
4. **下载合并文件**: 合并完成后，点击"Download"按钮下载合并后的文件

## 与 Docker 版本的区别

与 Docker 版本相比，这个 Next.js 版本具有以下优势：

1. 更现代化的用户界面，使用 Material UI
2. 更好的类型安全，使用 TypeScript
3. 针对无服务器部署优化，可直接部署到 Vercel
4. 更好的文件上传体验，支持多文件上传和进度指示
5. 更好的错误处理和用户反馈

## 许可证

MIT 