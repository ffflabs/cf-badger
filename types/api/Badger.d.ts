/// <reference types="@cloudflare/workers-types" />
import { GithubIntegrationDurable } from './GithubIntegrationDurable';
import type { TInstallationInfo } from './GithubIntegrationDurable';
import type { TRunResults } from './modules/computeColorAndMessage';
import type { Octokit } from '@octokit/rest';
import { TOwnerOrInstallationId, TInstallationRepos, TOwnerRepo, TWorkflow, TOutputResults, TInstallations } from './modules/TInstallations';
export declare const str2ab: (str: string) => ArrayBuffer;
export declare class Badger extends GithubIntegrationDurable implements DurableObject {
    [s: string]: unknown;
    getInstallation({ owner, installationId }: TOwnerOrInstallationId): Promise<TInstallationInfo>;
    getInstallationId({ owner, installationId }: TOwnerOrInstallationId): Promise<number>;
    getRepositories({ owner, installationId, code }: TOwnerOrInstallationId & {
        code?: string;
    }): Promise<TInstallationRepos>;
    getReposForUser({ code, owner }: {
        code: string;
        owner: string;
    }): Promise<TInstallationRepos>;
    getRepoWorkflows({ owner, repo, code }?: TOwnerRepo & {
        code?: string;
    }): Promise<{
        workflows: TWorkflow[];
    }>;
    protected listWorkflowRuns({ octokit, owner, repo, workflow_id, branch }: {
        octokit: Octokit;
        owner: string;
        repo: string;
        workflow_id: number;
        branch?: string;
    }): Promise<{
        workflow_runs: TRunResults[];
        total_count: number;
    }>;
    getWorkflowResults({ owner, repo, workflow_id, code, branch }: TOwnerRepo & {
        branch?: string;
        code?: string;
        workflow_id: number;
    }): Promise<TOutputResults>;
    /**
     * This operation retrieves at most 100 run results for a given workflow.
     * Given the potential size of the response we store it on a KVNamespace instead
     * of bloating the Durable Object's storage
     * @param param0
     * @returns
     */
    computeResultRequest({ owner, repo, workflow_id, branch }: {
        owner: string;
        repo: string;
        workflow_id: number;
        branch?: string;
    }): Promise<Response>;
    computeResultRequestFromHash({ hashHex, branch }: {
        hashHex: string;
        branch?: string;
    }): Promise<Response>;
    redirectToWorkFlow({ hashHex }: {
        hashHex: string;
    }): Promise<Response>;
    user({ code, installationId }: {
        code: string;
        installationId?: number;
    }): Promise<Response>;
    /**
     *
     * @param owner
     * @returns
     */
    private getOwnerInstall;
    /**
     *
     * @param owner
     * @returns
     */
    private getInstallById;
    listInstallations({ raw }: {
        raw: boolean;
    }): Promise<TInstallations>;
}
