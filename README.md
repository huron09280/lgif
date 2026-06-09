# 🎁 macOS & Windows 智能 GIF 压缩大师 —— 安装与打包指南

这是一个基于 **Electron + React + TypeScript** 构建的桌面端 GIF 智能压缩工具。它支持在本地通过多线程并发运行 `gifsicle` 进行极速压缩，并提供丰富的控制参数（跳帧、色彩数、损耗率、抖动算法等）。

为了让普通用户能够像使用普通软件一样直接双击运行，而无需通过终端命令行，我们需要将项目**打包编译（Build & Package）**为 macOS 的 `.dmg` 或 Windows 的 `.exe` 安装包。

---

## 💻 一、普通用户安装与打开指南

当开发者打包完成后，会生成对应的安装文件，普通用户只需按照以下步骤安装即可。

### 🍎 1. macOS 系统（苹果电脑）

#### **安装步骤：**
1. 双击打开打包生成的 `macOS 智能 GIF 压缩大师-0.0.0.dmg` 文件。
2. 在弹出的窗口中，将 **`macOS 智能 GIF 压缩大师.app`** 拖拽到右侧的 **`Applications`（应用程序）** 文件夹中。
3. 拖拽完成后，即可关闭该窗口，并从 Launchpad（启动台）或“应用程序”文件夹中找到并打开它。

#### **⚠️ 首次打开报错“无法确认开发者身份”的解决方法：**
由于该应用是在本地构建且未经过苹果开发者签名（Notarized），首次打开时 macOS 会触发安全保护机制：
* **方法 A（最快）：** 
  1. 打开访达（Finder），进入“应用程序”文件夹。
  2. 找到本软件，按住键盘上的 `Control` 键并鼠标右键单击应用，选择 **“打开”**。
  3. 在弹出的新警告窗口中，会出现一个 **“打开”** 按钮，点击即可正常启动。后续双击即可直接打开，无需重复此操作。
* **方法 B：** 
  1. 直接双击打开，弹窗提示“无法打开”时点击“取消”。
  2. 依次进入 Mac 的 **“系统设置” -> “隐私与安全”**。
  3. 向下滚动到“安全性”板块，会看到提示 `已阻止打开“macOS 智能 GIF 压缩大师”，因为来自身份不明的开发者`。
  4. 点击旁边的 **“仍要打开”** 按钮，并输入您的 Mac 开机密码确认即可。

---

### 🌐 2. Windows 系统（电脑）

#### **安装步骤：**
1. 双击打包生成的 `macOS 智能 GIF 压缩大师 Setup 0.0.0.exe` 安装文件。
2. 软件会自动解压并完成安装（过程仅需数秒），并在您的电脑桌面生成 **`macOS 智能 GIF 压缩大师`** 的快捷方式。
3. 双击桌面的快捷方式图标，即可直接打开软件使用。

#### **⚠️ 首次打开触发 SmartScreen 拦截的解决方法：**
Windows 系统的 Defender 机制会对未经过数字证书签名的 `.exe` 执行警告：
1. 弹出蓝色警告窗口，提示 `Windows 已保护您的电脑`。
2. 点击窗口中的 **“更多信息”** 链接。
3. 窗口下方会多出一个 **“仍要运行”** 按钮，点击它即可顺利打开软件。

---

## 🛠️ 二、开发者编译与打包指南（如何制作安装包）

如果您是开发者，需要为其他用户生成 `.dmg` 或 `.exe` 文件，请遵循以下打包步骤：

### 1. 确保安装了打包依赖
本项目使用成熟的 `electron-builder` 进行打包，配置已集成于 [package.json](file:///Users/liangchao/Documents/antigravity/wise-lovelace/package.json) 中。
在终端执行以下命令安装依赖：
```bash
npm install
```

### 2. 编译并打包

#### **📂 生成 macOS 安装包 (`.dmg`)**
在 Mac 电脑的终端运行：
```bash
npm run dist -- --mac
```
> **输出位置：** 打包完成后，可在项目根目录自动生成的 `release/` 文件夹下找到 `.dmg` 以及 `.app` 文件。

#### **📂 生成 Windows 安装包 (`.exe`)**
建议在 Windows 系统中拉取代码并运行：
```bash
npm run dist -- --win
```
> **输出位置：** 打包完成后，在项目根目录的 `release/` 文件夹下生成 `macOS 智能 GIF 压缩大师 Setup 0.0.0.exe` 安装器。

---

## 📁 三、核心技术结构说明

* **核心入口**：[main.ts](file:///Users/liangchao/Documents/antigravity/wise-lovelace/electron/main.ts) —— 负责创建 Electron 渲染窗口，并通过 IPC 通信拦截并调度 Mac 本地的多线程 `gifsicle` 命令。
* **页面逻辑**：[App.tsx](file:///Users/liangchao/Documents/antigravity/wise-lovelace/src/App.tsx) —— 前端主架构，提供文件拖拽接入、并发压缩流程控制、成功横幅及文件保存位置调用。
* **参数面板**：[RightPanel.tsx](file:///Users/liangchao/Documents/antigravity/wise-lovelace/src/components/RightPanel.tsx) —— 手动调参（优化等级、色彩数、跳帧比例、抖动模式、透明度裁剪）的控制枢纽。
* **打包配置文件**：[package.json](file:///Users/liangchao/Documents/antigravity/wise-lovelace/package.json) 的 `"build"` 字段定义了输出名、asar 混淆压缩和目标格式。
