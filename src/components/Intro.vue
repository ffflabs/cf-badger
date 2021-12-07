<script setup lang="ts">
import { defineComponent, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const name = ref('')

const router = useRouter()
let modalActive = ref(false)
const toggleModal = () => {
  modalActive = ref(true)
  console.log(modalActive)
}
const props = defineProps({
  message: String,
})

</script>
<template>
  <div class="justify-center -mx-3 -mt-3" style="justify-content: center;">
    <div
      class="flex-grow flex-shrink p-3  -mt-4 mx-auto w-4/5 text-center lg:flex-none lg:w-2/3"
      style="text-align: center; flex-basis: 0px;"
    >
      <div
        style="line-height:1.4em;"
        class="px-1 pt-0 pb-8 mx-auto mb-0 max-w-3xl leading-5 text-justify"
      >
        CF-Badger creates public urls displaying workflow statuses for your
        private repos without exposing your personal access token,
        preventing those annoying
        <a
          class="text-orange-600 no-underline cursor-pointer hover:text-gray-800"
          @click="modalActive=!modalActive"
        >broken badge images <carbon-help class="inline" /></a>.
      </div>
    </div>
    <Dialog :open="modalActive" />
  </div>
</template>
