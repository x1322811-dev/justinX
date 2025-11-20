# 构建脚本使用指南

## 🚀 构建脚本

使用 `scripts/generate.js` 构建工具。

### 📋 可用命令

```bash
npm run build                     # 构建所有工具
npm run build:force              # 强制构建所有工具
npm run build:tool <name>        # 构建指定工具
npm run watch                    # 监听模式
npm run list                     # 列出所有工具
npm run clean                    # 清理构建输出
```

### 🎯 使用示例

```bash
# 构建所有工具
npm run build

# 构建指定工具
npm run build:tool translator
npm run build:tool whitenoise

# 强制重建所有工具
npm run build:force

# 监听文件变化自动构建
npm run watch

# 清理构建产物
npm run clean
```

### 🛠️ 故障排除

如果遇到问题：

1. **清理构建产物**: `npm run clean`
2. **强制重建**: `npm run build:force`
3. **检查配置**: 确认 `tools.config.json` 格式正确