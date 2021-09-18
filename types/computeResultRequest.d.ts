import { RequestWithParams, EnvWithBindings, TctxWithSentry } from './index';
export declare function computeRunStatusParameters(request: RequestWithParams, env: EnvWithBindings): Promise<{
    hashHex: string;
    owner: string;
    repo: string;
    workflow_id: string;
    requestURL: URL;
    GITHUB_TOKEN: string;
}>;
export declare function computeHash({ owner, repo, workflow_id, GITHUB_TOKEN }: {
    owner: string;
    repo: string;
    workflow_id: string;
    GITHUB_TOKEN: string;
}): Promise<string>;
export declare function computeResultRequestFromHash(request: RequestWithParams, env: EnvWithBindings, ctx: TctxWithSentry): Promise<Response>;
export declare function computeResultRequest(request: RequestWithParams, env: EnvWithBindings, ctx: TctxWithSentry): Promise<Response>;
