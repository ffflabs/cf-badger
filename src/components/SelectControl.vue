<script setup lang="ts">
import { Listbox, ListboxButton, ListboxLabel, ListboxOption, ListboxOptions } from '@headlessui/vue'
import { CheckIcon, SelectorIcon } from '@heroicons/vue/solid'
import { computed, ref } from 'vue'

const props = defineProps({
  current: Object,
  label: String,
  choices: Array
})
const selected = ref(props.choices[2])
const emit = defineEmits(['change'])

const currentChoice = computed<{name: string; id: string}>({

  get() {
    return props.current
  },
  set(style) {
    emit('change', style)
  }

})

</script>

<!-- This example requires Tailwind CSS v2.0+ -->
<template>
  <Listbox v-model="currentChoice" as="div">
    <ListboxLabel class="block text-sm font-medium  text-left  text-gray-700">
      {{ props.label }} <carbon-checkmark
        v-if="currentChoice.name"
        style="float:right;font-weight:bolder;color:#0c0"
        class="inline right text-green-800"
      ></carbon-checkmark>
    </ListboxLabel>
    <div class="mt-1 relative">
      <ListboxButton
        class="bg-white relative w-full border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
      >
        <span class="block truncate">&nbsp;{{ currentChoice.name }}</span>
        <span class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <SelectorIcon class="h-5 w-5 text-gray-400" aria-hidden="true" />
        </span>
      </ListboxButton>

      <transition leave-active-class="transition ease-in duration-100" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <ListboxOptions class="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          <ListboxOption
            v-for="choice in choices"
            :key="choice.name"
            v-slot="{ active, selected }"
            as="template"
            :value="choice"
          >
            <li style="list-style:none" :class="[active ? 'text-white bg-orange-500' : 'text-gray-900', 'text-left -ml-4 list-style-none cursor-default select-none relative py-2 pl-2 pr-9']">
              <span :class="[selected ? 'font-semibold' : 'font-normal', 'block truncate']">
                {{ choice.name }}
              </span>

              <span v-if="selected" :class="[active ? 'text-white' : 'text-orange-600', 'absolute inset-y-0 left-36 flex items-center pl-1.5']">
                <CheckIcon class="h-5 w-5" aria-hidden="true" />
              </span>
            </li>
          </ListboxOption>
        </ListboxOptions>
      </transition>
    </div>
  </Listbox>
</template>
