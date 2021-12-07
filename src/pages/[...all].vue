<script setup lang="ts">
const t = (msg: string) => msg
</script>

<template>
  <div>
    {{ t('not-found') }}
  </div>
</template>

<route lang="yaml">
meta:
  layout: 404
  propsGetter: false
</route>
