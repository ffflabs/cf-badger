
<template>
  <section class="block text-gray-700">
    <div
      class="relative flex-grow my-0 mx-auto w-auto"
      style="max-width: 1344px;"
    >
      <Intro />
      <div class="justify-center -m-3" style="justify-content: center">
        <div
          ref="container"
          class="px-1 pt-4 pb-4 mx-auto mb-0 -mt-8 max-w-3xl "
          style="flex-basis: 0px;"
        >
          <form-line>
            <repo-and-buttons :login="login" :oauth-url="oauthUrl" :install-url="installUrl" class-name="col-span-12 sm:col-span-6" @click="logout">
            </repo-and-buttons>

            <div class="col-span-12 sm:col-span-6">
              <native-select
                ref="installations"
                :choices="installations"
                :current="installation"
                empty="None selected"
                label="Account or Organization"
                tabindex="0"
                @change="changeInstallation"
              />
            </div>
          </form-line>
          <form-line>
            <div class="col-span-12 sm:col-span-6">
              <native-select
                ref="repos"
                :choices="repos"
                :current="repository"
                empty="No repository selected"
                label="Repository"
                tabindex="1"
                @change="changeRepo"
              />
            </div>
            <div class="col-span-12 sm:col-span-6">
              <native-select
                ref="workflows"
                :choices="workflows"
                :current="workflow"
                empty="No workflow selected"
                label="Workflow"
                tabindex="2"
                @change="changeWorkflow"
              />
            </div>

            <div class="col-span-12 sm:col-span-6">
              <native-select
                ref="branches"
                :choices="branches"
                :current="branch"
                empty="No branch selected"
                label="Branch"
                tabindex="3"
                @change="changeBranch"
              />
            </div>

            <div class="col-span-12 sm:col-span-6">
              <native-select
                :choices="styles"
                :current="style"
                empty="No style selected"
                label="Badge Style"
                tabindex="4"
                @change="emitChange"
              />
            </div>
          </form-line>
          <form-line>
            <BadgeAndPreview :href="gotoURL" :src="badgeURL" class-name="col-span-12 sm:col-span-8">
            </BadgeAndPreview>
          </form-line>
          <MarkdownBox ref="markdown" :html-source="htmlSource" :markdown-source="markdownSource" />
          <form
            ref="logoutform"
            :action="logoutUrl"
            method="post"
          >
            <input type="hidden" value="logout" />
          </form>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
/**
  * Uses canvas.measureText to compute and return the width of the given text of given font in pixels.
  *
  * @param {String} text The text to be rendered.
  * @param {String} font The css font descriptor that text is to be rendered with (e.g. "bold 14px verdana").
  *
  * @see https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
  */
function getTextWidth(text, font) {
  // re-use canvas object for better performance
  const canvas: HTMLCanvasElement = (getTextWidth.canvas || (getTextWidth.canvas = document.createElement('canvas'))) as HTMLCanvasElement
  const context: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D
  context.font = font
  const metrics = context.measureText(text)
  return metrics.width
}

function getCssStyle(element: HTMLElement, prop: string) {
  return window.getComputedStyle(element, null).getPropertyValue(prop)
}

function getCanvasFontSize(el: HTMLElement = document.body): string {
  const fontWeight = getCssStyle(el, 'font-weight') || 'normal'
  const fontSize = getCssStyle(el, 'font-size') || '16px'
  const fontFamily = getCssStyle(el, 'font-family') || 'Times New Roman'

  return `${fontWeight} ${fontSize} ${fontFamily}`
}

