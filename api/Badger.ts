
import { json } from 'itty-router-extras';
import {
  GithubIntegrationDurable, mapRepos, dataItemToInstallationInfo,
  computeResultHash
} from './GithubIntegrationDurable';
import type {
  TInstallationItem, TInstallationInfo

} from './GithubIntegrationDurable'
import type { IWorkflowRun, WorkflowRunPart, TRunResults } from './modules/computeColorAndMessage';
import { computeColorAndMessage, getLatestRunByBranch } from './modules/computeColorAndMessage';
import type { TWorkflowParams } from "./modules/GithubRequest";
//import type { Octokit } from '@octokit/rest';
//import { createKeyPair, decryptMessage, encryptMessage, getJWT } from './modules/signing_utils';
import type { OctokitUserInstance } from './GithubIntegrationDurable';
import type { Octokit } from '@octokit/rest';
import { TOwnerOrInstallationId, TInstallationRepos, isErrorResponse, TOwnerRepo, TWorkflow, IRepoWorkflows, mapWorkflow, TOutputResults, TInstallations } from './modules/TInstallations';


export const str2ab = (str: string): ArrayBuffer => {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
};


export class Badger extends GithubIntegrationDurable implements DurableObject {
  [s: string]: unknown

  async getInstallation({ owner, installationId }: TOwnerOrInstallationId): Promise<TInstallationInfo> {
    if (/^\d+$/.test(owner || '')) installationId = Number(owner)
    return (installationId ? this.getInstallById({ installationId }) : this.getOwnerInstall({ owner } as { owner: string }))
  }
  async getInstallationId({ owner, installationId }: TOwnerOrInstallationId): Promise<number> {
    if (/^\d+$/.test(owner || '')) installationId = Number(owner)
    if (installationId) return installationId
    return this.getOwnerInstall({ owner } as { owner: string }).then(installationInfo => {
      return Number(installationInfo.installationId || installationInfo.id)
    })
  }

  async getRepositories({ owner, installationId, code }: TOwnerOrInstallationId & { code?: string }): Promise<TInstallationRepos> {
    let cacheKey = `repositories:${String(owner || installationId)}`
    let stored = await this.getStoredWithTtl<TInstallationRepos>(cacheKey)

    if (stored.ttl) return stored
    if (/^\d+$/.test(owner || '')) installationId = Number(owner)
    return Promise.resolve().then(async () => {
      let installationInfo = await this.getOwnerInstall({ owner } as { owner: string })
      installationId = Number(installationInfo.installationId || installationInfo.id)
      owner = installationInfo.login
      this.debug(`getOctokitForInstallation(${installationId})`)
      return (await this.getOctokitForInstallation(installationId)).apps.listReposAccessibleToInstallation()
        .then(({ data: { repositories } }): TInstallationRepos => {
          let { login, target_id } = installationInfo,
            finalResult = { installationId, login, target_id, repositories: mapRepos(repositories, this.state.WORKER_URL) } as unknown as TInstallationRepos;
          return this.storeWithExpiration(cacheKey, finalResult)
        });
    }).catch(async err => {
      this.debug({ failed: 'getRepositories', owner, code, stack: err.stack.split('\n').slice(0, 2), message: err.message })
      /**
       * Plan B, attempt using logged in user token
       */
      if (isErrorResponse(err, 404) && owner && code) {
        return this.getReposForUser({ code, owner })
      }
      throw err
    })
  }

