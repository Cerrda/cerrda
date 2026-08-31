<script setup lang="ts">
import { PhArrowRight } from '@phosphor-icons/vue'
import { Motion } from 'motion-v'
import { articleMeta, careerTimeline, contactChannels, morphingRoles, packages, siteProfile, skills } from '~/data/site'

const timelineItems = careerTimeline.map((item) => ({
  id: `year-${item.title}`,
  label: item.title,
}))

const copiedChannelId = ref<string | null>(null)
let copiedResetTimer: ReturnType<typeof setTimeout> | undefined

const featuredArticle = computed(() => articleMeta[0])
const archiveArticles = computed(() => articleMeta.slice(1))

function articleIndex(n: number) {
  return String(n).padStart(2, '0')
}

/** 偶数两列；奇数 1+2 L 形 bento，不留空格。align=end 时镜像，避免与 packages 同构图。 */
function catalogGridClass(total: number) {
  return total % 2 === 1 ? 'mt-10 grid gap-6 lg:grid-cols-12' : 'mt-10 grid gap-6 lg:grid-cols-2'
}

function catalogItemClass(index: number, total: number, align: 'start' | 'end' = 'start') {
  if (total === 1) return 'lg:col-span-12'
  if (total % 2 === 0) return ''
  const mirror = align === 'end'
  if (index === 0) {
    return mirror ? 'lg:col-span-7 lg:col-start-6 lg:row-span-2' : 'lg:col-span-7 lg:row-span-2'
  }
  if (index === 1) {
    return mirror ? 'lg:col-span-5 lg:col-start-1 lg:row-start-1' : 'lg:col-span-5'
  }
  if (index === 2) {
    return mirror ? 'lg:col-span-5 lg:col-start-1 lg:row-start-2' : 'lg:col-span-5'
  }
  return 'lg:col-span-6'
}

function catalogFeatured(index: number, total: number) {
  return total % 2 === 1 && index === 0
}

async function copyContactValue(id: string, value: string) {
  try {
    await navigator.clipboard.writeText(value)
    copiedChannelId.value = id
    clearTimeout(copiedResetTimer)
    copiedResetTimer = setTimeout(() => {
      copiedChannelId.value = null
    }, 1600)
  } catch {
    copiedChannelId.value = null
  }
}

onBeforeUnmount(() => {
  clearTimeout(copiedResetTimer)
})
</script>