const BadgerComponent = defineComponent({
  props: {
    owner: {
      type: String, required: false, default: ''
    },
    repo: {
      type: String, required: false, default: ''
    },
    apiUrl: {
      type: String, default: import.meta.env.VITE_API_URL
    }
  },

  setup() {
    return {

    }
  },
  data() {
    return {
      url: new URL(location.href),
      showHtml: false,
      repository: {},
      modalActive: false,
      style: { id: 'for-the-badge', name: 'for-the-badge' },
      mask: 'W/R',
      branch: {},
      privateRepo: false,
      token: '',
      workflows: [],

      installations: [],
      workflow: {},
      hashHex: '',
      branches: [],
      tokenInputType: 'password',
      login: '',
      installation: {},
      repos: [],

      maskedInput: null
    }
  },
  computed: {
    styles() {
      return [
        { id: 'for-the-badge', name: 'for-the-badge' },
        { id: 'flat', name: 'flat' },
        { id: 'flat-square', name: 'flat-square' },
        { id: 'plastic', name: 'plastic' },
        { id: 'popout', name: 'popout' },
        { id: 'popout-square', name: 'popout-square' },
        { id: 'social', name: 'social' }
      ]
    },

    WorkflowTitle() {
      return this.workflows.length
        ? { content: 'Workflow', color: 'color:black' }
        : {
          content: 'Select repo to enable workflow selection',
          color: 'color:#aaa',
        }
    },
    BranchesTitle() {
      return this.branches.length
        ? { content: 'Branch', color: 'color:black' }
        : {
          content: 'Pick a Workflow to enable selection',
          color: 'color:#aaa',
        }
    },
    badgeURL() {
      const style = this.style.name || 'for-the-badge'

      const badgeBaseUrl = this.hashHex
        ? this.endpointUrl
        : `${this.baseUrl}/images`
      return `${badgeBaseUrl}/endpoint.svg?branch=${this.branch.name || 'master'
      }&style=${style}`
    },
    endpointUrl() {
      return this.hashHex
        ? `${this.baseUrl}/badger/${this.hashHex}`
        : `${this.repoUrl}/${this.workflow.id || 0}`
    },
    baseUrl() {
      return `${location.protocol}//${location.host}`
      // return  this.apiUrl
    },
    viewerUrl() {
      return `${this.baseUrl}/badger`
    },
    logoutUrl() {
      return `${this.viewerUrl}/_logout`
    },
    installationUrl() {
      return `${this.viewerUrl}/${String(this.installation.id)}`
    },
    repoUrl() {
      return `${this.installationUrl}/${String(this.repository.name)}`
    },
    gotoURL() {
      return this.workflow.filename_url || ''
    },
    markdownSource() {
      return `[![${this.workflow.name || 'N/A'}](${this.badgeURL})](${this.gotoURL
      })`
    },
    oauthUrl() {
      return `${this.baseUrl}/bdg/oauth`
    },
    installUrl() {
      return `${this.baseUrl}/bdg/install`
    },
    htmlSource() {
      return (
        `<a href="${
          this.gotoURL
        }">`
            + `<img alt="Build Status" src="${
              this.badgeURL
            }" />`
            + '</a>'
      )
    },

  },
  watch: {
    $route(newRoute) {
      if (newRoute.hash) {
        const { code, installation_id } = Object.fromEntries(new URLSearchParams(newRoute.hash.replace('#', '')))
        this.authenticate({ code, installation_id })
      }
    }
  },
  mounted() {
    console.log(`mounted! ${location.href}`)
    globalThis.BadgerComponent = this

    this.getInstallations()
  },
  created() {
    console.log(`created! ${location.href}`)
  },
  methods: {
    getWidth(el: HTMLElement) {
      return getTextWidth(el.value || el.innerText, getCanvasFontSize(el))
    },
    authenticate({ code, installation_id }) {
      fetch(`${this.baseUrl}/bdg/code`, {
        method: 'POST',
        body: JSON.stringify({ code, installation_id }),
        headers: { 'content-type': 'application/json' }
      }).then(res => res.json()).then(({ login, installations }) => {
        location.hash = ''
        this.parseAuthRequest({ login, installations })
        if (installation_id) {
          const installation = this.installations.find(i => i.id === installation_id)
          if (installation)
            this.changeInstallation(installation)
        }
      })
    },
    keypress($event) {
      console.log($event)
    },
    logout() {
      console.log('LOGOUT')
      setTimeout(() => this.$refs.logoutform.submit(), 1000)
    },
    getWorkFlows() {
      if (!this.repository.name) {
        console.warn('NO REPO NAME', this.repository)
        return
      }
      return fetch(`${this.repoUrl}`)
        .then(res => res.json())
        .then((wflows) => {
          //  this.workflow = wflows[0];
          //  this.$nextTick(() => this.pickWorkFlow());
          return (this.workflows = wflows.workflows)
        })
    },
    parseAuthRequest({ login, installations, public_repos }) {
      if (login)
        this.login = login

      if (installations && installations.length) {
        // if (!login) location.reload()
        this.installations = installations.map(i => ({ name: i.login, id: i.installationId }))
        const installation = this.installations.find(i => i.name.toLowerCase() === this.owner.toLowerCase())
        if (installation)
          this.changeInstallation(installation)
      } else if (public_repos && public_repos.length)
      { this.repos = public_repos }
    },
    getInstallations() {
      return fetch(this.viewerUrl).then(res => res.json()).then((result = {}) => {
        const { login, installations, public_repos } = result
        return this.parseAuthRequest({ login, installations, public_repos })
      })
    },
    getBranches() {
      return fetch(
        `${this.repoUrl}/${this.workflow.id}`,
      )
        .then(res => res.json())
        .then(({ branches, hashHex }) => {
          this.branches = branches.map(b => ({ id: b.id, name: b.head_branch }))

          this.$nextTick(() => (this.changeBranch(this.branches[0])))
          this.hashHex = `_${hashHex}`
        })
    },
    async getRepos() {
      if (!this.installation.name) return false
      const res = await fetch(this.installationUrl)
      this.repos = (await res.json()).repositories.map(r => ({ id: r.id, name: r.name }))

      const repository = this.repos.find(r => r.name.toLowerCase() === this.repo.toLowerCase())
      if (repository)
        this.changeRepo(repository)
    },
    toggleModal() {
      this.modalActive = !this.modalActive
    },
    emitChange(newStyle: {id: string; name: string}) {
      this.style = ref(newStyle)
      console.log({ emitChange: newStyle, style: this.style })
    },
    changeInstallation(newInstallation) {
      this.installation = newInstallation
      if (this.installation.name) {
        console.log({ owner: this.owner, installationName: this.installation.name, newInstallation, installation: this.installation })
        if (this.owner && this.installation.name.toLowerCase() !== this.owner.toLowerCase())
          this.gotoInstallation()

        this.getRepos()
      }
    },
    gotoInstallation() {
      this.$router.push(`/${encodeURIComponent(this.installation.name)}`)
    },
    gotoRepo() {
      this.$router.push(`/${encodeURIComponent(this.installation.name)}/${encodeURIComponent(this.repository.name)}`)
    },
    changeRepo(newRepo) {
      this.repository = newRepo
      console.log({ newRepo, repository: this.repository })

      if (this.repository.id) {
        if (this.repo && this.repository.name.toLowerCase() !== this.repo.toLowerCase())
          this.gotoRepo()
        else
          this.getWorkFlows()
      }
    },
    changeBranch(newBranch) {
      this.branch = newBranch
    },
    changeWorkflow(newWf) {
      this.workflow = newWf
      console.log({ newWf, workflow: this.workflow })
      if (this.workflow.id) this.getBranches()
    }
  }

})
export default BadgerComponent

/*

const WorkflowTitle = computed(
  () {
    return workflows.value.length
      ? { content: 'WorkFlow', color: 'color:black' }
      : {
        content: 'Enter token to enable selection',
        color: 'color:#aaa',
      }
  }
)
*,
*/
</script>
