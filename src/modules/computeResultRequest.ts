import type { WorkflowRunPart, IWorkflowRuns, WorkflowRun } from './handler';
import { computeColorAndMessage } from './handler';
import { json } from 'itty-router-extras';
import { RequestWithParams, EnvWithBindings, TctxWithSentry, computeErroredResponse } from '../index';
import { computeGithubRequest } from "./computeGithubRequest";
import { computeRunStatusParameters } from './computeRunStatusParameters';


export async function computeResultRequest(
    request: RequestWithParams,
    env: EnvWithBindings,
    ctx: TctxWithSentry
): Promise<Response> {
    let { owner, repo, workflow_id, requestURL, GITHUB_TOKEN, hashHex } = await computeRunStatusParameters(request, env),

        branch = (request.params.branch ? decodeURIComponent(request.params.branch) : requestURL.searchParams.get('branch')) || undefined,
        all_workflows = requestURL.searchParams.has('all')
    const storedPromise = env.BADGER_KV.put(`hash:${hashHex}`, JSON.stringify({ owner, repo, workflow_id, GITHUB_TOKEN }))

    const ghRequest = computeGithubRequest({ owner, repo, workflow_id, branch }, { GITHUB_TOKEN }) //+ (branch ? `?branch=${branch}` : '');
    //console.log(ghRequest)
    ctx.sentry.addBreadcrumb({ data: { requestURL, ghRequest: ghRequest.url } });
    const res = await ghRequest.fetch({ method: 'GET' })
    if (!res.ok) {
        throw computeErroredResponse({ owner, repo }, res);
    }

    let { workflow_runs } = (await res.json()) as IWorkflowRuns,
        runs = workflow_runs.map(run => {
            let { id, name, head_branch, status, conclusion, workflow_id: wf_id } = run;
            return { id, name, head_branch, status, conclusion, workflow_id: wf_id }
        });
    if (!all_workflows) {
        runs = Object.values(runs.reduce((accum, run) => {
            let { head_branch } = run
            accum[head_branch] = accum[head_branch] || run;
            return accum;
        }, {} as { [s: string]: WorkflowRunPart; }));
    }

    if (branch) {
        console.warn('Requesting computeResultRequest branch ' + branch)
        return json({ ...computeColorAndMessage(runs as WorkflowRun[], Number(workflow_id), branch) }, {
            headers: {
                "cache-control": "max-age=300, s-maxage=300"
            }
        });

    }
    return storedPromise.then(() => json({ branches: runs, hashHex, count: workflow_runs.length }, {
        headers: {
            "cache-control": "max-age=300, s-maxage=300"
        }
    }));
    //return json({ msg: computeColorAndMessage(runs as WorkflowRun[], Number(wf_id), branch), runs })
}
