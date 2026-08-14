<script setup lang="ts">
import { PhArrowRight } from '@phosphor-icons/vue'
import { Motion } from 'motion-v'
import {
  articleMeta,
  careerTimeline,
  contactChannels,
  morphingRoles,
  packages,
  projects,
  siteProfile,
  skills,
} from '~/data/site'

const gridItems = projects.map((p) => ({
  title: p.title,
  subtitle: p.subtitle,
  tag: p.highlight,
}))

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
    <ClientOnly>
      <SmoothCursor />
    </ClientOnly>

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
              <NuxtLink href="#projects">
                <InteractiveHoverButton text="查看项目" />
              </NuxtLink>
              <NuxtLink href="#articles">
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
          <h2 class="mt-4 font-display text-3xl md:text-5xl">工程化直觉，写进工具与 Skill</h2>
        </BlurReveal>

        <div class="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <ClientOnly>
            <div
              class="relative min-h-72 overflow-hidden rounded-[2rem] border border-border/50 bg-card/35 dark:bg-card/25"
            >
              <LightSpeed
                class="absolute inset-0 z-0 min-h-72 cursor-pointer"
                :effect-options="{
                  distortion: 'turbulentDistortion',
                  length: 400,
                  cullFace: 'None',
                  fov: 90,
                  fovSpeedUp: 150,
                  speedUp: 2,
                }"
              />
              <div
                class="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-background via-background/20 to-transparent"
              />
              <div class="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-6">
                <p class="font-display text-xl">Speed of craft</p>
                <p class="mt-2 text-sm text-muted-foreground">按住加速 · 从远程类型同步到 Agent 工作流</p>
              </div>
            </div>
          </ClientOnly>

          <TracingBeam class="min-h-[22rem] px-2 md:px-6">
            <div class="space-y-10 py-2 pl-10 md:pl-14">
              <div>
                <h3 class="font-display text-xl">前端工程</h3>
                <p class="mt-2 text-muted-foreground">
                  Vue 指令体系、UnoCSS 图标工具链、Vite 插件与 OpenAPI 代码生成——把日常摩擦变成一次配置、长期收益。
                </p>
              </div>
              <div>
                <h3 class="font-display text-xl">Agent 开发</h3>
                <p class="mt-2 text-muted-foreground">
                  Skill 不是 README 的另一种写法，而是可版本化的约束与流程：触发描述、硬性规则、assets 模板与合规边界。
                </p>
              </div>
              <div>
                <h3 class="font-display text-xl">作品观</h3>
                <p class="mt-2 text-muted-foreground">
                  面试官能直接看到：我会把问题抽象成工具，也会把工具讲清楚——包括它解决什么、不解决什么。
                </p>
              </div>
            </div>
          </TracingBeam>
        </div>
      </div>
    </section>

    <!-- Projects -->
    <section id="projects" class="section-pad">
      <div class="mx-auto max-w-6xl">
        <BlurReveal>
          <p class="eyebrow w-fit">Projects</p>
          <h2 class="mt-4 font-display text-3xl md:text-5xl">精选项目</h2>
          <p class="mt-3 max-w-2xl text-muted-foreground">
            以下为专业向示例项目占位，后续可替换为真实作品。重点展示前端工程与 Agent 基础设施能力。
          </p>
        </BlurReveal>

        <ClientOnly>
          <InfiniteGrid class="mt-10" :items="gridItems" />
        </ClientOnly>

        <BentoGrid class="mt-10">
          <BentoGridItem
            v-for="(project, index) in projects"
            :key="project.id"
            :class="['bg-card/70 dark:bg-card/60', index === 0 || index === 3 ? 'md:col-span-2' : '']"
          >
            <template #header>
              <div class="flex items-center justify-between gap-3">
                <span class="text-[10px] uppercase tracking-[0.18em] text-primary">
                  {{ project.highlight }}
                </span>
                <span
                  v-if="project.placeholder"
                  class="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground"
                >
                  Placeholder
                </span>
              </div>
            </template>
            <template #title>
              {{ project.title }}
            </template>
            <template #description>
              <p class="text-sm text-muted-foreground">
                {{ project.subtitle }}
              </p>
              <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
                {{ project.description }}
              </p>
              <div class="mt-4 flex flex-wrap gap-2">
                <span
                  v-for="tech in project.stack"
                  :key="tech"
                  class="rounded-full border border-border/70 px-2.5 py-1 text-[11px]"
                >
                  {{ tech }}
                </span>
              </div>
            </template>
          </BentoGridItem>
        </BentoGrid>
      </div>
    </section>

    <!-- Packages -->
    <section id="packages" class="section-pad">
      <div class="mx-auto max-w-6xl">
        <BlurReveal>
          <p class="eyebrow w-fit">Open Source</p>
          <h2 class="mt-4 font-display text-3xl md:text-5xl">NPM 包</h2>
          <p class="mt-3 max-w-2xl text-muted-foreground">自己维护的插件，以及参与贡献的 OpenAPI 请求生成器。</p>
        </BlurReveal>

        <div class="mt-10 grid gap-6 lg:grid-cols-2">
          <div v-for="pkg in packages" :key="pkg.name">
            <ClientOnly>
              <LiquidGlass class="rounded-[1.75rem]" :radius="28" :frost="0.72">
                <div class="rounded-[1.5rem] p-6 md:p-7">
                  <div class="flex flex-wrap items-center gap-2">
                    <span
                      class="rounded-full bg-primary/15 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-primary"
                    >
                      {{ pkg.role }}
                    </span>
                    <span class="text-xs text-muted-foreground">v{{ pkg.version }}</span>
                  </div>
                  <h3 class="mt-4 font-display text-2xl">
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
                  <div class="mt-6">
                    <NuxtLink :to="pkg.href" target="_blank" external>
                      <InteractiveHoverButton text="查看包详情" />
                    </NuxtLink>
                  </div>
                </div>
              </LiquidGlass>
              <template #fallback>
                <div class="rounded-[1.75rem] border border-border/60 bg-card/70 p-6 md:p-7">
                  <h3 class="font-display text-2xl">
                    {{ pkg.name }}
                  </h3>
                  <p class="mt-3 text-sm text-muted-foreground">
                    {{ pkg.summary }}
                  </p>
                </div>
              </template>
            </ClientOnly>
          </div>
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
              <h2 class="mt-4 font-display text-3xl md:text-5xl">可安装的工程化 Skill</h2>
              <p class="mt-3 max-w-2xl text-muted-foreground">
                把 Mock 联调与配置驱动采集沉淀成可版本化、可分发的 Agent 上下文。
              </p>
            </div>
            <LinkPreview
              :url="siteProfile.links.skills"
              :width="240"
              :height="150"
              link-class="font-mono text-sm text-muted-foreground underline decoration-primary/30 underline-offset-4 transition hover:text-primary hover:decoration-primary"
            >
              skills.sh/cerrda
            </LinkPreview>
          </div>
        </BlurReveal>

        <div class="mt-10 grid gap-5 lg:grid-cols-2">
          <Motion
            v-for="(skill, index) in skills"
            :key="skill.name"
            :initial="{ opacity: 0, y: 24, filter: 'blur(8px)' }"
            :while-in-view="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
            :transition="{ delay: Math.min(index * 0.08, 0.2), duration: 0.7, ease: [0.32, 0.72, 0, 1] }"
            :viewport="{ once: true, amount: 0.25 }"
          >
            <ClientOnly>
              <LiquidGlass
                class="h-full rounded-[1.75rem]"
                container-class="h-full rounded-[1.75rem]"
                :radius="28"
                :frost="0.72"
              >
                <article class="flex h-full flex-col p-6 md:p-7">
                  <div class="flex items-center justify-between gap-3">
                    <span class="text-[10px] uppercase tracking-[0.18em] text-primary">skills.sh</span>
                    <span class="font-mono text-[11px] text-muted-foreground">0{{ index + 1 }}</span>
                  </div>

                  <h3 class="mt-4 font-display text-2xl tracking-tight">
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
              </LiquidGlass>
              <template #fallback>
                <article class="flex h-full flex-col rounded-[1.75rem] border border-border/60 bg-card/70 p-6 md:p-7">
                  <h3 class="font-display text-2xl">
                    {{ skill.name }}
                  </h3>
                  <p class="mt-3 text-sm text-muted-foreground">
                    {{ skill.summary }}
                  </p>
                  <code class="mt-5 block overflow-x-auto rounded-xl bg-secondary/80 px-3 py-2.5 font-mono text-[11px]">
                    {{ skill.install }}
                  </code>
                </article>
              </template>
            </ClientOnly>
          </Motion>
        </div>
      </div>
    </section>

    <!-- Articles -->
    <section id="articles" class="section-pad">
      <div class="mx-auto max-w-6xl">
        <BlurReveal>
          <div class="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p class="eyebrow w-fit">Writing</p>
              <h2 class="mt-4 font-display text-3xl md:text-5xl">文章</h2>
              <p class="mt-3 max-w-2xl text-muted-foreground">
                从掘金迁移到本站的技术文章。关注指令、性能、图标方案与 Agent Skill。
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
          :initial="{ opacity: 0, y: 28, filter: 'blur(10px)' }"
          :while-in-view="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
          :transition="{ duration: 0.85, ease: [0.32, 0.72, 0, 1] }"
          :viewport="{ once: true, amount: 0.25 }"
          class="mt-12"
        >
          <ClientOnly>
            <LiquidGlass class="rounded-[2rem]" container-class="rounded-[2rem]" :radius="32" :frost="0.7">
              <NuxtLink
                :to="`/articles/${featuredArticle.slug}`"
                class="group relative block overflow-hidden p-6 md:p-9 lg:p-10"
              >
                <div
                  class="pointer-events-none absolute -right-10 -top-16 size-56 rounded-full bg-primary/20 blur-3xl transition duration-700 group-hover:bg-primary/30"
                  aria-hidden="true"
                />
                <div
                  class="pointer-events-none absolute -bottom-20 left-1/4 size-64 rounded-full bg-accent/50 blur-3xl dark:bg-primary/15"
                  aria-hidden="true"
                />

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
            </LiquidGlass>
            <template #fallback>
              <NuxtLink
                :to="`/articles/${featuredArticle.slug}`"
                class="block rounded-[2rem] border border-border/60 bg-card/70 p-6 md:p-9"
              >
                <h3 class="font-display text-2xl md:text-4xl">
                  {{ featuredArticle.title }}
                </h3>
                <p class="mt-4 text-sm text-muted-foreground">
                  {{ featuredArticle.description }}
                </p>
              </NuxtLink>
            </template>
          </ClientOnly>
        </Motion>

        <!-- Archive -->
        <div class="mt-6 space-y-3 md:mt-8">
          <Motion
            v-for="(article, index) in archiveArticles"
            :key="article.id"
            :initial="{ opacity: 0, y: 20, filter: 'blur(8px)' }"
            :while-in-view="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
            :transition="{ delay: Math.min(index * 0.04, 0.32), duration: 0.65, ease: [0.32, 0.72, 0, 1] }"
            :viewport="{ once: true, amount: 0.2 }"
          >
            <CardSpotlight class="transition duration-500 hover:border-primary/35" :gradient-size="320">
              <NuxtLink
                :to="`/articles/${article.slug}`"
                class="flex flex-col gap-4 p-5 md:flex-row md:items-center md:gap-6 md:p-6"
              >
                <span
                  class="font-display text-3xl leading-none text-primary/25 transition duration-500 group-hover:text-primary/50 md:w-14 md:shrink-0 md:text-4xl"
                >
                  {{ articleIndex(index + 2) }}
                </span>

                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="tag in article.tags"
                      :key="tag"
                      class="rounded-full bg-secondary/80 px-2.5 py-1 text-[11px] text-muted-foreground"
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
            description="从前端工程化到 Agent Skill，持续把重复摩擦沉淀成工具。"
            :items="timelineItems"
          >
            <template v-for="item in careerTimeline" :key="item.title" #[`year-${item.title}`]>
              <div class="relative w-full pl-16 md:pl-4">
                <h3 class="mb-3 text-left text-2xl font-bold text-muted-foreground md:hidden">
                  {{ item.title }}
                </h3>
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
          <h2 class="mt-4 font-display text-3xl md:text-5xl">一起把 DX 做成基础设施</h2>
          <p class="mt-3 max-w-2xl text-muted-foreground">
            欢迎交流前端工程化、Agent Skill 与开源工具。邮箱与社交账号集中放在下方。
          </p>
        </BlurReveal>

        <ClientOnly>
          <LiquidGlass class="h-full" container-class="mt-10 rounded-[2rem]" :radius="32" :frost="0.72">
            <div
              class="relative flex h-full min-h-[16rem] flex-col justify-center overflow-hidden p-8 md:min-h-[18rem] md:p-10"
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
                    邮箱用于合作与技术交流；GitHub、掘金与 skills.sh 可直接查看开源与写作。点击右侧按钮打开完整信息。
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
          </LiquidGlass>
          <template #fallback>
            <div class="mt-10 rounded-[2rem] border border-border/60 bg-card/70 p-8 md:p-10">
              <h3 class="font-display text-2xl">联系方式</h3>
              <p class="mt-3 text-sm text-muted-foreground">
                邮箱 {{ siteProfile.email }} · GitHub {{ siteProfile.links.github.replace('https://', '') }}
              </p>
            </div>
          </template>
        </ClientOnly>
      </div>
    </section>

    <footer class="border-t border-border/50 px-4 py-10 text-center text-sm text-muted-foreground">
      © {{ new Date().getFullYear() }} {{ siteProfile.name }} · Built with Nuxt & Inspira UI
    </footer>
  </div>
</template>
