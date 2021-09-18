import type { IWorkflowRuns, WorkflowRun } from './handler';
import { computeColorAndMessage } from './handler';
import { json } from 'itty-router-extras';
import type { RequestWithParams, EnvWithBindings, TctxWithSentry } from '../index';
import { computeErroredResponse } from '../index'
import { computeGithubRequest } from "./computeGithubRequest";



export async function computeResultRequestFromHash(
    request: RequestWithParams,
    env: EnvWithBindings,
    ctx: TctxWithSentry
): Promise<Response> {

    const requestURL = new URL(request.url), { owner, repo, workflow_id, GITHUB_TOKEN } = (await env.BADGER_KV.get(`hash:${request.params.hash}`, 'json') || {}) as { owner: string; repo: string; workflow_id: string; GITHUB_TOKEN: string; }, branch = requestURL.searchParams.get('branch') || 'master';
    console.log('BADGER_KV', { owner, repo, workflow_id, GITHUB_TOKEN });
    const ghRequest = computeGithubRequest({ owner, repo, workflow_id, branch }, { GITHUB_TOKEN });

    ctx.sentry.addBreadcrumb({ data: { requestURL, ghRequest } });
    const res = await ghRequest.fetch({ method: 'GET' });
    if (!res.ok) {
        throw computeErroredResponse({ owner, repo }, res);
    }

    const { workflow_runs } = (await res.json()) as IWorkflowRuns, runs = workflow_runs.map((run) => {
        let { id, name, head_branch, status, conclusion, workflow_id: wf_id } = run;
        return { id, name, head_branch, status, conclusion, workflow_id: wf_id };
    });


    return json({ ...computeColorAndMessage(runs as WorkflowRun[], Number(workflow_id), branch) }, {
        headers: {
            "cache-control": "max-age=300, s-maxage=300"
        }
    });

}
