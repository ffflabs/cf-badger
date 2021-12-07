<script setup lang="ts">
import { ref } from 'vue'

const show = ref(false)
const content1 = ref('You need to install the app once per acount/organization')
const content2 = ref('From then on, available installations are retrieved upon login')
const props = defineProps({
  login: String,
  oauthUrl: String,
  installUrl: String,
  className: String
})
const emit = defineEmits(['click'])

</script>

<template>
  <div :class="className">
    <label
      class="block text-md  text-left text-gray-800 cursor-default"
    >Connect to Github
      <button
        type="button"
        class="inline-flex items-center px-2 text-md font-bold border border-transparent rounded-full shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none   "

        @mouseover="show=true"
        @mouseout="show=false"
      >
        ?
      </button> </label>
    <div class="mb-0">
      <div
        class="clear-both relative text-base text-left box-border"
      >
        <a
          class="inline-flex items-center px-3  border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          style="width: calc(50% - 3.5em); background-image: linear-gradient(rgb(67, 76, 84) 0%, rgb(57, 65, 72) 35%, rgb(37, 42, 48) 100%);"
          :href="installUrl"
        >
          <carbon-logo-github style="height:1.75rem;width:1.75rem" class="pr-2 text-base h-7 w-7" />

          Install App
        </a>
        <span style="position:relative;top:-8px" :class="{'text-transparent':login}">
          &nbsp; or &nbsp;
        </span>
        <button
          v-if="login"
          class="inline-flex items-center px-3 justify-between border-2  shadow-sm text-sm leading-4 font-medium rounded-md text-green-700 no-underline align-top rounded border border-green-400
             border-solid shadow-none appearance-none cursor-pointer select-none whitespace-no-wrap hover:border-green-500 hover:text-green-800   focus:text-green-800"
          style="margin-top:-0.05em;                              width:calc(50% )                            "
        >
          <span> {{ login }}</span>
          <carbon-logout style="height:1.75rem;width:1.75rem;float:right" class="pr-2 h-7 w-7" @click="emit('click','logout')" />
        </button>
        <a
          v-if="!login"
          class="inline-flex items-center px-3  border  shadow-sm text-sm leading-4 font-medium rounded-md text-gray-800 no-underline align-top rounded border border-gray-400 border-solid shadow-none appearance-none cursor-pointer select-none whitespace-no-wrap hover:border-gray-500 hover:text-gray-800 focus:border-blue-600 focus:text-gray-800"
          style="margin-top:-0.05em;                              width:calc(50% )                            "
          :href="oauthUrl"
        >
          <carbon-logo-github style="height:1.75rem;width:1.75rem;float:right" class=" pr-2 h-7 w-7" />

          Login with Github
        </a>
        <SmallNotification :show="show" :content1="content1" :content2="content2" />
      </div>
    </div>
  </div>
</template>
