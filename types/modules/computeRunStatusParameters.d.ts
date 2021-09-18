import type { RequestWithParams, EnvWithBindings } from '../index';
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
