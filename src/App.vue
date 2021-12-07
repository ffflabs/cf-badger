<script setup lang="ts">
import { useHead } from '@vueuse/head'

const title = 'CF-Badger'
const description
  = 'CF-Badger lets you safely publish status badger for private Github repos'

// https://github.com/vueuse/head
// you can use this to manipulate the document head in any components,
// they will be rendered correctly in the html results with vite-ssg
useHead({
  title,
  meta: [
    { name: 'description', content: description },
    { name: 'description', content: description },
    { property: 'og:title', content: title },
    {
      property: 'og:image',
      content:
        'https://cf-badger.com/cf-badger-round-corners.svg',
    },
  ],
})
</script>

<template>
  <router-view />
</template>
