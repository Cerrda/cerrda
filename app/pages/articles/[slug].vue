<script setup lang="ts">
import { PhArrowLeft } from '@phosphor-icons/vue'
import { getArticleMetaBySlug } from '~/utils/articles'
import { prefixHtmlLocalAssets, withAppBase } from '~/utils/withAppBase'

const route = useRoute()
const config = useRuntimeConfig()
const slug = computed(() => String(route.params.slug || ''))
const meta = computed(() => getArticleMetaBySlug(slug.value))

if (!meta.value) {
  throw createError({ statusCode: 404, statusMessage: '文章不存在' })
}

const { data: html } = await useAsyncData(`article-html-${slug.value}`, async () => {
  if (import.meta.server) {
    const fs = await import('node:fs/promises')
    const path = await import('node:path')
    const file = path.join(process.cwd(), 'public', 'articles', `${slug.value}.html`)
    return await fs.readFile(file, 'utf8')
  }
  return await $fetch<string>(withAppBase(`/articles/${slug.value}.html`, config.app.baseURL))
})

const articleHtml = computed(() => prefixHtmlLocalAssets(html.value || '', config.app.baseURL))

useSeoMeta({
  title: `${meta.value.title} · Cerrda`,
  description: meta.value.description,
})

const juejinUrl = computed(() => `https://juejin.cn/post/${meta.value?.id}`)
</script>

<template>
  <div class="relative min-h-[100dvh] select-none [&_*]:select-none" @selectstart.prevent>
    <SiteHeader />

    <article class="section-pad mx-auto max-w-3xl pt-32">
      <BlurReveal :delay="0.04" :duration="0.7" :y-offset="10" blur="8px">
        <nav aria-label="文章导航">
          <NuxtLink
            to="/#articles"
            class="group inline-flex items-center gap-3 rounded-full border border-border/50 bg-card/55 py-1.5 pr-4 pl-1.5 text-sm text-muted-foreground outline-none transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-primary/40 hover:bg-primary/8 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-[0.98]"
            aria-label="返回文章列表"
          >
            <span
              class="inline-flex size-8 items-center justify-center rounded-full border border-border/50 bg-background/70 text-foreground/80 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-x-0.5 group-hover:border-primary/45 group-hover:bg-primary/12 group-hover:text-primary"
              aria-hidden="true"
            >
              <PhArrowLeft :size="16" weight="bold" />
            </span>
            <span class="tracking-tight">文章列表</span>
          </NuxtLink>
        </nav>
      </BlurReveal>

      <BlurReveal>
        <h1 class="mt-8 font-display text-3xl leading-tight md:text-5xl">
          {{ meta?.title }}
        </h1>
        <p class="mt-4 text-sm text-muted-foreground">
          {{ meta?.date }}
        </p>
        <div class="mt-4 flex flex-wrap gap-2">
          <span v-for="tag in meta?.tags || []" :key="tag" class="rounded-full bg-secondary px-2.5 py-1 text-[11px]">
            {{ tag }}
          </span>
        </div>
      </BlurReveal>

      <ClientOnly v-if="articleHtml">
        <PretextArticle class="mt-10" :html="articleHtml" />
        <template #fallback>
          <div class="prose-article mt-10 space-y-4 text-base leading-8 text-foreground/90" v-html="articleHtml" />
        </template>
      </ClientOnly>
      <p v-else class="mt-10 text-muted-foreground">
        正文暂不可用。可先阅读
        <a class="text-primary underline-offset-4 hover:underline" :href="juejinUrl" target="_blank" rel="noreferrer">
          掘金原文
        </a>
        。
      </p>

      <div class="mt-12 border-t border-border/60 pt-6 text-sm text-muted-foreground">
        原文链接：
        <a class="text-primary underline-offset-4 hover:underline" :href="juejinUrl" target="_blank" rel="noreferrer">
          掘金
        </a>
      </div>
    </article>
  </div>
</template>

<style scoped>
.prose-article :deep(h2) {
  margin-top: 2rem;
  font-family: var(--font-display);
  font-size: 1.5rem;
}
.prose-article :deep(h3) {
  margin-top: 1.5rem;
  font-family: var(--font-display);
  font-size: 1.2rem;
}
.prose-article :deep(pre) {
  overflow-x: auto;
  border-radius: 1rem;
  background: color-mix(in oklch, var(--secondary) 80%, transparent);
  padding: 1rem;
  font-size: 0.85rem;
}
.prose-article :deep(code) {
  font-family: var(--font-mono);
}
.prose-article :deep(ul) {
  padding-left: 1.2rem;
  list-style: disc;
}
.prose-article :deep(p) {
  margin: 0.85rem 0;
}
.prose-article :deep(img) {
  display: block;
  width: 100%;
  height: auto;
  max-width: 100%;
  border-radius: 1rem;
}
.prose-article :deep(a) {
  color: var(--primary);
  text-underline-offset: 4px;
}
.prose-article :deep(table) {
  width: 100%;
  display: block;
  overflow-x: auto;
  border-collapse: collapse;
  font-size: 0.9rem;
}
.prose-article :deep(th),
.prose-article :deep(td) {
  border: 1px solid color-mix(in oklch, var(--border) 80%, transparent);
  padding: 0.5rem 0.75rem;
}

:deep(*) {
  user-select: none;
  -webkit-user-select: none;
}
</style>
