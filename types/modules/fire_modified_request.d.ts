/// <reference types="@cloudflare/workers-types" />
import { TctxWithSentry } from '../index';
/**
 *
 * @param imageRequest
 * @param event
 * @param cf
 * @returns
 */
export declare function fireModifiedRequest(
  imageRequest: Request,
  ctx: TctxWithSentry,
  cf: RequestInitCfProperties,
): Promise<Response>;
