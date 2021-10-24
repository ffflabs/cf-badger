
import type { IttyDurable } from 'itty-durable';
import { withDurables } from 'itty-durable';
import { DurableStubGetter, error, ThrowableRouter, TRequestWithParams, EnvWithDurableObject, json } from 'itty-router-extras';

import { computeSVGEndpointRequest, computeEmbeddedSVGEndpointRequest } from './modules/computeSVGEndpointRequest';



import Toucan from 'toucan-js';
import type { Context } from 'toucan-js/dist/types';
import type { EnvWithBindings } from 'itty-router-extras';




export async function computeRunStatusParameters(request: TRequestWithParams): Promise<Omit<IRequestParams, 'workflow_id' | 'raw' | 'prefix' | 'payload' | 'env'> & { workflow_id: number }> {
  let { url: originalUrl, params, code } = request,
    { owner, repo, workflow_id, } = params,
    requestURL = new URL(originalUrl)
  const hashHex = await computeHash({ owner, repo, workflow_id, code }); // convert bytes to hex string
  return { owner, repo, workflow_id: Number(workflow_id), code, requestURL, hashHex };

}
async function computeHash({ owner, repo, workflow_id, code }: { owner: string; repo: string; workflow_id: string; code: string; }): Promise<string> {
  const linkParams = new TextEncoder().encode(JSON.stringify({ owner, repo, workflow_id, code }));

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

import { Badger } from './Badger';
import type { TInstallationRepos, TOutputResults, TWorkflow } from './modules/TInstallations'

import type { IRequestParams } from './GithubIntegrationDurable';

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
      return 0
    },
    addBreadcrumb: (args: { [s: string]: unknown; }) => {
      breadCrumbs.push(args);
    },
    captureMessage: (msg: string) => {
      console.log(msg);
      return 0
    }
  } as unknown as Toucan;

}
// eslint-disable-next-line @typescript-eslint/ban-types
type TBadgerMethod<TMethodName extends string> = Badger[TMethodName] extends Function ? Badger[TMethodName] : { (args: IRequestParams): Promise<Response> }

type ittyWithMethod<TMethodName extends string> = { [K in TMethodName]: TBadgerMethod<TMethodName> }

function getEnhancedIttyDurable<TMethodName extends string>(stubGetter: DurableStubGetter, nameId: string): IttyDurable & ittyWithMethod<TMethodName> {
  return stubGetter.get(nameId) as unknown as IttyDurable & ittyWithMethod<TMethodName>
}

