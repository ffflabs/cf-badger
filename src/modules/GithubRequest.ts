
export type TWorkflowParams = {
    repo: string;
    owner: string;
    workflow_id?: string;
    branch?: string;
};




export class GithubRequest {
    url: URL;
    init: RequestInit
    request: Request
    params: TWorkflowParams
    constructor(
        workflowParams: TWorkflowParams,
        { GITHUB_TOKEN }: { GITHUB_TOKEN: string }
    ) {
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
        this.url = ghUrl
        this.init = cfInit
        this.request = new Request(this.url.toString(), this.init)
        this.params = workflowParams

        this.request.headers.set('cache-control', 'public');
        this.request.headers.append('cache-control', `max-age=300`);

    }
    get searchParams(): URLSearchParams {
        return this.url.searchParams
    }
    get headers(): Headers {
        return this.request.headers
    }
    async fetch({ method = 'GET' }: { method: string }): Promise<Response> {
        const request = new Request(this.url.toString(), { ...this.init, method })
        for (let [key, value] of this.request.headers.entries()) {
            request.headers.set(key, value)
        }
        const res = await fetch(request)
        if (!res.ok) {
            console.warn(request);
            throw this.computeErroredResponse(res);
        }
        return res
    }
    computeErroredResponse(res: Response): Error {
        const err = new Error(`Request to ${this.params.owner}/${this.params.owner} failed with status: ${res.status} ${res.statusText}`) as Error & { status: number }
        err.status = res.status;
        return err
    }
}