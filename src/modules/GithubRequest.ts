
export type TWorkflowParams = {
    repo: string;
    owner: string;
    workflow_id?: string;
    branch?: string;
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
export class GithubRequest {
    url: URL;
    init: RequestInit
    request: Request
    params: TWorkflowParams
    token: string
    constructor(
        workflowParams: TWorkflowParams,
        GITHUB_TOKEN: string
    ) {
        if (!GITHUB_TOKEN) {
            throw new Error(`No GITHUB_TOKEN passed in constructor`)
        }
        this.token = GITHUB_TOKEN;
        const { repo, owner, workflow_id, branch } = workflowParams,
            cf: RequestInitCfProperties = {
                // cacheTtl: 43200,
                cacheTtlByStatus: { '200-299': 300, '400-499': 1, '500-599': 0 },
            }, cfInit = {
                cf

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

        this.headers.set('cache-control', 'public')
            .append('cache-control', `max-age=300`);




    }
    get headers(): {
        set: (name: string, value: string) => GithubRequest['headers'],
        append: (name: string, value: string) => GithubRequest['headers'],
        get: (name: string) => string | null
    } {
        return {


            set: (name: string, value: string) => {
                this.request.headers.set(name, value)
                return this.headers
            },
            append: (name: string, value: string) => {
                this.request.headers.append(name, value)
                return this.headers
            },
            get: (name: string) => {
                return this.request.headers.get(name)
            }
        }
    }

    get searchParams(): URLSearchParams {
        return this.url.searchParams
    }

    async fetch({ method = 'GET' }: { method: string }): Promise<Response> {
        let request = this.computeFinalRequest({ method })
        const res = await fetch(request)
        if (!res.ok) {
            console.warn(request);
            throw this.computeErroredResponse(res);
        }
        return res
    }
    private computeFinalRequest({ method }: { method: string }): Request {
        const request = new Request(this.url.toString(), { ...this.init, method })
        this.headers.set("User-Agent", "Cloudflare Workers")
            .set("Accept", "application/vnd.github.v3+json")
            .set("Authorization", `token ${this.token}`)
        for (let [key, value] of this.request.headers.entries()) {
            request.headers.set(key, value)
        }



        return request
    }
    private computeErroredResponse(res: Response): Error {
        const err = new Error(`Request to ${this.params.owner}/${this.params.repo} failed with status: ${res.status} ${res.statusText}`) as Error & { status: number }
        err.status = res.status;
        return err
    }
}