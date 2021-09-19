export declare type TWorkflowParams = {
    repo: string;
    owner: string;
    workflow_id?: string;
    branch?: string;
};
export declare class ModifiableRequest {
    url: URL;
    init: RequestInit;
    request: Request;
    params: TWorkflowParams;
    constructor(url: URL, init: RequestInit, params: TWorkflowParams);
    get searchParams(): URLSearchParams;
    get headers(): Headers;
    fetch({ method }: {
        method: string;
    }): Promise<Response>;
}
export declare function computeGithubRequest(workflowParams: TWorkflowParams, { GITHUB_TOKEN }: {
    GITHUB_TOKEN: string;
}): ModifiableRequest;
