---
title: "一行代码解决文本溢出提示：Vue 3 + Element Plus 打造智能 v-ellipsis-tooltip 指令"
description: "在 B 端业务开发中，表格和列表是出现频率极高的场景。我们经常遇到这样的需求： “当文本内容过长导致显示省略号时，鼠标悬停显示完整内容的 Tooltip；如果文本未溢出，则不显示 Tooltip。”"
date: 2026-01-22
tags: ["Vue", "指令", "Tooltip", "省略号"]
juejin: https://juejin.cn/post/7597704040216215578
slug: v-ellipsis-tooltip
---

## 前言

在 B 端业务开发中，表格和列表是出现频率极高的场景。我们经常遇到这样的需求：
**“当文本内容过长导致显示省略号时，鼠标悬停显示完整内容的 Tooltip；如果文本未溢出，则不显示 Tooltip。”**

通常的做法是：

1. 给元素设置 CSS 省略样式。
2. 套一层 `el-tooltip`。
3. 通过 `disabled` 属性控制是否显示。

但是，手动计算 `disabled` 状态非常繁琐，需要获取 DOM 元素判断 `scrollWidth > clientWidth`，如果在表格中使用，每个单元格都要写一套逻辑，代码重复率极高且难以维护。

今天，我们来封装一个 Vue 3 自定义指令 `v-ellipsis-tooltip`，彻底解决这个问题。

## 核心思路

我们的目标是实现一个指令，挂载到元素上即可自动检测溢出并挂载 Tooltip。

核心步骤如下：

1. **检测溢出**：比较元素的 `scrollWidth` 和 `clientWidth`。
2. **动态渲染**：如果溢出，使用 Vue 的 `h` 函数和 `render` 函数动态创建一个 `ElTooltip` 组件。
3. **状态管理**：使用 `WeakMap` 存储每个 DOM 元素对应的 Tooltip 实例和状态，防止内存泄漏。
4. **响应式更新**：利用 `ResizeObserver` 监听元素尺寸变化，实时更新 Tooltip 状态。

## 代码实现

以下是完整的指令实现代码。注意项目中使用了 `unplugin-auto-import`，所以 `h`、`DirectiveBinding` 等 API 是自动导入的。如果你没有配置自动导入，请手动补充 import。

```typescript
import type { ElTooltipProps } from 'element-plus'
import type { Directive, DirectiveBinding } from 'vue'
import { ElTooltip } from 'element-plus'
import { render, h } from 'vue' // 如果没有自动导入，需要手动引入 h

type TooltipValue = string | (Partial<ElTooltipProps> & { content?: string, observe?: boolean })

interface TooltipContext {
  container: HTMLElement
  binding: DirectiveBinding<TooltipValue>
  observer?: ResizeObserver
}

// 使用 WeakMap 存储上下文，避免直接修改 DOM 对象类型和使用 any
const contextMap = new WeakMap<HTMLElement, TooltipContext>()

/**
 * 核心渲染逻辑：根据溢出状态和配置渲染 Tooltip
 */
const renderTooltip = (el: HTMLElement, binding: DirectiveBinding<TooltipValue>) => {
  const { value, instance } = binding
  // 1. 检测溢出
  // scrollWidth > clientWidth 说明水平方向溢出
  // scrollHeight > clientHeight 说明垂直方向溢出（针对多行省略场景）
  const isOverflow = el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight

  // 2. 解析配置
  let content = ''
  let props: Partial<ElTooltipProps> = {}

  if (typeof value === 'string') {
    content = value
  }
  else if (value && typeof value === 'object') {
    content = value.content ?? ''
    props = value
  }

  // 如果没有提供 content，回退到元素文本
  if (!content) {
    content = el.textContent || ''
  }

  // 3. 创建 Virtual Tooltip
  // 利用 Element Plus 的 virtualTriggering 能力，将 Tooltip 绑定到当前元素
  const vnode = h(ElTooltip, {
    virtualTriggering: true,
    virtualRef: el,
    placement: 'top',
    ...props,
    content,
    disabled: props.disabled ?? !isOverflow, // 优先使用用户配置，否则根据溢出状态自动控制
  })

  // 注入上下文以继承全局配置（如 Element Plus 的 ConfigProvider）
  if (instance && instance.$) {
    vnode.appContext = instance.$.appContext
  }

  // 4. 渲染到内存中的 container
  const ctx = contextMap.get(el)
  if (ctx) {
    render(vnode, ctx.container)
  }
}

/**
 * 管理 ResizeObserver 的启用/禁用
 */
const manageObserver = (el: HTMLElement, binding: DirectiveBinding<TooltipValue>, ctx: TooltipContext) => {
  // 支持通过指令值或修饰符开启监听
  const shouldObserve = (typeof binding.value === 'object' && binding.value?.observe) || binding.modifiers.observe

  if (shouldObserve) {
    if (ctx.observer) {
      return
    }
    // 当元素尺寸变化时，重新检测溢出状态
    ctx.observer = new ResizeObserver(() => renderTooltip(el, ctx.binding))
    ctx.observer.observe(el)
  }
  else {
    if (!ctx.observer) {
      return
    }
    ctx.observer.disconnect()
    ctx.observer = undefined
  }
}

export const vEllipsisTooltip: Directive<HTMLElement, TooltipValue, 'observe'> = {
  mounted(el: HTMLElement, binding: DirectiveBinding<TooltipValue>) {
    const ctx: TooltipContext = {
      container: document.createElement('div'), // 创建一个游离的 div 作为渲染容器
      binding,
      observer: undefined,
    }
    contextMap.set(el, ctx)

    manageObserver(el, binding, ctx)
    renderTooltip(el, binding)
  },

  updated(el: HTMLElement, binding: DirectiveBinding<TooltipValue>) {
    const ctx = contextMap.get(el)
    if (!ctx) {
      return
    }
    ctx.binding = binding
    manageObserver(el, binding, ctx)
    renderTooltip(el, binding)
  },

  beforeUnmount(el: HTMLElement) {
    const ctx = contextMap.get(el)
    if (!ctx) {
      return
    }
    ctx.observer?.disconnect()
    render(null, ctx.container) // 卸载组件，触发 unmounted 生命周期
    contextMap.delete(el)
  },
}
```

