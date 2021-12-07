<script setup lang="ts">

const props = defineProps({
  message: String,
  name: {
    type: String,
    required: true,
  },
  installation: {
    type: String,
    required: true,
  },
})

const VITE_API_URL = import.meta.env.VITE_API_URL

</script>
<template>
  <Hero />

  <BadgerComponent :api_url="VITE_API_URL" :owner="props.installation" :repo="props.name" />
</template>