<template>
  <div class="relative min-h-[100dvh] overflow-x-hidden">
    <SiteHeader />

    <!-- Hero -->
    <section class="section-pad relative flex min-h-[100dvh] items-center pt-24">
      <div class="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div class="relative z-10">
          <BlurReveal :delay="0.08" :duration="0.9">
            <p class="eyebrow w-fit">Frontend · Agent · DX</p>
          </BlurReveal>
          <BlurReveal :delay="0.16" :duration="0.95">
            <h1 class="mt-6 font-display text-5xl leading-[0.95] tracking-tight md:text-7xl">
              {{ siteProfile.name }}
            </h1>
          </BlurReveal>
          <div class="relative mt-5 max-w-xl overflow-hidden">
            <ClientOnly>
              <MorphingText
                :texts="morphingRoles"
                class="!mx-0 !h-12 !max-w-full !text-left !text-2xl !leading-tight md:!h-14 md:!text-3xl lg:!text-3xl"
              />
            </ClientOnly>
          </div>
          <BlurReveal :delay="0.28" :duration="1">
            <p class="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              {{ siteProfile.tagline }}
            </p>
          </BlurReveal>
          <BlurReveal :delay="0.36" :duration="1">
            <div class="mt-8 flex flex-wrap gap-3">
              <NuxtLink to="/packages">
                <InteractiveHoverButton text="查看开源" />
              </NuxtLink>
              <NuxtLink to="/articles">
                <InteractiveHoverButton text="阅读文章" class="border-primary/30 bg-primary text-primary-foreground" />
              </NuxtLink>
            </div>
          </BlurReveal>
        </div>

        <HeroParticleCard />
      </div>
    </section>

    <!-- About / LightSpeed -->
    <section id="about" class="section-pad">
      <div class="mx-auto max-w-6xl">
        <BlurReveal>
          <p class="eyebrow w-fit">About</p>
          <h2 class="mt-4 font-display text-3xl md:text-5xl">把工程判断，写成可安装的工具与 Skill</h2>
          <p class="mt-3 max-w-2xl text-muted-foreground">
            {{ siteProfile.bio }}
          </p>
        </BlurReveal>

        <div class="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <ClientOnly>
            <CssLiquidGlass class="pointer-events-none" container-class="min-h-72" :radius="32">
              <template #media>
                <LightSpeed
                  class="absolute inset-0 min-h-72 cursor-pointer"
                  :effect-options="{
                    distortion: 'turbulentDistortion',
                    length: 400,
                    cullFace: 'None',
                    fov: 90,
                    fovSpeedUp: 150,
                    speedUp: 2,
                  }"
                />
              </template>
              <div class="pointer-events-none absolute inset-x-0 bottom-0 px-6 pb-2.5 md:px-7 md:pb-3">
                <p class="font-display text-xl drop-shadow-[0_1px_8px_rgb(0_0_0_/_0.55)]">DX to Agent Skills</p>
                <p class="mt-1 text-sm text-muted-foreground drop-shadow-[0_1px_8px_rgb(0_0_0_/_0.55)]">
                  从远程类型同步，到可安装的 Agent 工作流
                </p>
              </div>
            </CssLiquidGlass>
          </ClientOnly>

          <TracingBeam class="min-h-[22rem] px-2 md:px-6">
            <div class="space-y-10 py-2 pl-10 md:pl-14">
              <div>
                <h3 class="font-display text-xl">前端工程</h3>
                <p class="mt-2 text-muted-foreground">
                  Vue 自定义指令、UnoCSS 图标热更新、Vite 远程类型插件与 OpenAPI
                  请求生成。把中后台里反复出现的摩擦，收敛成一次配置、长期复用的工具链。
                </p>
              </div>
              <div>
                <h3 class="font-display text-xl">Agent 基础设施</h3>
                <p class="mt-2 text-muted-foreground">
                  Skill 不是 README 的另一种写法，而是可版本化的约束与流程：触发条件、硬性规则、assets
                  模板与合规边界，上架 skills.sh 后安装即可执行。
                </p>
              </div>
              <div>
                <h3 class="font-display text-xl">交付原则</h3>
                <p class="mt-2 text-muted-foreground">
                  先把问题抽象成工具，再把边界写清楚：它解决什么，以及明确不解决什么。
                </p>
              </div>
            </div>
          </TracingBeam>
        </div>
      </div>
    </section>

    <!-- Packages -->
    <section id="packages" class="section-pad">
      <div class="mx-auto max-w-6xl">
        <BlurReveal>
          <p class="eyebrow w-fit">Open Source</p>
          <h2 class="mt-4 font-display text-3xl md:text-5xl">开源工具链</h2>
          <p class="mt-3 max-w-2xl text-muted-foreground">
            自研 Vite 插件与部署级主题，并参与维护面向大型 API 面的 OpenAPI 请求生成器。
          </p>
        </BlurReveal>

        <div :class="catalogGridClass(packages.length)">
          <Motion
            v-for="(pkg, index) in packages"
            :key="pkg.name"
            :class="catalogItemClass(index, packages.length)"
            :initial="{ opacity: 0, y: 24 }"
            :while-in-view="{ opacity: 1, y: 0 }"
            :transition="{ delay: Math.min(index * 0.08, 0.2), duration: 0.7, ease: [0.32, 0.72, 0, 1] }"
            :viewport="{ once: true, amount: 0.25 }"
          >
            <CssLiquidGlass class="h-full rounded-[1.75rem]" container-class="h-full rounded-[1.75rem]" :radius="28">
              <div
                :class="[
                  'flex h-full flex-col rounded-[1.5rem]',
                  catalogFeatured(index, packages.length) ? 'p-6 md:p-8 lg:p-9' : 'p-6 md:p-7',
                ]"
              >
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    class="rounded-full bg-primary/15 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-primary"
                  >
                    {{ pkg.role }}
                  </span>
                  <span class="text-xs text-muted-foreground">v{{ pkg.version }}</span>
                </div>
                <h3
                  :class="[
                    'mt-4 font-display tracking-tight',
                    catalogFeatured(index, packages.length) ? 'text-2xl md:text-3xl' : 'text-2xl',
                  ]"
                >
                  <LinkPreview
                    :url="pkg.href"
                    :width="240"
                    :height="150"
                    link-class="underline decoration-primary/35 underline-offset-4 transition hover:text-primary hover:decoration-primary"
                  >
                    {{ pkg.name }}
                  </LinkPreview>
                </h3>
                <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {{ pkg.summary }}
                </p>
                <ul class="mt-5 space-y-2 text-sm text-muted-foreground">
                  <li v-for="point in pkg.points" :key="point" class="flex gap-2">
                    <span class="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{{ point }}</span>
                  </li>
                </ul>
                <div :class="catalogFeatured(index, packages.length) ? 'mt-auto pt-8' : 'mt-6'">
                  <NuxtLink :to="pkg.href" target="_blank" external>
                    <InteractiveHoverButton text="查看包详情" />
                  </NuxtLink>
                </div>
              </div>
            </CssLiquidGlass>
          </Motion>
        </div>
      </div>
    </section>

    <!-- Skills -->
    <section id="skills" class="section-pad">
      <div class="mx-auto max-w-6xl">
        <BlurReveal>
          <div class="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p class="eyebrow w-fit">Agent Skills</p>
              <h2 class="mt-4 font-display text-3xl md:text-5xl">上架 skills.sh 的工程化 Skill</h2>
              <p class="mt-3 max-w-2xl text-muted-foreground">
                把 Mock 联调与配置驱动采集写成可安装、可版本化的 Agent 工作流，含触发条件、硬性规则与合规边界。
              </p>
            </div>
            <LinkPreview
              :url="siteProfile.links.skills"
              :width="240"
              :height="150"
              class="-mx-3 -my-2"
              link-class="inline-flex min-h-11 items-center rounded-lg px-3 py-2.5 font-mono text-sm text-muted-foreground underline decoration-primary/30 underline-offset-4 transition hover:bg-accent/60 hover:text-primary hover:decoration-primary"
            >
              skills.sh/cerrda
            </LinkPreview>
          </div>
        </BlurReveal>

        <div :class="catalogGridClass(skills.length)">
          <Motion
            v-for="(skill, index) in skills"
            :key="skill.name"
            :class="catalogItemClass(index, skills.length, 'end')"
            :initial="{ opacity: 0, y: 24 }"
            :while-in-view="{ opacity: 1, y: 0 }"
            :transition="{ delay: Math.min(index * 0.08, 0.2), duration: 0.7, ease: [0.32, 0.72, 0, 1] }"
            :viewport="{ once: true, amount: 0.25 }"
          >
            <CssLiquidGlass class="h-full rounded-[1.75rem]" container-class="h-full rounded-[1.75rem]" :radius="28">
              <article
                :class="[
                  'flex h-full flex-col',
                  catalogFeatured(index, skills.length) ? 'p-6 md:p-8 lg:p-9' : 'p-6 md:p-7',
                ]"
              >
                <div class="flex items-center justify-between gap-3">
                  <span class="text-[10px] uppercase tracking-[0.18em] text-primary">skills.sh</span>
                  <span class="font-mono text-[11px] text-muted-foreground">0{{ index + 1 }}</span>
                </div>

                <h3
                  :class="[
                    'mt-4 font-display tracking-tight',
                    catalogFeatured(index, skills.length) ? 'text-2xl md:text-3xl' : 'text-2xl',
                  ]"
                >
                  <LinkPreview
                    :url="skill.href"
                    :width="240"
                    :height="150"
                    link-class="underline decoration-primary/35 underline-offset-4 transition hover:text-primary hover:decoration-primary"
                  >
                    {{ skill.name }}
                  </LinkPreview>
                </h3>

                <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {{ skill.summary }}
                </p>

                <ul class="mt-5 space-y-2.5">
                  <li
                    v-for="point in skill.points"
                    :key="point"
                    class="flex gap-2.5 text-sm leading-snug text-muted-foreground"
                  >
                    <span class="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{{ point }}</span>
                  </li>
                </ul>

                <code
                  class="mt-auto block overflow-x-auto rounded-xl bg-secondary/80 px-3 py-2.5 font-mono text-[11px] leading-relaxed text-foreground"
                >
                  {{ skill.install }}
                </code>
              </article>
            </CssLiquidGlass>
          </Motion>
        </div>
      </div>
    </section>

    <!-- Articles -->
    <section id="articles" class="section-pad">
      <div class="mx-auto max-w-6xl">
        <BlurReveal :blur="'0px'" :y-offset="16">
          <div class="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p class="eyebrow w-fit">Writing</p>
              <h2 class="mt-4 font-display text-3xl md:text-5xl">文章</h2>
              <p class="mt-3 max-w-2xl text-muted-foreground">
                工程实践记录。覆盖 Vue 指令体系、中后台性能、图标工具链，以及 Agent Skill 的设计与上架。
              </p>
            </div>
            <p class="font-display text-5xl leading-none text-primary/25 md:text-6xl">
              {{ articleIndex(articleMeta.length) }}
            </p>
          </div>
        </BlurReveal>

        <!-- Featured -->
        <Motion
          v-if="featuredArticle"
          :initial="{ opacity: 0, y: 28 }"
          :while-in-view="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.85, ease: [0.32, 0.72, 0, 1] }"
          :viewport="{ once: true, amount: 0.25 }"
          class="mt-12"
        >
          <CssLiquidGlass class="rounded-[2rem]" container-class="rounded-[2rem]" :radius="32">
            <NuxtLink
              :to="`/articles/${featuredArticle.slug}`"
              class="group relative block overflow-hidden rounded-[2rem] p-6 md:p-9 lg:p-10"
            >
              <div class="article-orb article-orb-tr" aria-hidden="true" />
              <div class="article-orb article-orb-bl" aria-hidden="true" />

              <div class="relative grid gap-8 lg:grid-cols-[auto_1fr_auto] lg:items-end">
                <span
                  class="font-display text-6xl leading-none tracking-tight text-primary/30 transition duration-500 group-hover:text-primary/55 md:text-8xl"
                >
                  {{ articleIndex(1) }}
                </span>

                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <span
                      class="rounded-full bg-primary/15 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-primary"
                    >
                      Latest
                    </span>
                    <span
                      v-for="tag in featuredArticle.tags"
                      :key="tag"
                      class="rounded-full border border-border/60 bg-background/40 px-2.5 py-1 text-[11px] text-muted-foreground"
                    >
                      {{ tag }}
                    </span>
                  </div>
                  <h3
                    class="mt-4 max-w-3xl font-display text-2xl leading-snug tracking-tight transition duration-500 group-hover:text-primary md:text-4xl"
                  >
                    {{ featuredArticle.title }}
                  </h3>
                  <p class="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                    {{ featuredArticle.description }}
                  </p>
                </div>

                <div class="flex flex-col items-start gap-4 lg:items-end">
                  <time class="font-mono text-xs tracking-wide text-muted-foreground">
                    {{ featuredArticle.date }}
                  </time>
                  <InteractiveHoverButton text="阅读全文" />
                </div>
              </div>
            </NuxtLink>
          </CssLiquidGlass>
        </Motion>

        <!-- Archive -->
        <div class="mt-6 space-y-3 md:mt-8">
          <Motion
            v-for="(article, index) in archiveArticles"
            :key="article.id"
            :initial="{ y: 16 }"
            :while-in-view="{ y: 0 }"
            :transition="{ delay: Math.min(index * 0.04, 0.32), duration: 0.65, ease: [0.32, 0.72, 0, 1] }"
            :viewport="{ once: true, amount: 0.15 }"
          >
            <CardSpotlight class="transition duration-500 hover:border-primary/30" :gradient-size="320">
              <NuxtLink
                :to="`/articles/${article.slug}`"
                class="flex flex-col gap-4 p-5 md:flex-row md:items-center md:gap-6 md:p-6"
              >
                <span
                  class="font-display text-3xl leading-none text-primary/45 transition duration-500 group-hover:text-primary/70 md:w-14 md:shrink-0 md:text-4xl"
                >
                  {{ articleIndex(index + 2) }}
                </span>

                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="tag in article.tags"
                      :key="tag"
                      class="rounded-full bg-primary/12 px-2.5 py-1 text-[11px] text-foreground/75"
                    >
                      {{ tag }}
                    </span>
                  </div>
                  <h3
                    class="mt-2.5 font-display text-lg leading-snug tracking-tight transition duration-500 group-hover:text-primary md:text-xl"
                  >
                    {{ article.title }}
                  </h3>
                  <p
                    class="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground transition duration-500 md:line-clamp-1 md:opacity-70 md:group-hover:opacity-100"
                  >
                    {{ article.description }}
                  </p>
                </div>

                <div
                  class="flex items-center justify-between gap-4 md:w-36 md:shrink-0 md:flex-col md:items-end md:justify-center"
                >
                  <time class="font-mono text-xs tracking-wide text-muted-foreground">
                    {{ article.date }}
                  </time>
                  <span
                    class="inline-flex size-9 items-center justify-center rounded-full border border-border/50 text-muted-foreground/70 transition duration-500 group-hover:border-primary/45 group-hover:bg-primary/10 group-hover:text-primary group-hover:translate-x-0.5"
                    aria-hidden="true"
                  >
                    <PhArrowRight :size="16" weight="bold" />
                  </span>
                </div>
              </NuxtLink>
            </CardSpotlight>
          </Motion>
        </div>
      </div>
    </section>

    <!-- Timeline -->
    <section id="timeline" class="section-pad">
      <div class="mx-auto max-w-6xl">
        <ClientOnly>
          <Timeline
            title="轨迹"
            description="从 Vue 指令与中后台性能，到 Vite 插件、OpenAPI 工具链，以及上架 skills.sh 的可安装 Agent Skill。"
            :items="timelineItems"
          >
            <template v-for="item in careerTimeline" :key="item.title" #[`year-${item.title}`]>
              <div class="relative w-full pl-16 md:pl-4">
                <h3 class="mb-3 text-left text-2xl font-bold text-muted-foreground md:hidden">
                  {{ item.title }}
                </h3>
                <p class="mb-2 font-display text-xl tracking-tight text-foreground md:text-2xl">
                  {{ item.headline }}
                </p>
                <p class="max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
                  {{ item.content }}
                </p>
              </div>
            </template>
          </Timeline>
        </ClientOnly>
      </div>
    </section>

    <!-- Contact / Modal -->
    <section id="contact" class="section-pad">
      <div class="mx-auto max-w-6xl">
        <BlurReveal>
          <p class="eyebrow w-fit">Connect</p>
          <h2 class="mt-4 font-display text-3xl md:text-5xl">开源合作与技术交流</h2>
          <p class="mt-3 max-w-2xl text-muted-foreground">
            前端工程化、Agent Skill 与开源工具链。邮箱直接联系，仓库与 Skill 可公开查阅。
          </p>
        </BlurReveal>

        <CssLiquidGlass class="h-full" container-class="mt-10 rounded-[2rem]" :radius="32">
          <div
            class="relative flex h-full min-h-[16rem] flex-col justify-center overflow-hidden rounded-[2rem] p-8 md:min-h-[18rem] md:p-10"
          >
            <div
              class="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-primary/15 blur-3xl"
              aria-hidden="true"
            />
            <div
              class="pointer-events-none absolute -bottom-24 left-1/3 size-64 rounded-full bg-accent/40 blur-3xl dark:bg-primary/10"
              aria-hidden="true"
            />

            <div class="relative grid h-full gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <p class="text-xs uppercase tracking-[0.22em] text-muted-foreground">Contact</p>
                <h3 class="mt-3 font-display text-2xl md:text-4xl">联系方式</h3>
                <p class="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
                  邮箱用于项目合作与技术交流。开源仓库、文章与可安装 Skill 分别在 GitHub、掘金与 skills.sh。
                </p>

                <ul class="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                  <li v-for="channel in contactChannels" :key="channel.id" class="flex items-center gap-2">
                    <span class="size-1.5 rounded-full bg-primary" />
                    <span>{{ channel.label }}</span>
                  </li>
                </ul>
              </div>

              <div class="w-full sm:w-auto lg:justify-self-end">
                <AnimatedModal>
                  <AnimatedModalTrigger as="div" class="!rounded-none !p-0">
                    <InteractiveHoverButton text="打开联系方式" class="w-full sm:w-auto" />
                  </AnimatedModalTrigger>
                  <AnimatedModalBody
                    class="w-[min(32rem,calc(100vw-32px))] border-border bg-card dark:border-border dark:bg-card"
                  >
                    <AnimatedModalContent class="p-6 md:p-7">
                      <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground">Direct contact</p>
                      <h3 class="mt-3 font-display text-2xl md:text-3xl">
                        {{ siteProfile.name }}
                      </h3>
                      <p class="mt-2 text-sm text-muted-foreground">
                        {{ siteProfile.role }} · {{ siteProfile.location }}
                      </p>

                      <ul class="mt-6 space-y-3">
                        <li
                          v-for="channel in contactChannels"
                          :key="channel.id"
                          class="flex items-start justify-between gap-3 border-b border-border/60 pb-3 last:border-b-0 last:pb-0"
                        >
                          <div class="min-w-0">
                            <p class="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                              {{ channel.label }}
                            </p>
                            <a
                              :href="channel.href"
                              :target="channel.id === 'email' ? undefined : '_blank'"
                              :rel="channel.id === 'email' ? undefined : 'noopener noreferrer'"
                              class="mt-1 block truncate font-medium text-foreground underline decoration-primary/30 underline-offset-4 transition hover:text-primary hover:decoration-primary"
                            >
                              {{ channel.value }}
                            </a>
                            <p class="mt-1 text-xs text-muted-foreground">
                              {{ channel.hint }}
                            </p>
                          </div>
                          <AnimatedTooltip :open="copiedChannelId === channel.id" title="复制成功">
                            <button
                              type="button"
                              class="shrink-0 rounded-full border border-border/70 px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                              @click="copyContactValue(channel.id, channel.value)"
                            >
                              复制
                            </button>
                          </AnimatedTooltip>
                        </li>
                      </ul>

                      <AnimatedModalFooter>
                        <AnimatedTooltip
                          :open="copiedChannelId === 'email-cta'"
                          title="邮箱地址复制成功"
                          :subtitle="siteProfile.email"
                        >
                          <InteractiveHoverButton
                            text="发送邮件"
                            class="border-primary/30 bg-primary text-primary-foreground"
                            @click="copyContactValue('email-cta', siteProfile.email)"
                          />
                        </AnimatedTooltip>
                        <NuxtLink :to="siteProfile.links.github" target="_blank" external>
                          <InteractiveHoverButton text="GitHub" />
                        </NuxtLink>
                      </AnimatedModalFooter>
                    </AnimatedModalContent>
                  </AnimatedModalBody>
                </AnimatedModal>
              </div>
            </div>
          </div>
        </CssLiquidGlass>
      </div>
    </section>

    <footer class="border-t border-border/50 px-4 py-10 text-center text-sm text-muted-foreground">
      © {{ new Date().getFullYear() }} {{ siteProfile.name }} · Built with Nuxt
    </footer>
  </div>
</template>
