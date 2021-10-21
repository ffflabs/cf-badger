
import type { IttyDurable } from 'itty-durable';
import { withDurables } from 'itty-durable';
import { DurableStubGetter, error, ThrowableRouter, TRequestWithParams, EnvWithDurableObject, json } from 'itty-router-extras';

import { computeSVGEndpointRequest } from './modules/computeSVGEndpointRequest';



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

import { Badger, TInstallationRepos, TOutputResults, TWorkflow } from './Badger';


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

function getParentRouter(envCommon: EnvWithBindings): ThrowableRouter<TRequestWithParams> {
  //const privateKey = [PRIVATE_KEY_1, PRIVATE_KEY_2, PRIVATE_KEY_3].join("\n");


  const router = ThrowableRouter<TRequestWithParams>({
    routes: [

      [
        'GET', new RegExp(`badger/_(?<hash>([a-f0-9]{20}))$`), [
          async (
            request: TRequestWithParams,
            env: EnvWithDurableObject,

          ): Promise<Response> => {
            withDurables()(request, env)
            const requestURL = new URL(request.url),
              hashHex = request.params.hash,
              branch = requestURL.searchParams.get('branch') || 'master',
              durableStub = getEnhancedIttyDurable<'computeResultRequestFromHash'>(request.Badger, 'durable_Badger')

            return durableStub.computeResultRequestFromHash({ hashHex, branch })

          }
        ]
      ]
    ]
  })

  //https://local.cf-badger.com/badger/ctohm/dbthor.cesion.poc/1798987

  return router
    .options('*', (


    ): Response => {
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
      ): Promise<Response> => Response.redirect(`https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&redirect_uri=${env.WORKER_URL}/bdg/code`))
    .get('/bdg/install', (
    ): Response => Response.redirect(`https://github.com/apps/cf-badger/installations/new`, 302))


    .all('*', withDurables())
    /**
* This endpoint isn't exposed in production
*/
    .get(
      '/installations',
      async (
        request: TRequestWithParams
      ): Promise<unknown> => {
        const requestURL = new URL(request.url),

          raw = requestURL.searchParams.has('raw')
        return getEnhancedIttyDurable<'listInstallations'>(request.Badger, 'durable_Badger').listInstallations({ raw })
      })
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
          .user({ code, installationId }).catch(err => {
            console.error(err);
            return error(500, (err as { message: string }).message)
          })
      }).
    get(`/keys/:prefix`, async (
      request: TRequestWithParams,

    ): Promise<{ [s: string]: unknown }> => {
      return getEnhancedIttyDurable<'get_keys'>(request.Badger, 'durable_Badger')
        .get_keys({ prefix: request.params.prefix })
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

        }).catch(err => {
          console.error(err);
          return json({ ok: true })
        })

      })

    .post('/badger/_logout', async (
      request: TRequestWithParams,
      env: EnvWithDurableObject
    ): Promise<Response> => {
      const jsonResponse = new Response('Come back soon', {
        status: 302,
        headers: {
          "Access-Control-Allow-Origin": "*",
          'set-cookie': `gh_code = ; path = /; secure; HttpOnly; SameSite=Lax;Max-Age= 0` //badger_jwt = ${String(jwt)}; path = /; secure; HttpOnly; SameSite=Lax`
        },
      });
      jsonResponse.headers.append('set-cookie', `code =; path = /; secure; HttpOnly; SameSite=Lax;Max-Age= 0`)
      jsonResponse.headers.set('Location', `${env.WORKER_URL}`)
      return jsonResponse
    })
    .get(
      '/badger/:hash/endpoint.svg',
      computeSVGEndpointRequest)
    /**
     * From here onwards, user is expected to be authenticated
     */
    .all('/badger/*', (request: TRequestWithParams): Response | void => {
      let cookie = request.headers.get('cookie')
      let cookieValue = /gh_code=([a-z0-9]+)/.exec(cookie || '')
      if (!cookieValue || cookieValue.length < 2) {
        return json({ error: 'Please authenticate to perform this request' }, {})
      }
      request.code = cookieValue[1]



    })

    /**
     * List installations available to logged user
     */
    .get('/badger',
      async (
        request: TRequestWithParams

      ): Promise<Response> => {
        const headers = {
          "x-code": request.code || 'none',
          "access-control-allow-origin": "*"
        }

        if (!request.code) {
          return json({ login: null }, { headers })
        }
        return getEnhancedIttyDurable<'user'>(request.Badger, 'durable_Badger')
          .user({ code: request.code }).catch(err => {
            console.error(err);
            return error(500, (err as { message: string }).message)
          })
      })





    /**
     * List repos for a given installation
     */

    .get(
      '/badger/:owner',
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
      '/badger/:owner/:repo',
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
      '/badger/:owner/:repo/:workflow_id',
      async (
        request: TRequestWithParams,
        env: EnvWithDurableObject,
      ): Promise<TOutputResults> => {
        let durableStub = getEnhancedIttyDurable<'getWorkflowResults'>(request.Badger, 'durable_Badger')
        let { owner, repo, workflow_id, code, requestURL } = await computeRunStatusParameters(request),
          branch = (request.params.branch ? decodeURIComponent(request.params.branch) : requestURL.searchParams.get('branch')) || undefined
        return durableStub.getWorkflowResults({ owner, repo, workflow_id, code, branch })
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
        env: EnvWithDurableObject
      ): Promise<Response> => {
        console.log('catchAll', request.url)
        const newURL = new URL(request.url)
        newURL.protocol = String('https')
        newURL.hostname = String(env.FRONTEND_HOSTNAME || env.WORKER_URL)
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




      env.GH_PRIVATE_KEY = [env.PRIVATE_KEY_1, env.PRIVATE_KEY_2, env.PRIVATE_KEY_3].join("\n");
      const router = getParentRouter(env)
      return Promise.resolve(router.handle(request, env, { waitUntil }))
        .catch((err) => {
          getSentryInstance({ request, waitUntil }, env).captureException(err)

          console.error('event_id', err);
          return error(err.status || 500, err.message)
        });

    }
}

