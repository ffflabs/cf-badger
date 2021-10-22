import { TRequestWithParams, EnvWithDurableObject } from 'itty-router-extras';
import Toucan from 'toucan-js';
export declare function computeRunStatusParameters(request: TRequestWithParams): Promise<Omit<IRequestParams, 'workflow_id' | 'raw' | 'prefix' | 'payload' | 'env'> & {
    workflow_id: number;
}>;
export interface IWaitableObject {
    waitUntil: (promise: Promise<unknown>) => void;
}
export declare type TctxWithSentry = {
    request: Request;
    sentry: Toucan;
} & IWaitableObject;
import { Badger } from './Badger';
import type { IRequestParams } from './GithubIntegrationDurable';
export { Badger };
declare const _default: {
    fetch: (request: TRequestWithParams, env: EnvWithDurableObject, { waitUntil }: IWaitableObject) => Promise<Response>;
};
export default _default;
