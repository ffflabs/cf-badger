import type { RequestWithParams, EnvWithBindings, TctxWithSentry } from '../index';
export declare function computeResultRequestFromHash(request: RequestWithParams, env: EnvWithBindings, ctx: TctxWithSentry): Promise<Response>;