  async getReposForUser({ code, owner }: { code: string, owner: string }): Promise<TInstallationRepos> {
    return this.actingAsUser(code).then(userOctokit => {

      return userOctokit.repos.listForUser({ username: owner }).then(({ data }): TInstallationRepos & { install_url: string } => {
        let firstOrg = data[0]
        if (!firstOrg) {
          throw new Error('Could not get related repos for user')
        }
        let user = firstOrg.owner,
          { id: target_id } = user
        return {
          installationId: null,
          login: user.login,
          target_id,

          install_url: `https://github.com/apps/cf-badger/installations/new/permissions?target_id=${target_id}`,
          repositories: mapRepos(data, this.state.WORKER_URL)
        }

      })
    })
  }
  async getRepoWorkflows({ owner, repo, code }: TOwnerRepo & { code?: string } = {} as TOwnerRepo): Promise<{ workflows: TWorkflow[] }> {
    let cacheKey = `workflows:${owner}/${repo}`
    let stored = await this.getStoredWithTtl<{ workflows: TWorkflow[] }>(cacheKey)
    if (stored.ttl) return stored
    return Promise.resolve().then(async () => {
      let installationInfo = await this.getOwnerInstall({ owner } as { owner: string }),
        installationId = Number(installationInfo.installationId || installationInfo.id)
      owner = installationInfo.login
      return (await this.getOctokitForInstallation(installationId)).actions.listRepoWorkflows({ owner, repo })

    }).catch(err => {
      this.debug({ failed: 'getRepoWorkflows', owner, repo, code, stack: err.stack.split('\n').slice(0, 2), message: err.message })

      if (isErrorResponse(err, 404) && owner && code) {
        return this.actingAsUser(code).then(octokit => octokit.actions.listRepoWorkflows({ owner, repo }))
      }
      return this.actingAsUser(this.state.BADGER_KV_ID).then(octokit => octokit.actions.listRepoWorkflows({ owner, repo }))
    }).then(({ data }) => {
      let { workflows } = data as IRepoWorkflows
      return this.storeWithExpiration(cacheKey, { workflows: workflows.map(workflow => mapWorkflow({ owner, repo, workflow }, this.state.WORKER_URL)) })
    })

  }
  protected async listWorkflowRuns({ octokit, owner, repo, workflow_id, branch }: { octokit: Octokit, owner: string, repo: string, workflow_id: number, branch?: string }): Promise<{ workflow_runs: TRunResults[], total_count: number }> {

    let workflowsInfo = (await this.state.storage.get<{ workflows: TWorkflow[] }>(`workflows:${owner}/${repo}`)),
      workflowInfo = workflowsInfo && workflowsInfo.workflows && workflowsInfo.workflows.find(w => w.id === workflow_id)

    let cacheKey = `workflows:${owner}/${repo}/${workflow_id}/${branch || ''}`
    let stored = await this.getStoredWithTtl<{ workflow_runs: TRunResults[], total_count: number }>(cacheKey)
    if (stored.ttl) return { ...workflowInfo, ...stored }
    return octokit.actions.listWorkflowRuns({ owner, repo, workflow_id, branch, exclude_pull_requests: true, per_page: branch ? 1 : 100 })
      .then(({ data }): { workflow_runs: TRunResults[], total_count: number } => {
        let { workflow_runs: runs, total_count } = data
        console.log(runs[0])
        const lastruns = getLatestRunByBranch(runs as WorkflowRunPart[]) as { [s: string]: TRunResults }
        return this.storeWithExpiration(cacheKey, { ...workflowInfo, workflow_runs: Object.values(lastruns), total_count: Number(total_count) })
      })
  }


  async getWorkflowResults({ owner, repo, workflow_id, code, branch }: TOwnerRepo & { branch?: string, code?: string, workflow_id: number }): Promise<TOutputResults> {

    // console.info('getWorkflowResults', { owner, repo, workflow_id, code, branch })
    return Promise.resolve().then(async () => {
      let installationInfo = await this.getOwnerInstall({ owner } as { owner: string }),
        installationId = Number(installationInfo.installationId || installationInfo.id)
      owner = installationInfo.login
      return this.getOctokitForInstallation(installationId).then(octokit => this.listWorkflowRuns({ octokit, owner, repo, workflow_id, branch }))
    }).catch(err => {
      //  this.debug({ failed: 'getWorkflowResults', owner, repo, workflow_id, code, stack: err.stack.split('\n').slice(0, 2) })

      if (isErrorResponse(err, 404) && owner && code) {
        return this.actingAsUser(code).then(octokit => this.listWorkflowRuns({ octokit, owner, repo, workflow_id, branch }))
      }
      return this.actingAsUser(this.state.GITHUB_TOKEN).then(octokit => this.listWorkflowRuns({ octokit, owner, repo, workflow_id, branch }))
    }).then(async ({ name, state, filename_url, url, workflow_runs, total_count }): Promise<TOutputResults> => {
      const hashHex = await computeResultHash({ owner, repo, workflow_id, filename_url })
      this.storeWithExpiration(`hash:${hashHex}`,
        {
          owner, repo, workflow_id, filename_url
        })
      //this.debug({ owner, repo, workflow_id, code, branch, hashHex })



      return { name, state, filename_url, hashHex, branches: workflow_runs, count: total_count }

    })
  }


