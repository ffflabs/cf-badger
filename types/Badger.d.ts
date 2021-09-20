/// <reference types="@cloudflare/workers-types" />
import { IttyDurable } from 'itty-durable';
import { EnvWithDurableObject } from 'itty-router-extras';
import Toucan from 'toucan-js';
import { computeColorAndMessage } from './modules/computeColorAndMessage';
export interface IRequestParams {
    env: EnvWithDurableObject;
    owner: string;
    repo: string;
    workflow_id: string;
    GITHUB_TOKEN: string;
    requestURL: URL;
    hashHex: string;
    branch?: string;
}
declare type TRunResults = {
    id: number;
    name: string;
    head_branch: string;
    status: "queued" | "in_progress" | "completed";
    conclusion: "success" | "neutral" | "failure" | "cancelled" | "timed_out" | "action_required";
    workflow_id: number;
};
export declare type TOutputResults = ReturnType<typeof computeColorAndMessage> | {
    branches: TRunResults[];
    hashHex: string;
    count: number;
};
export declare class Badger extends IttyDurable implements DurableObject {
    Sentry: Toucan;
    state: DurableObjectState & EnvWithDurableObject;
    [s: string]: unknown;
    constructor(state: DurableObjectState, env: EnvWithDurableObject);
    computeAvailableWorkflowsRequest({ requestURL, owner, repo, GITHUB_TOKEN }: {
        requestURL: URL;
        owner: string;
        repo: string;
        GITHUB_TOKEN: string;
    }): Promise<{
        id: number;
        id_url: string;
        name: string;
        filename_url: string;
    }[]>;
    computeResultRequest({ owner, repo, workflow_id, GITHUB_TOKEN, hashHex, branch }: {
        owner: string;
        repo: string;
        workflow_id: string;
        GITHUB_TOKEN: string;
        hashHex: string;
        branch?: string;
    }): Promise<TOutputResults>;
    computeResultRequestFromHash({ hashHex, branch }: {
        hashHex: string;
        requestURL: URL;
        branch?: string;
    }): Promise<{
        color: string;
        message: string;
        isError?: boolean | undefined;
    }>;
    /**
     * Even if {IttyDurable} does already take care of handling the fetch method by default, we need to
     * inject our Sentry client here, so we override it.
     *
     * @param {Request} request
     * @returns {Response}
     */
    fetch(request: Request): Promise<Response>;
    getSentryInstance(request?: Request, env?: EnvWithDurableObject & {
        [s: string]: unknown;
    }): Toucan;
    private respondWithError;
    private computeErroredResponse;
}
export {};
