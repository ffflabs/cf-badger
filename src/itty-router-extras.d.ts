declare module "itty-router-extras" {
    import { Router, Route, RouterOptions } from 'itty-router'
    import { IttyDurable } from 'itty-durable'

    function ThrowableRouter<TRequest>(options?: RouterOptions<TRequest> & { stack?: boolean }): Router<TRequest>
    type ThrowableRouter<TRequest> = {
        handle: (request: Request & TRequest, ...extra: any) => any
    } & {
        [any: string]: Route
    }
    export type EnvWithBindings = Record<string, unknown> & {
        GITHUB_TOKEN: string,
        SENTRY_DSN: string,
        WORKER_ENV: string,
        WORKER_URL: string,
        RELEASE: string,
        BADGER_KV: KVNamespace
        __STATIC_CONTENT: KVNamespace
        __STATIC_CONTENT_MANIFEST: string
        APP_ID: number
        PRIVATE_KEY_1: string;
        PRIVATE_KEY_2: string;
        PRIVATE_KEY_3: string;
        GH_PRIVATE_KEY: string;
        WEBHOOK_ROUTE: string;
        GITHUB_PUBKEY: string;
    }


    type DurableStubGetter = {
        get(id: string): IttyDurable;
    };

    export type EnvWithDurableObject = EnvWithBindings & {
        Badger: DurableStubGetter
        defaultState: undefined
    }
    type TRequestWithParams = Request & {
        color?: string;
        code: string;
        env: EnvWithDurableObject,
        owner: string,
        repo: string,
        workflow_id: string,
        GITHUB_TOKEN: string,

        hashHex: string,
        branch?: string

        Badger: DurableStubGetter
        params: {
            [s: string]: string;
        };
    };

    function withParams(req: Request): void;
    function json(body: unknown, responseType?: ResponseInit): Response
    function missing(message?: string): Response
    function error(header?: number, body?: unknown): Response
}
