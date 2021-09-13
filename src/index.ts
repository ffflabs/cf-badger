
//import { version } from '../package.json';
import { fallbackSvg } from './modules/fallback_svg';

import { playgroundHTML } from './frontend'
interface IWaitableObject {
  waitUntil: (promise: Promise<any>) => void;
}

interface IPkgConfig {
  name: string;
  description: string;
  main: string;
  version: string;
}


import Toucan from 'toucan-js';
import type { Context } from 'toucan-js/dist/types';
import type { WorkflowRunPart, IWorkflowList, IWorkflowRuns, WorkflowRun } from './handler';
import { computeColorAndMessage } from './handler';
import { ThrowableRouter, json, error } from 'itty-router-extras';

const pkg: IPkgConfig = require('../package.json'),
  { version: release } = pkg


interface EnvWithBindings {
  GITHUB_TOKEN: boolean;
  USE_AVIF: boolean;
  WORKER_NAMESPACE: string;
  PNG_QUALITY: number;
  JPG_QUALITY: number;
  SENTRY_CONNSTRING: string;
  WORKER_ENV: string;
  USE_CACHE: boolean;
}
function getSentryInstance(ctx: Context, env: EnvWithBindings): Toucan {
  return new Toucan({
    context: ctx,
    request: ctx.request,
    dsn: String(env.SENTRY_CONNSTRING),
    environment: String(env.WORKER_ENV),
    release,
    debug: false,
    pkg,
  });
}
export type TctxWithSentry = {
  request: Request;
  sentry: Toucan;
} & IWaitableObject;

function computeGithubRequest(
  { repo, owner, workflow_id }: { repo: string, owner: string, workflow_id?: string },
  env: EnvWithBindings
): Request {
  const cfInit = {
    headers: {
      Accept: "application/vnd.github.v3+json",
      Authorization: `token ${env.GITHUB_TOKEN}`
    }
  },
    ghRequest = new Request(`https://api.github.com/repos/${owner}/${repo}/actions/workflows${workflow_id ? ('/' + workflow_id + '/runs') : ''}`, cfInit);
  console.log({ ghRequestUrl: ghRequest.url.toString(), cfInit })
  return ghRequest
}
function computeErroredResponse({ owner, repo }: { owner: string, repo: string }, res: Response): Error {
  const err = new Error(`Request to ${owner}/${repo} failed with status: ${res.status} ${res.statusText}`) as Error & { status: number }
  err.status = res.status;
  return err
}
type RequestWithParams = Request & {
  color?: string;
  params: {
    [s: string]: string;
  };
};

const possibleColors = {
  'critical': 'critical',
  'inactive': 'inactive',
  'success': 'success',
  'yellow': 'yellow'
};
/*type TColors = keyof typeof possibleColors
const PossibleColorsRoute = `(${Object.keys(possibleColors).join('|')})`

function populateStatus() {

  return (req: RequestWithParams): void => {
    let { url } = req,
      parsedUrl = new URL(url.toString()),
      pathname = parsedUrl.pathname;

    let etfRegex = new RegExp(PossibleColorsRoute, 'ig');
    let routeParts = etfRegex.exec(pathname);

    if (routeParts && routeParts[1]) {
      req.color = routeParts[1] as TColors
    }

  };
}*/
const router = ThrowableRouter<RequestWithParams>({
  routes: [
    ['GET', new RegExp(`(?<color>(${Object.keys(possibleColors).join('|')}))`), [(request: RequestWithParams) => json(request.params)]]
  ]
})

router

  .get('/:owner/:repo', async (request: RequestWithParams, env: EnvWithBindings, ctx: TctxWithSentry): Promise<Response> => {
    let { url, params: { owner, repo } } = request,
      ghRequest = computeGithubRequest({ owner, repo }, env)

    ctx.sentry.addBreadcrumb({ data: { url, ghRequest } });

    const res = await fetch(ghRequest)
    if (!res.ok) {
      throw computeErroredResponse({ owner, repo }, res)
    }
    const { workflows } = (await res.json()) as IWorkflowList,
      workflow_runs_urls = workflows.map(workflow => {
        let { id, name, path } = workflow, fileName = path.split('/').pop()
        return { id_url: `${url}/${id}`, name, filename_url: `${url}/${fileName}` }
      })
    return json(workflow_runs_urls)
  })
  .get('/:owner/:repo/:workflow_id', async (
    request: RequestWithParams,
    env: EnvWithBindings,
    ctx: TctxWithSentry
  ): Promise<Response> => {
    let { url: originalUrl, params: { owner, repo, workflow_id: wf_id } } = request,
      requestURL = new URL(originalUrl),
      branch = requestURL.searchParams.get('branch'),
      ghRequest = computeGithubRequest({ owner, repo, workflow_id: wf_id }, env)

    ctx.sentry.addBreadcrumb({ data: { originalUrl, ghRequest } });
    const res = await fetch(ghRequest)
    if (!res.ok) {
      throw computeErroredResponse({ owner, repo }, res)
    }
    const { workflow_runs } = (await res.json()) as IWorkflowRuns,
      runs = workflow_runs.map((run): WorkflowRunPart => {
        let { id, name, head_branch, status, conclusion, workflow_id } = run
        //
        return {
          id,
          url: `https://github.com/${owner}/${repo}/actions/runs/${id}`,
          name,
          head_branch,
          status,
          conclusion,
          workflow_id
        }
      })
    return json(computeColorAndMessage(runs as WorkflowRun[], Number(wf_id), branch))
    //return json({ msg: computeColorAndMessage(runs as WorkflowRun[], Number(wf_id), branch), runs })


  })
  .get('/favicon.ico', () => new Response(fallbackSvg, { headers: { 'Content-Type': 'image/svg' } }))
  .get('/', () => new Response(playgroundHTML, { headers: { 'Content-Type': 'text/html' } }))
const exportDefault = {
  fetch: async (request: Request, env: EnvWithBindings, ctx: TctxWithSentry): Promise<Response> => {
    return Promise.resolve(router.handle(request, env, ctx))
      .catch((err) => {
        let event_id = ctx.sentry.captureException(err),
          warnObj = {
            event_id,
            error: err.message,
            stack: err.stack.split('\n'),
          };

        console.warn(warnObj);
        return error(err.status || 500, err.message)
      });
  }
}
addEventListener('fetch', async (event: FetchEvent) => {
  //console.log({ url, keys: Object.keys(event.request) })
  const env: EnvWithBindings = {
    GITHUB_TOKEN,
    USE_AVIF,
    WORKER_NAMESPACE,
    PNG_QUALITY,
    JPG_QUALITY,
    SENTRY_CONNSTRING,
    WORKER_ENV,
    USE_CACHE,
  },
    { request } = event,
    waitUntil = event.waitUntil.bind(event),
    ctx: TctxWithSentry = {
      waitUntil,
      sentry: getSentryInstance({ request, waitUntil }, env),
      request,
    }
  console.log({ env })
  event.respondWith(exportDefault.fetch(request, env, ctx))



});


