import type { EnvWithDurableObject } from 'itty-router-extras';
import type { TRunResults } from './computeColorAndMessage';
import type { computeColorAndMessage } from './computeColorAndMessage';
import type { IInstallWebhook } from './webhook_schemes';
export declare type TInstallations = {
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
export declare type TOwnerRepo = {
    owner: string;
    repo: string;
};
export declare type TOwnerOrInstallationId = {
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
export declare function mapWorkflow({ owner, repo, workflow }: {
    owner: string;
    repo: string;
    workflow: TWorkflow;
}, WORKER_URL: string): TWorkflow;
export interface IRepoWorkflows {
    total_count: number;
    workflows: TWorkflow[];
}
declare type ErrorResponse = {
    response: {
        status: number;
        url: string;
        data: {
            [s: string]: unknown;
        };
    };
};
export declare function isErrorResponse(err: unknown, status?: number): err is ErrorResponse;
export {};
