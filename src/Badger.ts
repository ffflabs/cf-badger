import { IttyDurable } from 'itty-durable';
import { json, EnvWithDurableObject } from 'itty-router-extras';
import Toucan from 'toucan-js';


import { GithubRequest, TWorkflowParams } from "./modules/GithubRequest";
import type { IWorkflowRuns, IWorkflowRun, WorkflowRunPart } from './modules/computeColorAndMessage';
import { computeColorAndMessage, IWorkflowList } from './modules/computeColorAndMessage';

type ErrorObject = {
  name: string;
  message: string;
  url?: string;
  stack: string[];
};


export interface IRequestParams {
  env: EnvWithDurableObject,
  owner: string,
  repo: string,
  workflow_id: string,
  GITHUB_TOKEN: string,
  requestURL: URL,
  hashHex: string,
  branch?: string

}

type TRunResults = {
  id: number;
  name: string;
  head_branch: string;
  status: "queued" | "in_progress" | "completed";
  conclusion: "success" | "neutral" | "failure" | "cancelled" | "timed_out" | "action_required";
  workflow_id: number;
};

export type TOutputResults = ReturnType<typeof computeColorAndMessage> | {
  branches: TRunResults[];
  hashHex: string;
  count: number;
};

export class Badger extends IttyDurable implements DurableObject {
  Sentry!: Toucan;

  state: DurableObjectState & EnvWithDurableObject
  [s: string]: unknown
  constructor(state: DurableObjectState, env: EnvWithDurableObject) {
    super(state, env)
    this.state = state as DurableObjectState & EnvWithDurableObject
    this.state.BADGER_KV = env.BADGER_KV as KVNamespace

    this.state.release = env.RELEASE;

    this.state.WORKER_ENV = env.WORKER_ENV as string;
    this.state.WORKER_URL = env.WORKER_URL as string;


  }



