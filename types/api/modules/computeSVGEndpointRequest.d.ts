import type { TctxWithSentry } from '../index';
import type { TRequestWithParams, EnvWithDurableObject } from 'itty-router-extras';
export declare function computeSVGEndpointRequest(request: TRequestWithParams, env: EnvWithDurableObject, ctx: TctxWithSentry): Promise<Response>;
export declare function computeEmbeddedSVGEndpointRequest(request: TRequestWithParams, env: EnvWithDurableObject, ctx: TctxWithSentry): Promise<Response>;
