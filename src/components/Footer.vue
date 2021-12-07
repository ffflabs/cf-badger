<template>
  <footer class="mx-auto px-6 pt-12 pb-6 text-gray-700 bg-gray-100 w-full">
    <div
      class="relative flex-grow my-0 mx-auto w-auto text-center l:max-w-2lg"
    >
      <div class="justify-center -m-3 w-full lg:w-4/5 mx-auto" style="justify-content: center">
        <div
          class="flex-grow flex-shrink  p-3 my-0 mx-auto   lg:max-w-4xl lg:flex-none "
          style="flex-basis: 0px;"
        >
          <p

            class="p-0 px-12 mx-0 mb-0 -mt-4  text-sm leading-5 text-justify"
          >
            Please note that, if you intend to display workflow status badges
            for public repos, you can use Shields.io direcly. Just look in their
            <a
              href="https://shields.io/category/build"
              class="text-orange-600 no-underline cursor-pointer hover:text-gray-800"
            >Builds Category</a>
            for Github Workflows section.
          </p>

          <div
            class="  block flex-grow flex flex-shrink pt-3    my-0 mx-auto"
            style="flex-basis: 0px;"
          >
            <div
              class="block flex-grow flex-shrink py-3 my-0 mx-auto"
              style="flex-basis: 0px;"
            >
              <a
                class="inline-flex relative justify-center items-center h-8 leading-normal text-gray-800 no-underline align-top bg-white rounded border border-gray-400 border-solid shadow-none appearance-none cursor-pointer select-none whitespace-no-wrap hover:border-gray-500 hover:text-gray-800 focus:border-blue-600 focus:text-gray-800"
                href="https://workers.cloudflare.com"
              >
                <span
                  style="vertical-align: super;font-weight:bold"
                  class=""
                >built-with &nbsp;&nbsp;</span>
                <img
                  style="display:inline"
                  src="../images/cf-workers-badge.svg"
                  class="inline max-w-full h-auto"
                /></a>
            </div>
            <div
              class="block flex-grow flex-shrink py-3 my-0 mx-auto  "
              style="flex-basis: 0px;"
            >
              <a
                class="inline-flex relative justify-center items-center h-8 leading-normal text-gray-800 no-underline align-top bg-white rounded border border-gray-400 border-solid shadow-none appearance-none cursor-pointer select-none whitespace-no-wrap hover:border-gray-500 hover:text-gray-800 focus:border-blue-600 focus:text-gray-800"
                href="https://pages.cloudflare.com"
              >
                <span
                  style="vertical-align: super;font-weight:bold"
                  class=""
                >&nbsp;and&nbsp;&nbsp;&nbsp;</span>
                <img
                  style="display:inline"
                  src="../images/cf-pages-badge.svg"
                  class="inline max-w-full h-auto"
                /></a>
            </div>
          </div>
        </div>
      </div>
      <p style="text-align: center; padding-top:2em; font-size: 0.9em">
        <strong>CF-Badger</strong>'s was inspired by <a href="https://actions-badge.atrox.dev/" class="text-orange-600 no-underline cursor-pointer hover:text-gray-800">Atrox's Actions
          Badge</a>.
      </p>
    </div>
  </footer>
</template>