  async computeAvailableWorkflowsRequest(
    {
      requestURL,
      owner,
      repo,
      GITHUB_TOKEN
    }: {
      requestURL: URL,
      owner: string,
      repo: string,
      GITHUB_TOKEN: string
    }): Promise<{ id: number; id_url: string; name: string; filename_url: string; }[]> {
    if (!GITHUB_TOKEN) {
      throw new Error('No GITHUB_TOKEN')
    }

    let ghRequest = new GithubRequest({ owner, repo }, GITHUB_TOKEN);

    const res = await ghRequest.fetch({ method: 'GET' });

    const { workflows } = (await res.json()) as IWorkflowList;

    return workflows.map((workflow): { id: number; id_url: string; name: string; filename_url: string; } => {
      let { id, name, path } = workflow, fileName = path.split('/').pop();
      return { id, id_url: `${requestURL.toString()}/${id}`, name, filename_url: `https://github.com/${owner}/${repo}/actions/workflows/${fileName}` };
    });

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
    GITHUB_TOKEN,

    hashHex,
    branch
  }: {
    owner: string,
    repo: string,
    workflow_id: string,
    GITHUB_TOKEN: string,

    hashHex: string,
    branch?: string
  }): Promise<TOutputResults> {
    this.state.storage.put<TWorkflowParams & { GITHUB_TOKEN: string }>(`hash:${hashHex}`,
      {
        owner, repo, workflow_id, GITHUB_TOKEN
      })
    let { value: storedRuns, metadata } = await this.state.BADGER_KV.getWithMetadata<IWorkflowRuns>(`runs:${hashHex}`, 'json')
    console.log({
      owner, repo, workflow_id, metadata
    })
    if (!storedRuns) {
      const ghRequest = new GithubRequest({ owner, repo, workflow_id, branch }, GITHUB_TOKEN)

      const res = await ghRequest.fetch({ method: 'GET' }),
        body = res.clone().body
      if (body) {
        this.state.waitUntil(this.state.BADGER_KV.put(`runs:${hashHex}`, body, { expirationTtl: 300, metadata: { CachedOn: Date.now() } }))
      }
      storedRuns = (await res.json()) as IWorkflowRuns
    }
    let { workflow_runs } = storedRuns,
      runs = workflow_runs.map(run => {
        let { id, name, head_branch, status, conclusion, workflow_id: wf_id } = run;
        return { id, name, head_branch, status, conclusion, workflow_id: wf_id }
      });

    runs = Object.values(runs.reduce((accum, run) => {
      let { head_branch } = run
      accum[head_branch] = accum[head_branch] || run;
      return accum;
    }, {} as { [s: string]: WorkflowRunPart; }));


    return { branches: runs, hashHex, count: workflow_runs.length }
  }
  async computeResultRequestFromHash({ hashHex, branch }: { hashHex: string, branch?: string }): Promise<Response> {

    const { owner, repo, workflow_id, GITHUB_TOKEN } = (await this.state.storage.get(`hash:${hashHex}`) || {}) as TWorkflowParams & { GITHUB_TOKEN: string }

    const ghRequest = new GithubRequest({ owner, repo, workflow_id, branch }, GITHUB_TOKEN),
      res = await ghRequest.fetch({ method: 'GET' });


    const { workflow_runs } = (await res.json()) as IWorkflowRuns, runs = workflow_runs.map((run) => {
      let { id, name, head_branch, status, conclusion, workflow_id: wf_id } = run;
      return { id, name, head_branch, status, conclusion, workflow_id: wf_id };
    })

    return json(computeColorAndMessage(runs as IWorkflowRun[], Number(workflow_id), branch), {
      headers: {
        'cache-control': 'max-age=300, public'
      }
    })


  }


  /**
   * Even if {IttyDurable} does already take care of handling the fetch method by default, we need to 
   * inject our Sentry client here, so we override it. 
   * 
   * @param {Request} request 
   * @returns {Response}
   */
  async fetch(request: Request): Promise<Response> {
    let body = await request.json();



    let { env, owner, repo, workflow_id, requestURL, GITHUB_TOKEN, hashHex, branch } = (body[0] || {}) as IRequestParams,
      method: string = request.url.split('/call/').pop() as string,
      jsonReq = { env, owner, repo, workflow_id, GITHUB_TOKEN, hashHex, branch, headers: [...request.headers.entries()] };
    this.Sentry = this.getSentryInstance(request, env)
    try {

      if (typeof this[method] === 'function') {
        console.log({ method })
        // eslint-disable-next-line @typescript-eslint/ban-types
        return (this[method] as Function)({ owner, repo, requestURL, workflow_id, GITHUB_TOKEN, hashHex, branch }).then((result: unknown) => {
          return result instanceof Response ? result : new Response(JSON.stringify(result), {
            headers: {
              "content-type": "application/json",
              "access-control-allow-origin": "*"
            }
          })
        })
      }
      return json(jsonReq)
    } catch (err) {
      this.Sentry.captureException(err)
      return json(this.respondWithError(err as Error))
    }
  }

  getSentryInstance(request?: Request, env?: EnvWithDurableObject & { [s: string]: unknown }): Toucan {
    if (!this.Sentry && request && env) {
      console.log('instancing sentry')
      this.Sentry = new Toucan({ context: this.state, request, dsn: String(env.SENTRY_DSN), environment: String(env.WORKER_ENV), release: env.RELEASE, debug: false })
      this.Sentry.setRequestBody(request?.body)
    }

    return this.Sentry
  }
  private respondWithError(err: Error & { status?: unknown, url?: string }): ErrorObject & { eventId?: string } {
    let eventId = this.getSentryInstance().captureException(err)
    return (err.status || 500, { name: err.name, message: err.message, eventId, url: err.url, stack: (err.stack || '').split('\n') })
  }


  private computeErroredResponse({ owner, repo }: { owner: string, repo: string }, res: Response): Error {
    const err = new Error(`Request to ${owner}/${repo} failed with status: ${res.status} ${res.statusText}`) as Error & { status: number }
    err.status = res.status;
    return err
  }





}
