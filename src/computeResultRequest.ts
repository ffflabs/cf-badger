import { WorkflowRunPart, IWorkflowRuns, WorkflowRun } from './handler';
import { computeColorAndMessage } from './handler';
import { json } from 'itty-router-extras';
import { RequestWithParams, EnvWithBindings, TctxWithSentry, computeErroredResponse } from './index';
import { computeGithubRequest } from "./computeGithubRequest";

/*type TColors = keyof typeof possibleColors
const PossibleColorsRoute = `(${Object.keys(possibleColors).join('|')})`

function populateStatus() {

  return (req: RequestWithParams): void => {
    let { url } = req,
      parsedUrl = new URL(url.toString()),
      pathname = parsedUrl.pathname;

    let etfRegex = new RegExp(PossibleColorsRoute, 'ig');
    let routeParts = etfRegex.exec(pathname);

    if (routeParts && routeParts[1]) {
      req.color = routeParts[1] as TColors
    }

  };
}*/
export async function computeResultRequest(
    request: RequestWithParams,
    env: EnvWithBindings,
    ctx: TctxWithSentry): Promise<Response> {
    let { url: originalUrl, params } = request, { owner, repo, workflow_id: wf_id } = params, requestURL = new URL(originalUrl), branch = request.params.branch ? decodeURIComponent(request.params.branch) : requestURL.searchParams.get('branch'), ghRequest = computeGithubRequest({ owner, repo, workflow_id: wf_id }, env);

    ctx.sentry.addBreadcrumb({ data: { originalUrl, ghRequest } });
    const res = await fetch(ghRequest);
    if (!res.ok) {
        throw computeErroredResponse({ owner, repo }, res);
    }
    const { workflow_runs } = (await res.json()) as IWorkflowRuns, runs = Object.values(workflow_runs.reduce((accum, run) => {
        let { id, name, head_branch, status, conclusion, workflow_id } = run;

        accum[head_branch] = accum[head_branch] || {
            id,
            url: `https://github.com/${owner}/${repo}/actions/runs/${id}`,
            name,
            head_branch,
            status,
            conclusion,
            workflow_id
        };
        return accum;
    }, {} as { [s: string]: WorkflowRunPart; }));
    if (branch) {
        return json({ ...computeColorAndMessage(runs as WorkflowRun[], Number(wf_id), branch) });
    }
    return json(runs);
    //return json({ msg: computeColorAndMessage(runs as WorkflowRun[], Number(wf_id), branch), runs })
}
