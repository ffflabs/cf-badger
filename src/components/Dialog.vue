<!-- This example requires Tailwind CSS v2.0+ -->
<template>
  <TransitionRoot as="template" :show="open">
    <Dialog as="div" class="fixed z-10 inset-0 overflow-y-auto" @close="open = false">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <TransitionChild
          as="template"
          enter="ease-out duration-300"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="ease-in duration-200"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <DialogOverlay class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </TransitionChild>

        <!-- This element is to trick the browser into centering the modal contents. -->
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <TransitionChild
          as="template"
          enter="ease-out duration-300"
          enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          enter-to="opacity-100 translate-y-0 sm:scale-100"
          leave="ease-in duration-200"
          leave-from="opacity-100 translate-y-0 sm:scale-100"
          leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        >
          <div class="inline-block align-bottom bg-white rounded-lg px-4 pt-2 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-2">
            <div class="hidden sm:block absolute top-0 right-0 pt-2 pr-4">
              <button type="button" class="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-none " @click="open = false">
                <span class="sr-only">Close</span>
                <XIcon class="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div class="sm:flex sm:items-start">
              <div class="mt-0 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <DialogTitle as="h3" class="text-xl leading-6 mt-1  font-large text-gray-900">
                  <carbon-branch style="font-size:1.5em;left:0;top:-1px" class="relative inline text-lg" />
                  Workflow Status Badges on

                  <carbon-logo-github style="font-size:1.4em;left:0;top:0px" class="relative inline text-lg" />
                  Private Repos = <img
                    src="../images/broken.svg"
                    style="height: 32px;margin: 0 0 -0.35em 0.1em;top:-5px"
                    class="inline relative mt-0 mr-0 ml-px -mb-1 max-w-full h-8"
                  />
                </DialogTitle>
                <div class="mt-1">
                  <hr>
                  <p class="mt-3 text-gray-600">
                    Unless requested by a logged in user, status badges for Github
                    private repos will show up as <b>broken images</b>.
                  </p>
                  <p class=" text-gray-600 mt-2">
                    What if you need to
                    display them publicly, eg: for Github Pages, public wikis, custom
                    health dashboards or even for previewing your README contents in
                    your IDE?
                  </p>
                  <figure class="block relative pt-5 mt-5">
                    <img
                      src="https://cf-badger.com/images/before_and_after200.svg"
                      width="350"
                      style="width: 350px; margin: 0 auto"
                      class="block my-0 mx-auto w-64 max-w-full h-auto"
                    />
                  </figure>
                  <small
                    style="width: 96%; color: rgb(153, 153, 153); display: block; font-size: 0.9em; text-align: center;"
                    class="block text-sm leading-5 text-center text-gray-500"
                  >From broken<span
                    style="display:inline-block;width:10em"
                    class="inline-block w-40"
                  >&nbsp;</span>to flawless&nbsp;&nbsp;&nbsp;</small>
                  <br class="" />
                  <p class="mt-4 text-gray-600">
                    CF-Badger creates public short-urls displaying workflow statuses for
                    your private repos. Your personal access token is stored on our side
                    and isn't ever exposed.
                  </p>
                </div>
              </div>
            </div>
            <div class="mt-5 py-2 -mx-2 -mb-4 sm:mt-4 bg-gray-200 px-2 relative " style="bottom:-0.5em">
              <carbon-idea class="h-8 w-8 rounded-full text-orange-600" style=" position:relative;top:-6px;font-size:1.6em; float:left; display:inline-block;">
              </carbon-idea><div>
                &nbsp;&nbsp; CF-Badger is also my project for the <a
                  href="https://blog.cloudflare.com/developer-summer-challenge/"
                  class="text-orange-600 no-underline cursor-pointer hover:text-gray-800"
                >Cloudflare's Developer Summer Challenge</a>
              </div>
            </div>
          </div>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
<script setup lang="ts">

import { Dialog, DialogOverlay, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { XIcon } from '@heroicons/vue/outline'

const props = defineProps({
  open: Boolean,
})

</script>
