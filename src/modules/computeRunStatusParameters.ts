

import type { TRequestWithParams, EnvWithDurableObject } from 'itty-router-extras';


export async function computeRunStatusParameters(request: TRequestWithParams, env: EnvWithDurableObject): Promise<{ hashHex: string; owner: string; repo: string; workflow_id: string; requestURL: URL; GITHUB_TOKEN: string; }> {
    let { url: originalUrl, params } = request, { owner, repo, workflow_id, } = params, requestURL = new URL(originalUrl), GITHUB_TOKEN = requestURL.searchParams.get('token') || env.GITHUB_TOKEN;
    const hashHex = await computeHash({ owner, repo, workflow_id, GITHUB_TOKEN }); // convert bytes to hex string
    return { owner, repo, workflow_id, GITHUB_TOKEN, requestURL, hashHex };

}
export async function computeHash({ owner, repo, workflow_id, GITHUB_TOKEN }: { owner: string; repo: string; workflow_id: string; GITHUB_TOKEN: string; }): Promise<string> {
    const linkParams = new TextEncoder().encode(JSON.stringify({ owner, repo, workflow_id, GITHUB_TOKEN }));

    const hashBuffer = await crypto.subtle.digest(
        {
            name: "SHA-1",
        },
        linkParams
    );
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substr(0, 20); // convert bytes to hex string
    return hashHex;
}
