import { IttyDurable } from 'itty-durable';
import { json, EnvWithDurableObject } from 'itty-router-extras';
import Toucan from 'toucan-js';

import type { TWorkflowParams } from "./modules/computeGithubRequest";
import { computeGithubRequest, ModifiableRequest } from "./modules/computeGithubRequest";
import type { IWorkflowRuns, WorkflowRun, WorkflowRunPart } from './modules/handler';
import { computeColorAndMessage, IWorkflowList } from './modules/handler';


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
    this.state.GITHUB_TOKEN = env.GITHUB_TOKEN as string;
    this.state.SENTRY_DSN = env.SENTRY_DSN as string;
    this.state.WORKER_ENV = env.WORKER_ENV as string;
    this.state.WORKER_URL = env.WORKER_URL as string;


  }
  computeGithubRequest(workflowParams: TWorkflowParams,
    { GITHUB_TOKEN }: { GITHUB_TOKEN: string }
  ): ModifiableRequest {
    return computeGithubRequest(workflowParams, { GITHUB_TOKEN })
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
    let ghRequest = computeGithubRequest({ owner, repo }, { GITHUB_TOKEN });

    const res = await ghRequest.fetch({ method: 'GET' });

    const { workflows } = (await res.json()) as IWorkflowList;

    return workflows.map((workflow): { id: number; id_url: string; name: string; filename_url: string; } => {
      let { id, name, path } = workflow, fileName = path.split('/').pop();
      return { id, id_url: `${requestURL.toString()}/${id}`, name, filename_url: `https://github.com/${owner}/${repo}/actions/workflows/${fileName}` };
    });

  }

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
    const storedPromise = this.state.BADGER_KV.put(`hash:${hashHex}`, JSON.stringify({ owner, repo, workflow_id, GITHUB_TOKEN }))

    const ghRequest = computeGithubRequest({ owner, repo, workflow_id, branch }, { GITHUB_TOKEN })
    //console.log(ghRequest)
    //ctx.sentry.addBreadcrumb({ data: { requestURL, ghRequest: ghRequest.url } });
    const res = await ghRequest.fetch({ method: 'GET' })
    if (!res.ok) {
      throw this.computeErroredResponse({ owner, repo }, res);
    }

    let { workflow_runs } = (await res.json()) as IWorkflowRuns,
      runs = workflow_runs.map(run => {
        let { id, name, head_branch, status, conclusion, workflow_id: wf_id } = run;
        return { id, name, head_branch, status, conclusion, workflow_id: wf_id }
      });

    runs = Object.values(runs.reduce((accum, run) => {
      let { head_branch } = run
      accum[head_branch] = accum[head_branch] || run;
      return accum;
    }, {} as { [s: string]: WorkflowRunPart; }));


    return storedPromise.then(() => ({ branches: runs, hashHex, count: workflow_runs.length }));
  }
  async computeResultRequestFromHash({ hashHex, branch }: { hashHex: string, requestURL: URL, branch?: string }): Promise<{ color: string; message: string; isError?: boolean | undefined; }> {

    const { owner, repo, workflow_id, GITHUB_TOKEN } = (await this.state.BADGER_KV.get(`hash:${hashHex}`, 'json') || {}) as {
      owner: string; repo: string; workflow_id: string; GITHUB_TOKEN: string;
    },
      ghRequest = computeGithubRequest({ owner, repo, workflow_id, branch }, { GITHUB_TOKEN }),
      res = await ghRequest.fetch({ method: 'GET' });
    if (!res.ok) {
      throw this.computeErroredResponse({ owner, repo }, res);
    }

    const { workflow_runs } = (await res.json()) as IWorkflowRuns, runs = workflow_runs.map((run) => {
      let { id, name, head_branch, status, conclusion, workflow_id: wf_id } = run;
      return { id, name, head_branch, status, conclusion, workflow_id: wf_id };
    });


    return { ...computeColorAndMessage(runs as WorkflowRun[], Number(workflow_id), branch) }


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
        return (this[method] as Function)({ owner, repo, requestURL, workflow_id, GITHUB_TOKEN, hashHex, branch }).then((result: unknown) => new Response(JSON.stringify(result), {
          headers: {
            "content-type": "application/json",
            "access-control-allow-origin": "*"
          }
        }))
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
