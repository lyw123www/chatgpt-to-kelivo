# ChatGPT 导出工具

一个强大的浏览器扩展，可以将 ChatGPT 对话导出到多个本地应用。支持三种导出模式，满足不同的使用需求。

> ⚠️ **重要提示**：首次使用时，浏览器会弹出请求复制权限的提示。此时导出会失败，这是正常现象。请允许权限后，**重新点击导出按钮**即可成功导出。

## � 安装步骤

### 1. 下载安装包

从 [Releases](https://github.com/lyw123www/chatgpt-to-kelivo/releases/tag/v1.0.0) 下载最新版本并解压。

### 2. 安装浏览器扩展

1. 打开 Chrome 浏览器，访问 `chrome://extensions/`
2. 打开右上角的"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择 `browser-extension` 文件夹
5. 扩展安装完成
6. 点击扩展图标，配置助手名称和服务器地址

---

## 🎯 三种导出模式

### 模式 1️⃣：导出为 MD 文件（推荐首选）

**特点**：
- ✅ 无需任何前置配置
- ✅ 不依赖外部服务
- ✅ 生成带元数据的 Markdown 文件
- ✅ 可用于多种用途

**使用步骤**：
1. 打开 ChatGPT 对话
2. 点击页面右侧的 **🟢 绿色"导出为 MD"按钮**
3. 文件会自动下载到本地


### 模式 2️⃣：导出到 Kelivo

**前置要求**：
- 安装 [Kelivo](https://github.com/Chevey339/kelivo) 本地应用
- 运行 `kelivo_import_server.exe` 启动导入服务器
- 导入时必须关闭 Kelivo 应用

**使用步骤**：
1. **启动服务器**：双击运行 `kelivo_import_server.exe`
   - 服务器会在后台运行，监听 `http://localhost:8765`
   - 会显示"服务器已启动"提示

2. **关闭 Kelivo 应用**：⚠️ 这一步很重要

3. **打开 ChatGPT 对话**：访问 https://chatgpt.com

4. **点击导出按钮**：页面右侧会出现 **🟣 紫色"导出到 Kelivo"按钮**

5. **等待导出完成**：
   - 扩展会自动提取对话内容
   - 生成 Markdown 格式
   - 发送到本地服务器
   - Kelivo 自动导入

6. **查看结果**：打开 Kelivo 应用查看导入的对话

**故障排查**：
- ❌ 提示"服务器未运行"？→ 检查是否启动了 `kelivo_import_server.exe`
- ❌ 提示"Kelivo 应用正在运行"？→ 关闭 Kelivo 应用后重试

---

### 模式 3️⃣：导出到 Cherry Studio

**前置要求**：
- 已安装 Cherry Studio
- 已完成**模式 1**（导出 MD 文件）

**使用步骤**：

**第一步**：导出 MD 文件
1. 按照**模式 1**的步骤导出 MD 文件
2. 记住文件保存位置

**第二步**：导入到 Cherry Studio
1. 双击运行 `cherry-import.exe`
2. 选择第一步导出的 MD 文件
3. 选择目标助手
4. 点击导入
5. 打开 Cherry Studio 查看导入的对话

