---
title: "Windows系统中使用fnm自动管理node版本"
description: "在 Windows 上用 Winget 安装 fnm，配置 PowerShell Profile，并用 fnm 安装、切换与默认 Node 版本。"
date: 2025-11-25
tags: ["fnm", "Node", "版本管理"]
juejin: https://juejin.cn/post/7576276707330981894
slug: fnm-windows
---

## 1. 安装 fnm

-   使用 Windows 包管理器 Winget：
    ```
    winget install Schniz.fnm
    ```
安装完成后，fnm 的可执行文件大致已在你的系统中，但 **还没完全“生效”** ，因为还要做 Shell 配置。
* * *
## 2. 配置 PowerShell
允许执行脚本 & 在配置文件里载入 fnm 环境命令。
### 2.1 允许执行脚本
打开 PowerShell（可用管理员权限，但一般「当前用户」级别就够）然后执行：
```
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
这样可以让你的用户可以执行脚本。
### 2.2 编辑 PowerShell 配置文件（Profile）
在 PowerShell 中运行以下命令以打开（或创建）你的 profile 文件：
```
if (!(Test-Path -Path $PROFILE)) { New-Item -ItemType File -Path $PROFILE -Force }
Invoke-Item $PROFILE
```
然后在这个文件末尾添加下面这行：
```
fnm env --use-on-cd --shell --resolve-engines powershell | Out-String | Invoke-Expression
```
这样做的目的：当你打开 PowerShell 或切换目录时，fnm 会设置好环境变量，以便 `node`/`npm` 路径正确并且切换版本生效。将 `package.json#engines#node` 视为有效的 Node.js 版本文件。然后关闭 PowerShell，再重新打开一个新窗口以让配置生效。
其他配置可见：https://github.com/Schniz/fnm/blob/master/docs/configuration.md
* * *
## 3. 使用 fnm 来安装 &切换 Node.js 版本
配置完毕后，就可以开始使用 fnm 来管理版本。下面是常用命令：
-   安装某个版本：
    ```
    fnm install 18.20.4
    # 或安装最新 LTS：
    fnm install --lts
    ```
-   切换使用某个版本（当前 shell 会话立即生效）：
    ```
    fnm use 18.20.4
    ```
-   查看当前使用的 Node 版本：
    ```
    fnm current
    ```
-   列出已安装版本：
    ```
    fnm ls
    ```
-   列出可安装的远程版本：
    ```
    fnm ls-remote
    ```
-   设置某个版本为默认：
    ```
    fnm default 22.13.1
    ```
-   在项目中指定版本：在项目根目录创建一个 `.node-version`（或 `.nvmrc`）文件，内容是版本号，例如 `v18.20.4`，然后每次进入该目录时 fnm 会自动切换（前提你配置了 `--use-on-cd`）
* * *
