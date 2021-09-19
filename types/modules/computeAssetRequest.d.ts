import { TRequestWithParams, EnvWithDurableObject } from 'itty-router-extras';
import type { TctxWithSentry } from '../index';
export declare function computeAssetRequest(request: TRequestWithParams, env: EnvWithDurableObject, ctx: TctxWithSentry): Promise<Response>;