## 使用方法

### 1. 基础用法

最简单的场景，直接加上 `v-ellipsis-tooltip`。注意元素本身需要有 CSS 省略样式（`overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`）。

```html
<div 
  class="truncate w-200px" 
  v-ellipsis-tooltip
>
  这段文字很长很长，如果超出会显示省略号，并且鼠标悬停会有 Tooltip。
</div>
```

### 2. 自定义内容

如果你希望 Tooltip 显示的内容与元素文本不同，可以传入字符串。

```html
<div 
  class="truncate w-200px" 
  v-ellipsis-tooltip="'这是自定义的 Tooltip 内容'"
>
  显示的文本...
</div>
```

### 3. 传递 Element Plus Props

需要配置 `placement`、`effect` 等属性时，传入对象即可。

```html
<div 
  class="truncate w-200px" 
  v-ellipsis-tooltip="{ 
    content: '深色主题提示', 
    effect: 'dark', 
    placement: 'bottom' 
  }"
>
  显示的文本...
</div>
```

### 4. 响应式监听 (ResizeObserver)

如果容器宽度是动态变化的（例如拖拽改变列宽），普通的检测可能只在 `mounted` 时生效。加上 `.observe` 修饰符，让指令监听元素尺寸变化，实时更新 Tooltip 状态。

```html
<div 
  class="truncate" 
  style="width: 50%"
  v-ellipsis-tooltip.observe
>
  宽度变化时会自动重新计算是否溢出
</div>
```

## 遇到的坑与细节

1.  **Context 丢失问题**：在使用 `render` 函数手动渲染组件时，新组件会丢失当前的 `appContext`，导致无法获取全局配置（如 Element Plus 的 `locale` 或 `z-index` 配置）。解决方案是将 `vnode.appContext` 指向 `instance.$.appContext`。
2.  **Virtual Triggering**：Element Plus 的 `ElTooltip` 支持 `virtual-triggering` 模式，这使得我们可以不改变 DOM 结构，直接将 Tooltip 逻辑附加到现有元素上，非常适合指令封装。
3.  **内存泄漏**：一定要在 `beforeUnmount` 中销毁 `ResizeObserver` 和 `render(null, container)`，并清理 `WeakMap`。

## 总结

通过这个指令，我们成功将“溢出检测”与“Tooltip 显示”逻辑解耦，保持了模板的整洁。在表格、卡片列表等密集展示数据的场景下，极大地提升了开发效率和用户体验。

---

**希望这篇文章对你有帮助！如果觉得有用，请点赞收藏支持一下~**
