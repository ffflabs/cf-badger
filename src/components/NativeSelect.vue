<script setup lang="ts">

import { computed, ref } from 'vue'

const props = defineProps({
  current: { type: Object, default: { id: 0, name: '' } },
  label: String,
  choices: Array,
  tabindex: String

})

const emit = defineEmits(['change'])

const currentChoice = computed<{name: string; id: string}>({

  get() {
    return props.current.id ? props.current : { id: 0, name: `No ${props.label} discovered yet` }
  },
  set(style) {
    emit('change', style)
  }

})

</script>

<!-- This example requires Tailwind CSS v2.0+ -->
<template>
  <div style="padding-top:0.35rem">
    <label :for="props.label" class="block text-left text-sm font-medium text-gray-700">{{ props.label }}<carbon-checkmark
      v-if="currentChoice.id"
      style="float:right;font-weight:bolder;color:#0c0"
      class="inline right text-green-800"
    ></carbon-checkmark></label>
    <input v-if="!choices.length" type="text" :value="`No ${ props.label } discovered yet`" readonly class="bg-gray-200 mt-1 block w-full pl-3 pr-10 py-1 border text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md" />
    <select
      v-if="choices.length"
      :id="props.label"

      v-model="currentChoice"
      :tabindex="props.tabindex"
      :name="props.label"
      :disabled="!choices.length"
      class="bg-white mt-1 block w-full pl-3 pr-10 py-1 border text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
      :placeholder="!choices.length? `No ${props.label} discovered yet`:''"
    >
      <option
        v-for="choice in choices"
        :key="choice.id"
        :title="choice.name"
        :value="choice"
        :selected="choice.id===currentChoice.id"
      >
        {{ choice.name }}
      </option>
    </select>
  </div>
</template>
