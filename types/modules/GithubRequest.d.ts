export declare type TWorkflowParams = {
    repo: string;
    owner: string;
    workflow_id?: string;
    branch?: string;
};
export declare class GithubRequest {
    url: URL;
    init: RequestInit;
    request: Request;
    params: TWorkflowParams;
    constructor(workflowParams: TWorkflowParams, { GITHUB_TOKEN }: {
        GITHUB_TOKEN: string;
    });
    get searchParams(): URLSearchParams;
    get headers(): Headers;
    fetch({ method }: {
        method: string;
    }): Promise<Response>;
    computeErroredResponse(res: Response): Error;
}
