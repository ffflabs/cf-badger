import { TctxWithSentry, EnvWithBindings } from './index';
/**
 * Fetch and log a request
 * @param {FetchEvent} event
 */
export declare function handleRequest(
  ctx: TctxWithSentry,
  env: EnvWithBindings,
): Promise<Response>;
export declare function handleEvent(
  ctx: TctxWithSentry,
  env: EnvWithBindings,
): Promise<Response>;
