
import type { IttyDurable } from 'itty-durable';
import { withDurables } from 'itty-durable';
import { DurableStubGetter, error, ThrowableRouter, TRequestWithParams, EnvWithDurableObject, json } from 'itty-router-extras';

import { computeAssetRequest, getAssetFromKVDefaultOptions } from './modules/computeAssetRequest';
import { computeSVGEndpointRequest } from './modules/computeSVGEndpointRequest';
import { Badger, TOutputResults } from './Badger';

import type { IRequestParams } from './Badger'
import Toucan from 'toucan-js';
import type { Context } from 'toucan-js/dist/types';
import type { EnvWithBindings } from 'itty-router-extras';




export async function computeRunStatusParameters(request: TRequestWithParams, env: EnvWithDurableObject): Promise<Omit<IRequestParams, 'env'>> {
  let { url: originalUrl, params } = request, { owner, repo, workflow_id, } = params, requestURL = new URL(originalUrl), GITHUB_TOKEN = requestURL.searchParams.get('token') || env.GITHUB_TOKEN;
  const hashHex = await computeHash({ owner, repo, workflow_id, GITHUB_TOKEN }); // convert bytes to hex string
  return { owner, repo, workflow_id, GITHUB_TOKEN, requestURL, hashHex };

}
async function computeHash({ owner, repo, workflow_id, GITHUB_TOKEN }: { owner: string; repo: string; workflow_id: string; GITHUB_TOKEN: string; }): Promise<string> {
  const linkParams = new TextEncoder().encode(JSON.stringify({ owner, repo, workflow_id, GITHUB_TOKEN }));

  const hashBuffer = await crypto.subtle.digest(
    {
      name: "SHA-1",
    },
    linkParams
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substr(0, 20); // convert bytes to hex string. Use first 20 chars as slug
  return hashHex;
}

export interface IWaitableObject {
  waitUntil: (promise: Promise<unknown>) => void
}
export type TctxWithSentry = {
  request: Request;
  sentry: Toucan;
} & IWaitableObject;




export { Badger }


function getSentryInstance(ctx: Context, env: EnvWithBindings): Toucan {
  /**
   * Only instance Toucan when we have a valid DSN in the environment
   */
  if (env.SENTRY_DSN) {
    return new Toucan({
      context: ctx,
      request: ctx.request,
      dsn: String(env.SENTRY_DSN),
      environment: String(env.WORKER_ENV),
      release: env.RELEASE,
      debug: false
    });
  }
  let breadCrumbs = [] as { [s: string]: unknown; }[];
  /**
   * Otherwise, return a dummy
   */
  return {
    captureException: (err: Error) => {
      console.error(err);
      return Date.now();
    },
    addBreadcrumb: (args: { [s: string]: unknown; }) => {
      breadCrumbs.push(args);
    },
    captureMessage: (msg: string) => {
      console.log(msg);
      return Date.now();
    }
  } as unknown as Toucan;

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
    .get('/badger',
      async (
        request: TRequestWithParams,
        env: EnvWithDurableObject
      ): Promise<Response> => {
        return json(getAssetFromKVDefaultOptions(env))
      })

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

export default {
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