  /**
   * This operation retrieves at most 100 run results for a given workflow. 
   * Given the potential size of the response we store it on a KVNamespace instead
   * of bloating the Durable Object's storage
   * @param param0 
   * @returns 
   */
  async computeResultRequest({
    owner,
    repo,
    workflow_id,
    branch
  }: {
    owner: string,
    repo: string,
    workflow_id: number,

    branch?: string
  }): Promise<Response> {

    return this.getWorkflowResults({ owner, repo, workflow_id, branch })
      .then((runs: TOutputResults) => {
        let { branches } = runs as { branches: TRunResults[] }
        return json(computeColorAndMessage(branches as IWorkflowRun[], Number(workflow_id), branch), {
          headers: {
            'cache-control': 'max-age=300, public'
          }
        })
      })
  }
  async computeResultRequestFromHash({ hashHex, branch }: { hashHex: string, branch?: string }): Promise<Response> {
    const { owner, repo, workflow_id } = (await this.state.storage.get(`hash:${hashHex}`) || {}) as TWorkflowParams

    return this.computeResultRequest({ owner, repo, workflow_id: Number(workflow_id), branch })

  }
  async redirectToWorkFlow({ hashHex }: { hashHex: string }): Promise<Response> {
    const { filename_url, owner, repo, workflow_id } = (await this.state.storage.get(`hash:${hashHex}`) || {}) as TWorkflowParams
    return Response.redirect(String(filename_url || `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflow_id}`))
  }

  // Generated by https://quicktype.io
  async user({ code, installationId }: { code: string, installationId?: number }): Promise<Response> {

    let { token, id, login } = (await this.state.storage.get(code) || { token: '', id: 0, login: '' }) as { [s: string]: unknown }
    // return { token, id, login }
    if (!token) {
      return this.actingAsOauthUser({ code, installationId })
    }
    //console.trace({ token, id, login, code, installationId })
    return this.actingAsUser(code).then(async userOctoKit => {
      userOctoKit.code = code
      const installations = await this.getInstallationsForUser(userOctoKit as OctokitUserInstance, installationId)

      return json({
        login: login || userOctoKit.login || 'NB', id, installations
      })
    })
  }


  /**
   * 
   * @param owner 
   * @returns 
   */
  private async getOwnerInstall({ owner }: { owner: string }): Promise<TInstallationInfo> {
    if (/^\d+$/.test(owner || '')) return this.getInstallById({ installationId: Number(owner) })

    let stored = await this.getStoredWithTtl<TInstallationInfo>(`owner:${owner}`)
    if (stored.ttl) return stored

    return this.getOctokit().apps.getUserInstallation({ username: owner })
      .then(async ({ data }) => {
        console.log('got owner installation')
        const installationInfo = dataItemToInstallationInfo(data as unknown as TInstallationItem, this.state.WORKER_URL)
        installationInfo.installationId = installationInfo.installationId || installationInfo.id
        this.state.waitUntil(this.state.BADGER_KV.put(`installation:${installationInfo.installationId}`, JSON.stringify(data), { metadata: installationInfo }))
        this.storeWithExpiration(`owner:${owner}`, installationInfo, 1000000)
        this.storeWithExpiration(`installationId:${installationInfo.installationId}`, installationInfo, 1000000)
        return installationInfo

      })
  }
  /**
   * 
   * @param owner 
   * @returns 
   */
  private async getInstallById({ installationId, raw }: { raw?: boolean, installationId: number }): Promise<TInstallationInfo> {

    let stored = !raw && await this.getStoredWithTtl<TInstallationInfo>(`installationId:${installationId}`)
    if (stored && stored.ttl) return stored

    return (await this.getOctokitForInstallation(installationId)).apps.getInstallation({ installation_id: installationId }).then(async ({ data }) => {
      const installationInfo = dataItemToInstallationInfo(data as unknown as TInstallationItem, this.state.WORKER_URL)
      this.state.waitUntil(this.state.BADGER_KV.put(`installation:${installationId}`, JSON.stringify(data), { metadata: installationInfo }))
      installationInfo.installationId = installationInfo.installationId || installationInfo.id

      this.storeWithExpiration(`installationId:${installationId}`, installationInfo, 1000000)
      this.storeWithExpiration(`owner:${installationInfo.login}`, installationInfo, 1000000)
      return installationInfo

    })
  }
  async listInstallations({ raw }: { raw: boolean }): Promise<TInstallations> {

    let stored = !raw && await this.getStoredWithTtl<TInstallations>(`listInstallations`)
    if (stored && stored.ttl) return stored
    const { data } = await this.getOctokit().apps.listInstallations()
    if (raw) return data as unknown as TInstallations
    const installations = (data as TInstallationItem[]).map(i => dataItemToInstallationInfo(i, this.state.WORKER_URL))

    return this.storeWithExpiration(`listInstallations`, { installations })
  }


}
