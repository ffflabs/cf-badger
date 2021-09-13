
//import { version } from '../package.json';
import { fallbackSvg } from './modules/fallback_svg';

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
import { ThrowableRouter, json, error } from 'itty-router-extras';
import { computeAvailableWorkflowsRequest } from './computeAvailableWorkflowsRequest';
import { computeAssetRequest } from './computeAssetRequest';
import { computeResultRequest } from './computeResultRequest';

const pkg: IPkgConfig = require('../package.json'),
  { version: release } = pkg


export interface EnvWithBindings {
  GITHUB_TOKEN: string,
  SENTRY_CONNSTRING: string,
  WORKER_ENV: string,
  WORKER_URL: string,
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

export function computeErroredResponse({ owner, repo }: { owner: string, repo: string }, res: Response): Error {
  const err = new Error(`Request to ${owner}/${repo} failed with status: ${res.status} ${res.statusText}`) as Error & { status: number }
  err.status = res.status;
  return err
}
export type RequestWithParams = Request & {
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
const router = ThrowableRouter<RequestWithParams>({
  routes: [
    ['GET', new RegExp(`(?<color>(${Object.keys(possibleColors).join('|')}))`), [(request: RequestWithParams) => json(request.params)]]
  ]
})
router

  .get('/:owner/:repo', computeAvailableWorkflowsRequest)
  .get('/:owner/:repo/:workflow_id/:branch/endpoint.svg', computeEndpointSvgRequest)
  .get('/:owner/:repo/:workflow_id/:branch?*', computeResultRequest)
  .get('/favicon.ico', () => new Response(fallbackSvg, { headers: { 'Content-Type': 'image/svg' } }))
  .get('*', computeAssetRequest)


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

        console.warn(warnObj, env);
        return error(err.status || 500, err.message)
      });
  }
}
addEventListener('fetch', async (event: FetchEvent) => {
  //console.log({ url, keys: Object.keys(event.request) })
  const env: EnvWithBindings = {
    GITHUB_TOKEN,
    SENTRY_CONNSTRING,
    WORKER_ENV,
    WORKER_URL,
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


async function computeEndpointSvgRequest(
  request: RequestWithParams
): Promise<Response> {
  const { url, params: { owner, repo, workflow_id: wf_id, branch } } = request, requestURL = new URL(url),
    endpoint = `https://cf-badger.ctohm.com/${owner}/${repo}/${wf_id}/${branch}`, style = requestURL.searchParams.get('style') || 'flat', cf: RequestInitCfProperties = {
      cacheTtlByStatus: { '200-299': 300, '400-499': 1, '500-599': 0 },
    };
  return fetch(`https://img.shields.io/endpoint.svg?url=${encodeURIComponent(endpoint)}&style=${style}`, { cf });

}

