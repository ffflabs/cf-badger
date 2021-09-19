import { TRequestWithParams, EnvWithDurableObject } from 'itty-router-extras';
import { Badger } from './Badger';
import type Toucan from 'toucan-js';
export interface IWaitableObject {
    waitUntil: (promise: Promise<unknown>) => void;
}
export declare type TctxWithSentry = {
    request: Request;
    sentry: Toucan;
} & IWaitableObject;
export { Badger };
export declare function computeErroredResponse({ owner, repo }: {
    owner: string;
    repo: string;
}, res: Response): Error;
declare const exportDefault: {
    fetch: (request: TRequestWithParams, env: EnvWithDurableObject, { waitUntil }: IWaitableObject) => Promise<Response>;
};
export default exportDefault;
