<script setup lang="ts">

const VITE_API_URL = import.meta.env.VITE_API_URL

</script>
<template>
  <Hero />

  <BadgerComponent :api_url="VITE_API_URL" />
</template>

<route lang="yaml">
name: home
meta:
  layout: home
</route>
