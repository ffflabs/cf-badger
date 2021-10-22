export declare type TWorkflowParams = {
    repo: string;
    owner: string;
    workflow_id?: number;
    branch?: string;
    filename_url?: string;
    name?: string;
};
/**
 * Computes a request to Github's REST api.
 *
 * Instances behave like a Request of which only a subset of properties
 * can be modified:
 * - headers (delegates to internal Request property)
 * - searchParams (delegates to internal URL property)
 * - method (it's passed as parameter to `fetch`)
 *
 * Aforementioned `fetch` method fires a request computed from the internal URL,
 * internal Request, and all modifications to headers and searchParams made in between.
 *
 * The computed request, is configured with:
 *  - Github Api URL computed from owner and repo (mandatory) plus workflow_id and branch (optional)
 *  - cf object setting cache of 300 seconds for successful responses
 *  - "Cloudflare Workers" user agent
 *  - "Accept" header set to application/vnd.github.v3+json
 *  - Unless a branch is specified, sets the result limit to 100 elements
 *
 *
 */
export declare class GithubRequest {
    url: URL;
    init: RequestInit;
    request: Request;
    params: TWorkflowParams;
    token: string;
    constructor(workflowParams: TWorkflowParams, GITHUB_TOKEN: string);
    get headers(): {
        set: (name: string, value: string) => GithubRequest['headers'];
        append: (name: string, value: string) => GithubRequest['headers'];
        get: (name: string) => string | null;
    };
    get searchParams(): URLSearchParams;
    fetch({ method }: {
        method: string;
    }): Promise<Response>;
    private computeFinalRequest;
    private computeErroredResponse;
}
