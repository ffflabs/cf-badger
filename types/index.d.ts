import { TRequestWithParams, EnvWithDurableObject } from 'itty-router-extras';
import { Badger } from './Badger';
import type { IRequestParams } from './Badger';
import Toucan from 'toucan-js';
export declare function computeRunStatusParameters(request: TRequestWithParams, env: EnvWithDurableObject): Promise<Omit<IRequestParams, 'env'>>;
export interface IWaitableObject {
    waitUntil: (promise: Promise<unknown>) => void;
}
export declare type TctxWithSentry = {
    request: Request;
    sentry: Toucan;
} & IWaitableObject;
export { Badger };
declare const _default: {
    fetch: (request: TRequestWithParams, env: EnvWithDurableObject, { waitUntil }: IWaitableObject) => Promise<Response>;
};
export default _default;
