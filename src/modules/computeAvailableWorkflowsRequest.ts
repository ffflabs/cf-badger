import type { IWorkflowList } from './handler';
import { json } from 'itty-router-extras';
import type { RequestWithParams, EnvWithBindings, TctxWithSentry } from '../index';
import { computeGithubRequest } from "./computeGithubRequest";
export const computeAvailableWorkflowsRequest = async (request: RequestWithParams, env: EnvWithBindings, ctx: TctxWithSentry): Promise<Response> => {
    let { url, params: { owner, repo } } = request, ghRequest = computeGithubRequest({ owner, repo }, env);

    ctx.sentry.addBreadcrumb({ data: { url, ghRequest } });

    const res = await ghRequest.fetch({ method: 'GET' });

    const { workflows } = (await res.json()) as IWorkflowList, workflow_runs_urls = workflows.map(workflow => {
        let { id, name, path } = workflow, fileName = path.split('/').pop();
        return { id, id_url: `${url}/${id}`, name, filename_url: `https://github.com/${owner}/${repo}/actions/workflows/${fileName}` };
    });
    return json(workflow_runs_urls);
};
