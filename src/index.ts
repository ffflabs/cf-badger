
import type { IttyDurable } from 'itty-durable';
import { withDurables } from 'itty-durable';
import { DurableStubGetter, error, ThrowableRouter, TRequestWithParams, EnvWithDurableObject } from 'itty-router-extras';

import { computeAssetRequest } from './modules/computeAssetRequest';
import { computeRunStatusParameters } from './modules/computeRunStatusParameters';
import { computeSVGEndpointRequest } from './modules/computeSVGEndpointRequest';
import { getSentryInstance } from './modules/getSentryInstance';
import { Badger, TOutputResults } from './Badger';

import type { IRequestParams } from './Badger'
import type Toucan from 'toucan-js';


export interface IWaitableObject {
  waitUntil: (promise: Promise<unknown>) => void
}
export type TctxWithSentry = {
  request: Request;
  sentry: Toucan;
} & IWaitableObject;




export { Badger }


export function computeErroredResponse({ owner, repo }: { owner: string, repo: string }, res: Response): Error {
  const err = new Error(`Request to ${owner}/${repo} failed with status: ${res.status} ${res.statusText}`) as Error & { status: number }
  err.status = res.status;
  return err
}
// eslint-disable-next-line @typescript-eslint/ban-types
type TBadgerMethod<TMethodName extends string> = Badger[TMethodName] extends Function ? Badger[TMethodName] : { (args: IRequestParams): Promise<Response> }

type ittyWithMethod<TMethodName extends string> = { [K in TMethodName]: TBadgerMethod<TMethodName> }

function getEnhancedIttyDurable<TMethodName extends string>(stubGetter: DurableStubGetter, nameId: string): IttyDurable & ittyWithMethod<TMethodName> {
  return stubGetter.get(nameId) as unknown as IttyDurable & ittyWithMethod<TMethodName>
}

function getParentRouter(): ThrowableRouter<TRequestWithParams> {

  const router = ThrowableRouter<TRequestWithParams>({
    routes: [

      [
        'GET', new RegExp(`badger/(?<hash>([a-f0-9]{20}))$`), [
          async (
            request: TRequestWithParams,
            env: EnvWithDurableObject,

          ) => {
            withDurables()(request, env)
            const requestURL = new URL(request.url),
              hashHex = request.params.hash,
              branch = requestURL.searchParams.get('branch') || 'master',
              durableStub = getEnhancedIttyDurable<'computeResultRequestFromHash'>(request.Badger, 'durable_Badger')


            return durableStub.computeResultRequestFromHash({ hashHex, requestURL, branch })

          }
        ]
      ]
    ]
  })
  return router

    .get('/images/*', computeAssetRequest)
    .all('*', withDurables())

    .get(
      '/badger/:hash/endpoint.svg',
      computeSVGEndpointRequest)

    .get(
      '/badger/:owner/:repo',
      async (
        request: TRequestWithParams,
        env: EnvWithDurableObject
      ): Promise<{ id: number; id_url: string; name: string; filename_url: string; }[]> => {
        let durableStub = getEnhancedIttyDurable<'computeAvailableWorkflowsRequest'>(request.Badger, 'durable_Badger')

        return durableStub.computeAvailableWorkflowsRequest(await computeRunStatusParameters(request, env))
      })

    .get(
      '/badger/:owner/:repo/:workflow_id',
      async (
        request: TRequestWithParams,
        env: EnvWithDurableObject,
      ): Promise<TOutputResults> => {
        let durableStub = getEnhancedIttyDurable<'computeResultRequest'>(request.Badger, 'durable_Badger')
        let { owner, repo, workflow_id, GITHUB_TOKEN, requestURL, hashHex } = await computeRunStatusParameters(request, env),
          branch = (request.params.branch ? decodeURIComponent(request.params.branch) : requestURL.searchParams.get('branch')) || undefined
        return durableStub.computeResultRequest({ owner, repo, workflow_id, GITHUB_TOKEN, hashHex, branch })
      })

    .get(
      '*',
      /**
       * Serve static assets with kv-asset-handler when running in local environment
       * (there files are outside the worker's route in production)
       * @param {TRequestWithParams} request 
       * @param {EnvWithDurableObject} env 
       * @param {TctxWithSentry} ctx 
       * @returns {Response}
       */
      async (
        request: TRequestWithParams,
        env: EnvWithDurableObject,
        ctx: TctxWithSentry
      ): Promise<Response> => {

        return computeAssetRequest(request, env, ctx)
      })
}

const exportDefault = {
  fetch:

    async (
      request: TRequestWithParams,
      env: EnvWithDurableObject,
      { waitUntil }:
        IWaitableObject): Promise<Response> => {
      const ctx: TctxWithSentry = {
        waitUntil,
        sentry: getSentryInstance({ request, waitUntil }, env),
        request,
      },
        router = getParentRouter()


      return Promise.resolve(router.handle(request, env, ctx))
        .catch((err) => {
          ctx.sentry.captureException(err)
          console.error('event_id', err);
          return error(err.status || 500, err.message)
        });
    }
}
/*
CF-Badger was originally deployed as a non-module service-worker
addEventListener('fetch', async (event: FetchEvent) => {

  const env: EnvWithDurableObject = {
    GITHUB_TOKEN,
    SENTRY_DSN,
    WORKER_ENV,
    WORKER_URL,
    BADGER_KV,
    RELEASE
  },
    { request } = event,
    waitUntil = event.waitUntil.bind(event)


  event.respondWith(exportDefault.fetch(request, env, { waitUntil }))
});




*/
export default exportDefault