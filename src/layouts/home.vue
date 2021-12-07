<template>
  <Header />
  <main style="flex:1" class="px-4 py-1 text-center text-gray-700 dark:text-gray-200">
    <router-view v-bind="$attrs" />
  </main>
  <Footer />
</template>
<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

console.log(`layout:mounted! ${location.href}`)
const url = new URL(location.href)
if (url.searchParams.has('code')) {
  const code = url.searchParams.get('code')
  let nextHash = `code=${code}`
  const installation_id = url.searchParams.get('installation_id')
  if (installation_id) nextHash += `&installation_id=${installation_id}`
  router.push(`/#${nextHash}`)
}

</script>
