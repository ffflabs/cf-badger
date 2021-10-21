/// <reference types="@cloudflare/workers-types" />
import { EnvWithDurableObject } from 'itty-router-extras';
import { GithubIntegrationDurable } from './GithubIntegrationDurable';
import type { TInstallationInfo } from './GithubIntegrationDurable';
import type { TRunResults } from './modules/computeColorAndMessage';
import { computeColorAndMessage } from './modules/computeColorAndMessage';
import type { IInstallWebhook } from './modules/webhook_schemes';
import type { Octokit } from '@octokit/rest';
export declare const str2ab: (str: string) => ArrayBuffer;
declare type TInstallations = {
    expiration: number;
    installations: {
        id: number;
        target_type: string;
        login: string | undefined;
    }[];
};
export interface IRequestParams {
    env: EnvWithDurableObject;
    owner: string;
    repo: string;
    workflow_id: number;
    requestURL: URL;
    hashHex: string;
    branch?: string;
    verb?: string;
    endpoint?: string;
    payload: IInstallWebhook;
    code?: string;
}
export declare type TOutputResults = ReturnType<typeof computeColorAndMessage> | {
    branches: TRunResults[];
    hashHex: string;
    count: number;
};
export declare type TInstallationRepos = {
    installationId: number | null;
    login: string;
    target_id?: number;
    expiration?: number;
    repositories: {
        id: number;
        name: string;
        full_name: string;
        private: boolean;
    }[];
};
export interface Permissions {
    actions: string;
    metadata: string;
}
declare type TOwnerRepo = {
    owner: string;
    repo: string;
};
declare type TOwnerOrInstallationId = {
    owner: string;
    installationId?: number;
} | {
    owner?: string;
    installationId: number;
};
export interface TWorkflow {
    id: number;
    node_id?: string;
    name: string;
    path?: string;
    state: string;
    created_at?: string;
    updated_at?: string;
    url?: string;
    html_url?: string;
    badge_url?: string;
    id_url?: string;
    filename_url?: string;
    runs?: string;
}
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
export {};