function getAuthenticatedRouter(envCommon: EnvWithBindings, ctx: TctxWithSentry): ThrowableRouter<TRequestWithParams> {
  const base = '/badger'
  const router = ThrowableRouter<TRequestWithParams>({
    stack: true,
    base,
    routes: [

      [
        'GET', new RegExp(`_(?<hash>([a-f0-9]{20}))$`), [
          async (
            request: TRequestWithParams,
          ): Promise<Response> => {
            const requestURL = new URL(request.url),
              hashHex = request.params.hash,
              branch = requestURL.searchParams.get('branch') || 'master'
            return getEnhancedIttyDurable<'computeResultRequestFromHash'>(request.Badger, 'durable_Badger').computeResultRequestFromHash({ hashHex, branch })

          }
        ]
      ], [
        'GET', new RegExp(`_(?<hash>([a-f0-9]{20}))\.yml$`), [
          async (
            request: TRequestWithParams,
          ): Promise<Response> => {
            return getEnhancedIttyDurable<'redirectToWorkFlow'>(request.Badger, 'durable_Badger').redirectToWorkFlow({ hashHex: request.params.hash })
          }
        ]
      ],
      [
        'GET', new RegExp(`_(?<hash>([a-f0-9]{20}))\.svg$`), [
          async (
            request: TRequestWithParams, env: EnvWithDurableObject
          ): Promise<Response> => {
            return computeSVGEndpointRequest(request, env, ctx)
          }
        ]
      ]
    ]
  })

  /**
     * Before delegating to authenticated router, ensure the user has the needed cookie
     */
  return router.all('*', (request: TRequestWithParams): Response | void => {
    let cookie = request.headers.get('cookie')
    let cookieValue = /gh_code=([a-z0-9_]+)/.exec(cookie || '')
    if (!cookieValue || cookieValue.length < 2) {
      return json({ error: 'Please authenticate to perform this request' })
    }
    request.code = cookieValue[1]

  })
    /**
    * From here onwards, user is expected to be authenticated
    */


    /**
     * List installations available to logged user
     */
    .get('/',
      async (
        request: TRequestWithParams

      ): Promise<Response> => {
        if (!request.code) {
          return json({ login: request.code })
        }
        return getEnhancedIttyDurable<'user'>(request.Badger, 'durable_Badger')
          .user({ code: request.code })
      })

    /**
     * List repos for a given installation
     */
    .get(
      '/:owner',
      async (
        request: TRequestWithParams
      ): Promise<TInstallationRepos> => {
        request.params.code = request.code
        return getEnhancedIttyDurable<'getRepositories'>(request.Badger, 'durable_Badger').getRepositories({ ...request.params } as { owner: string })
      })
    /**
     * List workflows for a given repo
     */
    .get(
      '/:owner/:repo',
      async (
        request: TRequestWithParams,
        env: EnvWithDurableObject
      ): Promise<{ workflows: TWorkflow[] }> => {
        request.params.code = request.code
        return getEnhancedIttyDurable<'getRepoWorkflows'>(request.Badger, 'durable_Badger')
          .getRepoWorkflows(await computeRunStatusParameters(request))
      })
    /**
     * List branches for a given workflow
     */
    .get(
      '/:owner/:repo/:workflow_id',
      async (
        request: TRequestWithParams,
      ): Promise<TOutputResults> => {
        let durableStub = getEnhancedIttyDurable<'getWorkflowResults'>(request.Badger, 'durable_Badger')
        let { owner, repo, workflow_id, code, requestURL } = await computeRunStatusParameters(request),
          branch = (request.params.branch ? decodeURIComponent(request.params.branch) : requestURL.searchParams.get('branch')) || undefined
        return durableStub.getWorkflowResults({ owner, repo, workflow_id, code, branch })
      })
}
function getParentRouter(envCommon: EnvWithBindings, ctx: TctxWithSentry): ThrowableRouter<TRequestWithParams> {
  //const privateKey = [PRIVATE_KEY_1, PRIVATE_KEY_2, PRIVATE_KEY_3].join("\n");


  const router = ThrowableRouter<TRequestWithParams>({
    stack: true
  })

  //https://local.cf-badger.com/badger/ctohm/dbthor.cesion.poc/1798987

  router
    .options('*', (): Response => {
      // console.log(env)
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    })

    .get('/bdg/oauth',
      async (
        request: TRequestWithParams,
        env: EnvWithDurableObject
      ): Promise<Response> => Response.redirect(`https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&redirect_uri=${env.WORKER_URL}`))
    .get('/bdg/install', (
    ): Response => Response.redirect(`https://github.com/apps/cf-badger/installations/new`, 302))


    .all('*', withDurables())
    /**
    * Gets token for a used just redirected from github
    */
    .all('/bdg/code',
      async (
        request: TRequestWithParams,
        env: EnvWithDurableObject
      ): Promise<Response> => {
        const method = request.method
        let code: string | null = '',
          installationId: number | undefined,
          requestURL = new URL(request.url)
        if (method === 'GET') {
          code = requestURL.searchParams.get('code') || request.code
          installationId = requestURL.searchParams.has('installation_id') ? Number(requestURL.searchParams.get('installation_id')) : undefined
        } else {
          let postData = await request.json()

          code = (postData).code
          installationId = (postData).installation_id
          console.log({ postData })
        }
        console.log({ code, installationId })
        if (!code) {
          return Response.redirect(env.WORKER_URL)
        }

        return getEnhancedIttyDurable<'user'>(request.Badger, 'durable_Badger')
          .user({ code, installationId })
      })
    .post(
      `/bdg/${envCommon.WEBHOOK_ROUTE}`,
      async (
        request: TRequestWithParams
      ): Promise<{ ok: boolean }> => {
        //console.log(env)
        const id = String(request.headers.get("x-github-delivery"));
        const name = String(request.headers.get("x-github-event"));
        const payload = await request.json();

        let durableStub = getEnhancedIttyDurable<'webhook'>(request.Badger, 'durable_Badger')
        return Promise.resolve().then(() => {
          return durableStub.webhook({ id, name, payload })

        })

      })
    /**
     * Allow ppl to logout even if they weren't logged in, what gives...
     */
    .post('/bdg/_logout', async (
      request: TRequestWithParams,
      env: EnvWithDurableObject
    ): Promise<Response> => {
      const jsonResponse = new Response('Come back soon', {
        status: 302,
        headers: {
          "Access-Control-Allow-Origin": "*",
          'set-cookie': `gh_code = ''; domain=.cf-badger.com; path = /; secure; HttpOnly; SameSite=None;Max-Age=0`
        },
      });
      jsonResponse.headers.append('set-cookie', `code = ''; path = /; domain=.cf-badger.com; secure; HttpOnly; SameSite=None; Max-Age=0`)
      jsonResponse.headers.set('Location', `${env.WORKER_URL}`)
      return jsonResponse
    })

    .get(
      '/badger/:hash/endpoint.svg',
      computeSVGEndpointRequest)

    .get(
      '/badger/:hash/endpoint.html',
      computeEmbeddedSVGEndpointRequest)

    /**
     * Before delegating to authenticated router, ensure the user has the needed cookie
     */
    .all('/badger/*', (request: TRequestWithParams, env: EnvWithDurableObject): Response | void => getAuthenticatedRouter(envCommon, ctx).handle(request, env))

  /**
* This endpoint isn't exposed in production
*/
  router.get(
    '/installations',
    async (
      request: TRequestWithParams
    ): Promise<unknown> => {
      const requestURL = new URL(request.url),

        raw = requestURL.searchParams.has('raw')
      return getEnhancedIttyDurable<'listInstallations'>(request.Badger, 'durable_Badger').listInstallations({ raw })
    })
    .get(`/keys/:prefix`, async (
      request: TRequestWithParams,

    ): Promise<{ [s: string]: unknown }> => {
      return getEnhancedIttyDurable<'get_keys'>(request.Badger, 'durable_Badger')
        .get_keys({ prefix: request.params.prefix })
    })

  return router.get(
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
      env: EnvWithDurableObject
    ): Promise<Response> => {
      const newURL = new URL(request.url)
      newURL.protocol = String(env.ASSETS_PROTOCOL || 'https')
      newURL.hostname = String(env.ASSETS_URL || env.WORKER_URL)
      newURL.port = String(env.ASSETS_PORT || 443)
      return fetch(newURL.toString(), request)
    })
}

export default {
  fetch:

    async (
      request: TRequestWithParams,
      env: EnvWithDurableObject,
      { waitUntil }:
        IWaitableObject): Promise<Response> => {



      const ctx = { waitUntil, request, sentry: getSentryInstance({ request, waitUntil }, env) }

      env.GH_PRIVATE_KEY = env.GH_PRIVATE_KEY || [env.PRIVATE_KEY_1, env.PRIVATE_KEY_2, env.PRIVATE_KEY_3].join("\n");
      const router = getParentRouter(env, ctx)


      return Promise.resolve(router.handle(request, env,))


        .catch(err => {
          ctx.sentry.captureException(err)
          console.error(err);
          return json({ message: err.message, stack: env.WORKER_ENV === 'development' ? String(err.stack).replace(new RegExp(env.PROJECT_ROOT, 'ig'), '').split('\n') : [] })
        })
    }
}

