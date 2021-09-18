/// <reference types="@cloudflare/workers-types" />
interface IWaitableObject {
    waitUntil: (promise: Promise<any>) => void;
}
import type Toucan from 'toucan-js';
export interface EnvWithBindings {
    GITHUB_TOKEN: string;
    SENTRY_CONNSTRING: string;
    WORKER_ENV: string;
    WORKER_URL: string;
    RELEASE: string;
    BADGER_KV: KVNamespace;
}
export declare type TctxWithSentry = {
    request: Request;
    sentry: Toucan;
} & IWaitableObject;
export declare function computeErroredResponse({ owner, repo }: {
    owner: string;
    repo: string;
}, res: Response): Error;
export declare type RequestWithParams = Request & {
    color?: string;
    params: {
        [s: string]: string;
    };
};
export {};
