<script setup lang="ts">
/** `/` 与 `/about` 等同页，用可选段避免 hash URL，同时不和 `/articles/:slug` 冲突。 */
import { navSectionFromPath } from '~/data/site'

const route = useRoute()
const section = String(route.params.section || '')

if (section && !navSectionFromPath(`/${section}`)) {
  throw createError({ statusCode: 404, statusMessage: '页面不存在' })
}
</script>

<template>
  <HomeLanding />
</template>
