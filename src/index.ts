


interface IWaitableObject {
  waitUntil: (promise: Promise<any>) => void;
}



import type Toucan from 'toucan-js';
import { ThrowableRouter, error } from 'itty-router-extras';
import { computeAvailableWorkflowsRequest } from './modules/computeAvailableWorkflowsRequest';
import { computeAssetRequest } from './modules/computeAssetRequest';
import { computeResultRequest } from './modules/computeResultRequest';
import { computeResultRequestFromHash } from "./modules/computeResultRequestFromHash";
import { getSentryInstance } from './modules/getSentryInstance';
import { computeSVGEndpointRequest } from './modules/computeSVGEndpointRequest';





export interface EnvWithBindings {
  GITHUB_TOKEN: string,
  SENTRY_CONNSTRING: string,
  WORKER_ENV: string,
  WORKER_URL: string,
  RELEASE: string,
  BADGER_KV: KVNamespace
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const possibleColors = {
  'critical': 'critical',
  'inactive': 'inactive',
  'success': 'success',
  'yellow': 'yellow'
};
const router = ThrowableRouter<RequestWithParams>({
  routes: [

    [
      'GET', new RegExp(`(?<hash>([a-f0-9]{20}))$`), [
        (request: RequestWithParams, env: EnvWithBindings, ctx: TctxWithSentry) => computeResultRequestFromHash(request, env, ctx)
      ]
    ]
  ]
})
router
  .get('/images/*', computeAssetRequest)
  // .get('/fallback/endpoint.svg', computeFallbackSvg)
  .get('/:hash/endpoint.svg', computeSVGEndpointRequest)

  .get('/:owner/:repo', computeAvailableWorkflowsRequest)
  .get('/:owner/:repo/:workflow_id/endpoint.svg', computeSVGEndpointRequest)
  .get('/:owner/:repo/:workflow_id', computeResultRequest)

  .get('*', computeAssetRequest)


const exportDefault = {
  fetch: async (request: Request, env: EnvWithBindings, { waitUntil }: IWaitableObject): Promise<Response> => {
    const ctx: TctxWithSentry = {
      waitUntil,
      sentry: getSentryInstance({ request, waitUntil }, env),
      request,
    }
    return Promise.resolve(router.handle(request, env, ctx))
      .catch((err) => {
        ctx.sentry.captureException(err)
        console.error('event_id', err);
        return error(err.status || 500, err.message)
      });
  }
}
addEventListener('fetch', async (event: FetchEvent) => {

  const env: EnvWithBindings = {
    GITHUB_TOKEN,
    SENTRY_CONNSTRING,
    WORKER_ENV,
    WORKER_URL,
    BADGER_KV,
    RELEASE
  },
    { request } = event,
    waitUntil = event.waitUntil.bind(event)


  event.respondWith(exportDefault.fetch(request, env, { waitUntil }))
});




