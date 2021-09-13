import { EnvWithBindings } from './index';


export function computeGithubRequest(
    { repo, owner, workflow_id }: { repo: string; owner: string; workflow_id?: string; },
    env: EnvWithBindings
): Request {
    const cf: RequestInitCfProperties = {
        // cacheTtl: 43200,
        cacheTtlByStatus: { '200-299': 300, '400-499': 1, '500-599': 0 },
    }, cfInit = {
        cf,
        headers: {
            "User-Agent": "Cloudflare Workers",
            Accept: "application/vnd.github.v3+json",
            Authorization: `token ${env.GITHUB_TOKEN}`
        }
    }, ghRequest = new Request(`https://api.github.com/repos/${owner}/${repo}/actions/workflows${workflow_id ? ('/' + workflow_id + '/runs') : ''}`, cfInit);
    ghRequest.headers.set('cache-control', 'public');
    ghRequest.headers.append('cache-control', `max-age=300`);
    console.log({ ghRequestUrl: ghRequest.url.toString(), cfInit });
    return ghRequest;
}
