import { TRequestWithParams, EnvWithDurableObject } from 'itty-router-extras';
import type { TctxWithSentry } from '../_index';
import type { Options } from '@cloudflare/kv-asset-handler/dist/types';
export declare const getAssetFromKVDefaultOptions: (env: EnvWithDurableObject) => Partial<Options> & {
    defaultDocument: string;
};
export declare function computeAssetRequest(request: TRequestWithParams, env: EnvWithDurableObject, ctx: TctxWithSentry): Promise<Response>;
