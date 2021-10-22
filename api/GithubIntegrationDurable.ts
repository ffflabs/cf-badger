import { createAppAuth, createOAuthUserAuth } from '@octokit/auth-app';
import type { AuthInterface, RequestInterface } from '@octokit/auth-app/dist-types/types';
import { Octokit } from "@octokit/rest";
import { IttyDurable } from 'itty-durable';
import { EnvWithDurableObject, error, json } from 'itty-router-extras';
import kleur from 'kleur';
import Toucan from 'toucan-js';
import type { computeColorAndMessage } from './modules/computeColorAndMessage';
import { createKeyPair, getDERfromPEM } from './modules/signing_utils';
import type { IInstallWebhook, Repository, Sender } from './modules/webhook_schemes';



export async function computeLoginHash({ login, id, token }: { login: string; id: number, token: string }): Promise<string> {
    const linkParams = new TextEncoder().encode(JSON.stringify({ login, id, token }));
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


export async function computeResultHash({ owner, repo, workflow_id }: { owner: string; workflow_id: number, repo: string }): Promise<string> {
    const linkParams = new TextEncoder().encode(JSON.stringify({ owner, repo, workflow_id }));
    const hashBuffer = await crypto.subtle.digest(
        {
            name: "SHA-1",
        },
        linkParams
    );
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substr(0, 20); // convert bytes to hex string. Use first 20 chars as slug
    return hashHex
}
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
    raw: boolean,
    prefix: string,

    requestURL: URL,
    installationId?: number
    hashHex: string,
    branch?: string
    verb?: string
    endpoint?: string,
    payload: IInstallWebhook
    code?: string
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
type TghAppJWT = { token: string, appId: number, expiration: number, ttl?: number }



type TViewerRepos = {

    login: string;
    repositories: {
        edges: RepoEdge[];
    } | TRepoSlug[];
    repo_count: number
    [s: string]: unknown;

};
type TMinimalInstallationInfo = { login: string; target_type?: string; installationId: number; target_id: number; repos: string, enabledFor: string }

export interface TInstallationInfo {
    id: number
    installationId: number;
    target_type: string;
    login: string;
    target_id?: number | null;
    repository_selection: string;
    access_tokens_url?: string;
    repositories_url?: string;
    html_url?: string;
    app_id?: number;
    app_slug?: string;
    permissions: Permissions;
    events: string[];
    created_at?: string;
    updated_at?: string;
    single_file_name?: null;
    has_multiple_single_files?: boolean;
    single_file_paths?: any[];
    suspended_by?: null;
    suspended_at: null;
    [s: string]: unknown
}
export type TInstallationItem = Omit<TInstallationInfo, 'installationId'> & {
    id: number;
    target_type: string// 'User' | 'Organization';
    account: {
        [s: string]: string | number | boolean | null | undefined;
        id?: number,
        login?: string
    } | null;
};
export function dataItemToInstallationInfo(data: TInstallationItem, WORKER_URL: string): TInstallationInfo {
    let { id, target_type, account, repository_selection,
        permissions,
        events,
        created_at,
        updated_at,
        suspended_at } = data,
        { login, id: target_id } = account || {}
    if (!account) {
        console.log(Object.keys(data))
    }
    const reposInstallation = `${WORKER_URL}/badger/${login}`
    return {
        id,
        installationId: id,
        target_type,
        login: String(login),
        target_id,
        repos: reposInstallation,
        // repository_selection,
        permissions,
        events,
        // created_at,
        // updated_at,
        // suspended_at,
    } as unknown as TInstallationInfo
}

type TRepoSlug = {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    workflows: string;
};

function mapRepoEdges(edges: RepoEdge[], WORKER_URL: string) {
    return edges.map((edge: RepoEdge) => {
        let { name, nameWithOwner, isPrivate, databaseId, id } = edge.node
        return mapRepo({ full_name: String(nameWithOwner), private: !!isPrivate, id: Number(databaseId), name: String(name), node_id: id }, WORKER_URL)
    })
}
export interface RepoEdge {
    node: RepoNode;
}

export interface RepoNode {
    nameWithOwner: string;
    id: string;
    name: string;
    isPrivate: boolean;
    databaseId: number;
}
function mapRepo(repo: Repository, WORKER_URL: string): TRepoSlug {
    const workflows = `${WORKER_URL}/badger/${repo.full_name}`
    return { id: repo.id, name: repo.name, full_name: repo.full_name, private: repo.private, workflows }
}

export function mapRepos(repositories: Repository[], WORKER_URL: string): TRepoSlug[] {
    return repositories.map(repo => mapRepo(repo, WORKER_URL))
}

function mapSender(senderRaw: Sender) {
    let { login, id: target_id, node_id } = senderRaw
    return { login, target_id, node_id }
}
export type OctokitUserInstance = Octokit & {
    token: string; code: string; login: string, userId: number
}
interface IInstanceEntities {
    publicCriptoKey: CryptoKey;
    privateCriptoKey: CryptoKey;
    octokit: {
        app: Octokit;
    };
    userOctokit: {
        [s: string]: OctokitUserInstance
    };
}
export abstract class GithubIntegrationDurable extends IttyDurable {
    Sentry!: Toucan;

    state: DurableObjectState & EnvWithDurableObject & IInstanceEntities
    [s: string]: unknown
    debug: (...args: unknown[]) => void;
    constructor(state: DurableObjectState, env: EnvWithDurableObject) {
        super(state, env)


        this.state = state as DurableObjectState & EnvWithDurableObject & IInstanceEntities
        this.state.BADGER_KV = env.BADGER_KV as KVNamespace
        this.state.GH_PRIVATE_KEY = env.GH_PRIVATE_KEY || [env.PRIVATE_KEY_1, env.PRIVATE_KEY_2, env.PRIVATE_KEY_3].join("\n");
        this.state.GITHUB_PUBKEY = env.GITHUB_PUBKEY
        this.state.release = env.RELEASE;
        this.state.APP_ID = env.APP_ID
        this.state.FRONTEND_HOSTNAME = env.FRONTEND_HOSTNAME
        this.state.env = env
        this.state.GITHUB_TOKEN = env.GITHUB_TOKEN as string;
        this.state.WORKER_ENV = env.WORKER_ENV as string;
        this.state.WORKER_URL = env.WORKER_URL as string;
        this.state.GITHUB_CLIENT_ID = env.GITHUB_CLIENT_ID as string;
        this.state.GITHUB_CLIENT_SECRET = env.GITHUB_CLIENT_SECRET as string;
        this.state.appAuth = { token: '', appId: env.APP_ID, expiration: Math.floor(Date.now() / 1000) - 1000, ttl: 0 } as TghAppJWT
        this.state.octokit = {} as { app: Octokit }
        this.state.userOctokit = {} as { [s: string]: OctokitUserInstance }
        this.state.octokit.app = this.getOctokit()
        this.debug = console.debug.bind(console, kleur.green('DEBUG: '))
        this.log = console.log.bind(console, kleur.blue('LOG: '))
        this.info = console.info.bind(console, kleur.cyan('INFO: '))
        this.warn = console.warn.bind(console, kleur.yellow('WARN: '))
        this.error = console.error.bind(console, kleur.red('ERROR: '))

        this.state.storage.put(this.state.GITHUB_TOKEN, { login: 'cf-badger', id: env.APP_ID, token: this.state.GITHUB_TOKEN })



    }
    protected async getOrCreateKeyPair(): Promise<{ privateKey: ArrayBuffer; publicKey: ArrayBuffer; }> {

        let StoredPrivateKey = await this.state.BADGER_KV.get('ENCRYPT_PRIVATE_KEY', 'arrayBuffer'),
            StoredPublicKey = await this.state.BADGER_KV.get('ENCRYPT_PUBLIC_KEY', 'arrayBuffer')
        if (!StoredPrivateKey || !StoredPublicKey) {
            const { privateKey, publicKey } = await createKeyPair()
            //return Promise.all([
            //keyPair.privateKey ? exportPrivateCryptoKey(keyPair.privateKey) : Promise.resolve(''),
            //keyPair.publicKey ? exportPublicCryptoKey(keyPair.publicKey) : Promise.resolve('')
            //])
            if (privateKey) await this.state.BADGER_KV.put('ENCRYPT_PRIVATE_KEY', privateKey)
            if (publicKey) await this.state.BADGER_KV.put('ENCRYPT_PUBLIC_KEY', publicKey)
            StoredPrivateKey = privateKey
            StoredPublicKey = publicKey
        }
        return { privateKey: StoredPrivateKey, publicKey: StoredPublicKey } as { privateKey: ArrayBuffer; publicKey: ArrayBuffer; }
    }
    protected async getPublicCryptoKey(): Promise<CryptoKey> {


        if (!this.state.publicCriptoKey) {

            let { privateKey, publicKey } = await this.getOrCreateKeyPair()

            this.state.publicCriptoKey = await crypto.subtle.importKey(
                'spki',
                getDERfromPEM(this.state.GITHUB_PUBKEY),
                {
                    name: "RSA-OAEP",
                    hash: { name: 'SHA-256' },
                },
                false,
                ['verify', 'encrypt']
            );

        }
        return this.state.publicCriptoKey as CryptoKey
    }

    protected async getPrivateCryptoKey(algorithm: { name: string, hash: { name: string } }, force = false): Promise<CryptoKey> {


        if (!this.state.privateCriptoKey || force) {

            let { privateKey, publicKey } = await this.getOrCreateKeyPair()

            algorithm = algorithm || {
                name: "RSA-OAEP",
                hash: { name: 'SHA-256' },
            } as { name: string, hash: { name: string } }


            this.state.privateCriptoKey = await crypto.subtle.importKey(
                'pkcs8',
                getDERfromPEM(this.state.GH_PRIVATE_KEY),

                algorithm,
                false,
                ['decrypt', 'sign']
            );

        }
        return this.state.privateCriptoKey as CryptoKey
    }

    protected processError(err: Error & { status?: unknown, url?: string }, extra: { [s: string]: string | number }): ErrorObject & { eventId?: string } {
        let eventId = this.getSentryInstance().captureException(err)

        err.status = err.status || 500
        return { name: err.name, message: err.message, eventId, url: err.url, stack: (err.stack || '').split('\n'), ...extra }
    }
    protected errorToResponse(err: ErrorObject & { status: number, eventId?: string }): Response {
        return error(err.status, err)
    }

    protected computeErroredResponse({ owner, repo }: { owner: string, repo: string }, res: Response): Error {
        const err = new Error(`Request to ${owner}/${repo} failed with status: ${res.status} ${res.statusText}`) as Error & { status: number }
        err.status = res.status;
        return err
    }

    async webhook({ id, name, payload }: { id: string, name: string, payload: IInstallWebhook }): Promise<{ ok: boolean; }> {


        const { action, installation: installationRaw, sender: senderRaw, repositories_removed, repositories_added } = payload,
            installationInfo = dataItemToInstallationInfo(installationRaw as unknown as TInstallationItem, this.state.WORKER_URL);

        this.state.waitUntil(this.state.BADGER_KV.put(`installation:${payload.installation.id}`, JSON.stringify(installationRaw), { metadata: installationInfo }))
        installationInfo.installationId = installationInfo.installationId || installationInfo.id

        this.storeWithExpiration(`installationId:${installationInfo.installationId}`, installationInfo, 1000000)
        this.storeWithExpiration(`owner:${installationInfo.login}`, installationInfo, 1000000)

        const repositories = mapRepos((repositories_added || []).concat(repositories_removed || []), this.state.WORKER_URL),
            sender = mapSender(senderRaw)
        this.Sentry.captureMessage(`Received webhook for ${action} on ${installationInfo.login} `)

        console.log({ id, name, action, installationInfo, repositories: repositories.length, repositories_added, sender })

        return { "ok": true }
    }
    async get_keys({ prefix }: { prefix: string }): Promise<{ [s: string]: unknown }> {
        this.debug({ get_keys: prefix })
        const list = await this.state.storage.list({ prefix })
        this.debug({ list, keys: list.keys })
        return Object.fromEntries(list) as { [s: string]: unknown }
    }
    protected actingAsInstallation(installationId: number): RequestInterface {
        let appAuth = this.createAppAuth(installationId);
        appAuth({ type: 'installation', installationId }).then(auth => console.log(auth))
        // this.getOctokit().apps.
        return this.getOctokit().request.defaults({
            request: {
                hook: appAuth.hook,
            },
        });
    }

    async getInstallationsForUser(userOctokit: OctokitUserInstance, installationId?: number): Promise<TMinimalInstallationInfo[]> {
        const cacheKey = `${userOctokit.code}:installations`
        let stored = false && await this.getStoredWithTtl<{ installations: { [s: number]: TMinimalInstallationInfo } }>(cacheKey) || { ttl: null, installations: {} }

        if (stored && stored.ttl && stored.installations && Object.keys(stored.installations).length && !installationId) {
            return Object.values(stored.installations)
        }
        return userOctokit.rest.apps.listInstallationsForAuthenticatedUser().then(async ({ data }): Promise<TMinimalInstallationInfo[]> => {
            if (data.installations && data.installations.length) {
                //      this.debug(data.installations)
                stored.installations = (data.installations as TInstallationItem[]).map(i => dataItemToInstallationInfo(i, this.state.WORKER_URL)).reduce((accum, installation) => {
                    let { login, target_type, installationId: iid, target_id, repository_selection: enabledFor } = installation
                    console.log({ login, target_type })

                    accum[iid] = { login, target_type, installationId: Number(iid), target_id: Number(target_id), enabledFor, repos: `${this.state.WORKER_URL}/badger/${login}` }
                    return accum;
                }, stored.installations || {})
                // Cache available installations. 
                this.storeWithExpiration(cacheKey, { ...stored }, 300)

                return Object.values(stored.installations)
            }
            return []
        })
    }
    protected async actingAsOauthUser({ code, installationId }: { code: string, installationId?: number }): Promise<Response> {

        /**
         * Having just authenticated with github, we must trade the code
         * for a token
         */
        const userOctokit = (await this.getOctokit().auth({
            type: 'oauth-user',
            code,
            factory: (options: unknown) => {
                return new Octokit({
                    authStrategy: createOAuthUserAuth,
                    auth: options,
                })
            }
        })) as OctokitUserInstance


        const authObj = (await userOctokit.auth()) as { token: string }
        if (!(authObj as { token: string }).token) {
            throw new Error('Could not get token')
        }

        this.debug({ method: 'actingAsOauthUser', code, installationId })
        userOctokit.token = authObj.token
        userOctokit.code = code
        return userOctokit.users.getAuthenticated().then(async ({ data: { login, id } }) => {
            const payload = { token: authObj.token, login, id }
            userOctokit.login = login
            userOctokit.userId = id
            this.state.storage.put(code, payload)
            const hash = await computeLoginHash(payload)
            userOctokit.code = hash
            this.state.storage.put(hash, payload)

            const installations = await this.getInstallationsForUser(userOctokit, installationId)
            const jsonResponse = new Response(JSON.stringify({ ...payload, hash, installations }), {
                status: 302,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    'set-cookie': `gh_code = ${String(hash)}; domain=.cf-badger.com; path = /; secure; HttpOnly; SameSite=None` //badger_jwt = ${String(jwt)}; path = /; secure; HttpOnly; SameSite=Lax`
                },
            });
            jsonResponse.headers.append('set-cookie', `code = ${String(code)}; path = /; domain=.cf-badger.com; secure; HttpOnly; SameSite=None`)
            let location = [`https://${this.state.FRONTEND_HOSTNAME}`]
            let installation = installations.find(i => i.installationId === installationId)
            if (installation && installation.login) {
                location.push(installation.login)
            }
            jsonResponse.headers.set('Location', location.join('/'))

            return jsonResponse
        })



    }

    protected async actingAsUser(code: string): Promise<Octokit & { token: string, code: string, login: string, userId: number }> {
        let props = (await this.state.storage.get(code) || { token: '', login: '' }) as { [s: string]: unknown }
        if (!props.token) {
            throw new Error('unknown user')
        }
        this.debug({ storedInfo: Object.keys(props) })
        if (this.state.userOctokit[code]) {
            console.log(`Octokit instance already existed for code ${code},login: ${props.login} token ${props.token}`)
            this.state.userOctokit[code].code = code
            return this.state.userOctokit[code]
        }
        this.state.userOctokit[code] = new Octokit({
            authStrategy: createOAuthUserAuth,
            auth: {
                ...this.getAuthParams(),
                clientType: "github-app",
                token: props.token,
                type: 'oauth-app',
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                factory: (options: unknown) => {
                    return new Octokit({
                        authStrategy: createOAuthUserAuth,
                        auth: options,
                    })
                }
            }
        }) as Octokit & { token: string, code: string, login: string, userId: number }
        this.state.userOctokit[code].token = String(props.token)
        this.state.userOctokit[code].code = code
        return this.state.userOctokit[code].users.getAuthenticated().then(({ data: { login, id } }) => {
            this.state.storage.put(code, { token: props.token, login, id });
            this.state.userOctokit[code].userId = id;
            this.state.userOctokit[code].login = login;

            console.log(`created Octokit instance this.state.userOctokit[${code}], token ${props.token} for user ${login}`);
            return this.state.userOctokit[code];
        }).catch(err => {
            this.Sentry.captureException(err);
            return this.state.userOctokit[code];
        }) as unknown as Octokit & { token: string, code: string, login: string, userId: number }
    }

    protected async getPublicRepos(userOctokit: Octokit, login: string): Promise<TViewerRepos & { installationId: number | null }> {
        const query = ` {
            user(login: "${login}") {
              id
              login
              databaseId
              repositories(first: 100,privacy:PUBLIC) {
                          edges {
                            node {
                             id, name,nameWithOwner,isPrivate,databaseId
                            }
                          }
                        }
            }
            organization(login: "${login}") {
              id,login,databaseId
              repositories(first: 100,privacy:PUBLIC) {
                          edges {
                            node {
                             id, name,nameWithOwner,isPrivate,databaseId
                            }
                          }
                        }
            }
          }`;




        const { user, organization } = (await userOctokit.graphql(query)) as { user: TViewerRepos, organization: TViewerRepos }
        let viewer = user || organization
        viewer.repositories = mapRepoEdges((viewer.repositories as { edges: RepoEdge[]; }).edges, this.state.WORKER_URL);
        viewer.repo_count = viewer.repositories.length;


        const result = { installationId: null, install_url: `https://github.com/apps/cf-badger/installations/new/permissions?target_id=${viewer.databaseId}`, target_id: viewer.databaseId, ...viewer }

        return result
    }

    protected createAppAuth(installationId?: number, type?: string): AuthInterface {
        let authParams = this.getAuthParams()
        if (installationId) {
            authParams = { ...authParams, installationId, type: 'installation' }
        }
        return createAppAuth(authParams)
    }
    /**
 * Even if {IttyDurable} does already take care of handling the fetch method by default, we need to 
 * inject our Sentry client here, so we override it. 
 * 
 * @param {Request} request 
 * @returns {Response}
 */
    async fetch(req: Request): Promise<Response> {
        let body = await req.json();



        let { owner, repo, workflow_id, requestURL, hashHex, branch, verb, raw, endpoint, payload, code, prefix, installationId } = (body[0] || {}) as IRequestParams,
            method: string = req.url.split('/call/').pop() as string,
            jsonParams = { owner, repo, workflow_id, branch, prefix, raw, installationId },
            jsonParamsFull = { ...jsonParams, requestURL, hashHex, branch, verb, endpoint, payload, code }

        this.Sentry = this.getSentryInstance(req)
        try {

            if (typeof this[method] === 'function') {

                console.log({ method })
                // eslint-disable-next-line @typescript-eslint/ban-types
                return (this[method] as Function)(jsonParamsFull).then((result: unknown) => {
                    return result instanceof Response ? result : new Response(JSON.stringify(result), {
                        headers: {
                            "content-type": "application/json",
                            "access-control-allow-origin": "*"
                        }
                    })
                })
            }
            return json(jsonParams)
        } catch (err) {
            const httpError = err as Error & { status: number }
            this.Sentry.captureException(httpError)
            return json(this.processError(httpError, {}), { status: httpError.status || 500 })
        }
    }

    getSentryInstance(req?: Request): Toucan {
        if (!this.Sentry && req) {
            console.log('instancing sentry')
            const env: EnvWithDurableObject = this.state.env as EnvWithDurableObject
            this.Sentry = new Toucan({
                context: this.state,
                request: req,
                dsn: String(env.SENTRY_DSN),
                environment: String(env.WORKER_ENV),
                release: env.RELEASE,
                debug: false
            })
            this.Sentry.setRequestBody(req?.body)
        }

        return this.Sentry
    }
    protected getOctokit(): Octokit {
        if (!this.state.octokit.app) {
            this.state.octokit.app = new Octokit({
                authStrategy: createAppAuth,
                auth: {
                    ...this.getAuthParams(),
                    factory: (options: unknown) => {
                        console.log({ factoryOpts: options })
                        return new Octokit({
                            authStrategy: createAppAuth,
                            auth: options,
                        })
                    }
                },
            });

        }
        return this.state.octokit.app as Octokit
    }
    protected getOctokitForInstallation(installationId: number): Promise<Octokit> {
        let authParams = {
            ...this.getAuthParams(),
            installationId,
            type: 'installation'
        }

        return this.getOctokit().auth({
            ...authParams,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            factory: (options: unknown) => {
                //console.log({ factoryOpts: options })
                return new Octokit({
                    authStrategy: createAppAuth,
                    auth: options,
                })
            }
        }) as unknown as Promise<Octokit>
    }





    protected async getStoredWithTtl<T extends Record<string, unknown>>(key: string): Promise<T & { ttl: number }> {
        let stored = (await this.state.storage.get(key) || { expiration: 0 }) as T & { expiration: number, ttl: number },
            ttl = GithubIntegrationDurable.secondsRemaining(stored.expiration)
        if (ttl > 30) {
            console.log(`getStoredWithTtl: ${key}, ttl ${ttl}`)
            return { ...stored, ttl }
        }
        return { ttl: 0 } as T & { ttl: number }
    }
    protected storeWithExpiration<T>(key: string, result: T, ttl = 180): T & { expiration: number, ttl: number } {
        let resultWithExpiration = { ...result, expiration: Math.floor(Date.now() / 1000) + ttl }
        console.log('storeWithExpiration ', key)
        this.state.waitUntil(this.state.storage.put(key, resultWithExpiration))

        return { ...resultWithExpiration, ttl }
    }




    static secondsRemaining(expiration = 0): number {
        return expiration - Math.floor(Date.now() / 1000)
    }
    protected getAuthParams(): { appId: number; privateKey: string; clientId: string; clientSecret: string; installationId?: number; type?: string } {
        return {
            appId: this.state.APP_ID,
            privateKey: String(this.state.GH_PRIVATE_KEY),
            clientId: String(this.state.GITHUB_CLIENT_ID),
            clientSecret: String(this.state.GITHUB_CLIENT_SECRET),
        }
    }



}