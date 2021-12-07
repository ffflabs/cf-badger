<template>
  <form-line>
    <div class="col-span-8">
      <label
        class="block text-md  text-left text-gray-800 cursor-default"
      >Copy the resulting Markdown</label>
      <div class="flex justify-start">
        <div
          class="clear-both relative flex-grow flex-shrink text-base text-left box-border"
        >
          <textarea
            :value="props.markdownSource"
            class="block relative text-left  p-1 m-0 w-full min-w-full max-w-full h-13 font-sans text-xs leading-normal text-gray-800 align-top whitespace-pre-wrap rounded-sm border border-gray-400 border-solid appearance-none cursor-text resize-y shadow-xs focus:border-blue-600 focus:shadow-xs hover:border-gray-500"
            rows="4"
            aria-multiline="true"
            placeholder="e.g. Hello world"
            style="overflow-wrap: break-word;"
            readonly
          />
        </div>
        <div
          class="clear-both relative text-base text-left box-border"
        >
          <button
            class="inline-flex w-8 relative justify-center items-center m-0 h-12 font-sans leading-normal text-white align-top rounded border border-transparent border-solid shadow-none appearance-none cursor-pointer select-none whitespace-no-wrap focus:border-blue-600 focus:text-gray-800 hover:border-gray-500 hover:text-gray-800"
            style="height: 3.2em; background-image: linear-gradient(rgb(67, 76, 84) 0%, rgb(57, 65, 72) 35%, rgb(37, 42, 48) 100%);"
          >
            <carbon-copy>
            </carbon-copy>
          </button>
        </div>
      </div>
    </div>
  </form-line>
  <form-line>
    <label
      v-if="showHtml"
      class="block text-md  text-left text-gray-800 cursor-default"
    >HTML</label>
    <div v-if="showHtml" class="flex justify-start">
      <div
        class="clear-both relative flex-grow flex-shrink text-base text-left box-border"
      >
        <input
          ref="htmlInput"
          class="inline-flex relative justify-start items-center m-0 w-full max-w-full h-8 font-sans text-sm leading-normal text-gray-800 align-top rounded border border-gray-400 border-solid shadow-none appearance-none cursor-text focus:border-blue-600 focus:shadow-xs hover:border-gray-500"
          type="text"
          readonly="readonly"
          :value="props.htmlSource"
        />
      </div>
      <div
        class="clear-both relative text-base text-left box-border"
      >
        <button
          class="inline-flex relative justify-center items-center m-0 h-12 font-sans leading-normal text-white align-top rounded border border-transparent border-solid shadow-none appearance-none cursor-pointer select-none whitespace-no-wrap focus:border-blue-600 focus:text-gray-800 hover:border-gray-500 hover:text-gray-800"
          style="height: 3.2em; background-image: linear-gradient(rgb(67, 76, 84) 0%, rgb(57, 65, 72) 35%, rgb(37, 42, 48) 100%);"
        >
          <span
            class="inline-flex justify-center items-center w-6 h-6"
          >
            <i
              class="inline-block not-italic font-black leading-none"
              aria-hidden="true"
              style="font-variant: normal; text-rendering: auto; font-family: &quot;Font Awesome 5 Free&quot;;"
            ></i>
          </span>
        </button>
      </div>
    </div>
  </form-line>
</template>
<script setup lang="ts">
import { ref } from 'vue'
const props = defineProps({
  htmlSource: String,
  markdownSource: String
})
const showHtml = ref(false)
const copy = (element: HTMLTextAreaElement) => {
  element.select()
  try {
    document.execCommand('copy')
  } catch (err) {
    alert('Oops, unable to copy')
  }
}
</script>
