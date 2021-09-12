import { TctxWithSentry } from '../index';
/**
 *
 * @param fullSizeImgStr
 * @param resizedUrl
 * @param event
 * @returns
 */
export declare function returnWithCF(
  fullSizeImgStr: string,
  resizedUrl: URL,
  ctx: TctxWithSentry,
): Promise<Response>;
