import { computeErroredResponse } from "../index";
export type TWorkflowParams = {
    repo: string;
    owner: string;
    workflow_id?: string;
    branch?: string;
};
class ModifiableRequest {
    url: URL;
    init: RequestInit
    request: Request
    params: TWorkflowParams
    constructor(url: URL, init: RequestInit, params: TWorkflowParams) {
        this.url = url;
        this.init = init
        this.request = new Request(this.url.toString(), this.init)
        this.params = params
    }
    get searchParams() {
        return this.url.searchParams
    }
    get headers() {
        return this.request.headers
    }
    async fetch({ method = 'GET' }): Promise<Response> {
        const request = new Request(this.url.toString(), { ...this.init, method })
        for (let [key, value] of this.request.headers.entries()) {
            request.headers.set(key, value)
        }
        const res = await fetch(request)
        if (!res.ok) {
            console.warn(request);
            throw computeErroredResponse({ owner: this.params.owner, repo: this.params.repo }, res);
        }
        return res
    }
}



export function computeGithubRequest(
    workflowParams: TWorkflowParams,
    { GITHUB_TOKEN }: { GITHUB_TOKEN: string }
): ModifiableRequest {
    const { repo, owner, workflow_id, branch } = workflowParams,
        cf: RequestInitCfProperties = {
            // cacheTtl: 43200,
            cacheTtlByStatus: { '200-299': 300, '400-499': 1, '500-599': 0 },
        }, cfInit = {
            cf,
            headers: {
                "User-Agent": "Cloudflare Workers",
                Accept: "application/vnd.github.v3+json",
                Authorization: `token ${GITHUB_TOKEN}`
            }
        },
        ghUrl = new URL(`https://api.github.com/repos/${owner}/${repo}/actions/workflows${workflow_id ? ('/' + workflow_id + '/runs') : ''}`)



    if (branch) {
        ghUrl.searchParams.set('branch', branch)
    } else {
        ghUrl.searchParams.set('per_page', "100")
    }
    const ghRequest = new ModifiableRequest(ghUrl, cfInit, workflowParams)
    ghRequest.headers.set('cache-control', 'public');
    ghRequest.headers.append('cache-control', `max-age=300`);
    //console.log(ghRequest.url.toString());
    return ghRequest
}
