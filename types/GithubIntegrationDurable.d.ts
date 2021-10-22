/// <reference types="@cloudflare/workers-types" />
import type { AuthInterface, RequestInterface } from '@octokit/auth-app/dist-types/types';
import { Octokit } from "@octokit/rest";
import { IttyDurable } from 'itty-durable';
import { EnvWithDurableObject } from 'itty-router-extras';
import Toucan from 'toucan-js';
import type { computeColorAndMessage } from './modules/computeColorAndMessage';
import type { IInstallWebhook, Repository } from './modules/webhook_schemes';
export declare function computeLoginHash({ login, id, token }: {
    login: string;
    id: number;
    token: string;
}): Promise<string>;
export declare function computeResultHash({ owner, repo, workflow_id }: {
    owner: string;
    workflow_id: number;
    repo: string;
}): Promise<string>;
declare type ErrorObject = {
    name: string;
    message: string;
    url?: string;
    stack: string[];
};
export interface IRequestParams {
    env: EnvWithDurableObject;
    owner: string;
    repo: string;
    workflow_id: string;
    raw: boolean;
    prefix: string;
    requestURL: URL;
    installationId?: number;
    hashHex: string;
    branch?: string;
    verb?: string;
    endpoint?: string;
    payload: IInstallWebhook;
    code?: string;
}
declare type TRunResults = {
    id: number;
    name: string;
    head_branch: string;
    status: "queued" | "in_progress" | "completed";
    conclusion: "success" | "neutral" | "failure" | "cancelled" | "timed_out" | "action_required";
    workflow_id: number;
};
export declare type TOutputResults = ReturnType<typeof computeColorAndMessage> | {
    branches: TRunResults[];
    hashHex: string;
    count: number;
};
declare type TViewerRepos = {
    login: string;
    repositories: {
        edges: RepoEdge[];
    } | TRepoSlug[];
    repo_count: number;
    [s: string]: unknown;
};
declare type TMinimalInstallationInfo = {
    login: string;
    target_type?: string;
    installationId: number;
    target_id: number;
    repos: string;
    enabledFor: string;
};
export interface TInstallationInfo {
    id: number;
    installationId: number;
    target_type: string;
    login: string;
    target_id?: number | null;
    repository_selection: string;
    access_tokens_url?: string;
    repositories_url?: string;
    html_url?: string;
    app_id?: number;
    app_slug?: string;
    permissions: Permissions;
    events: string[];
    created_at?: string;
    updated_at?: string;
    single_file_name?: null;
    has_multiple_single_files?: boolean;
    single_file_paths?: any[];
    suspended_by?: null;
    suspended_at: null;
    [s: string]: unknown;
}
export declare type TInstallationItem = Omit<TInstallationInfo, 'installationId'> & {
    id: number;
    target_type: string;
    account: {
        [s: string]: string | number | boolean | null | undefined;
        id?: number;
        login?: string;
    } | null;
};
export declare function dataItemToInstallationInfo(data: TInstallationItem, WORKER_URL: string): TInstallationInfo;
declare type TRepoSlug = {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    workflows: string;
};
export interface RepoEdge {
    node: RepoNode;
}
export interface RepoNode {
    nameWithOwner: string;
    id: string;
    name: string;
    isPrivate: boolean;
    databaseId: number;
}
export declare function mapRepos(repositories: Repository[], WORKER_URL: string): TRepoSlug[];
export declare type OctokitUserInstance = Octokit & {
    token: string;
    code: string;
    login: string;
    userId: number;
};
interface IInstanceEntities {
    publicCriptoKey: CryptoKey;
    privateCriptoKey: CryptoKey;
    octokit: {
        app: Octokit;
    };
    userOctokit: {
        [s: string]: OctokitUserInstance;
    };
}
export declare abstract class GithubIntegrationDurable extends IttyDurable {
    Sentry: Toucan;
    state: DurableObjectState & EnvWithDurableObject & IInstanceEntities;
    [s: string]: unknown;
    debug: (...args: unknown[]) => void;
    constructor(state: DurableObjectState, env: EnvWithDurableObject);
    protected getOrCreateKeyPair(): Promise<{
        privateKey: ArrayBuffer;
        publicKey: ArrayBuffer;
    }>;
    protected getPublicCryptoKey(): Promise<CryptoKey>;
    protected getPrivateCryptoKey(algorithm: {
        name: string;
        hash: {
            name: string;
        };
    }, force?: boolean): Promise<CryptoKey>;
    protected processError(err: Error & {
        status?: unknown;
        url?: string;
    }, extra: {
        [s: string]: string | number;
    }): ErrorObject & {
        eventId?: string;
    };
    protected errorToResponse(err: ErrorObject & {
        status: number;
        eventId?: string;
    }): Response;
    protected computeErroredResponse({ owner, repo }: {
        owner: string;
        repo: string;
    }, res: Response): Error;
    webhook({ id, name, payload }: {
        id: string;
        name: string;
        payload: IInstallWebhook;
    }): Promise<{
        ok: boolean;
    }>;
    get_keys({ prefix }: {
        prefix: string;
    }): Promise<{
        [s: string]: unknown;
    }>;
    protected actingAsInstallation(installationId: number): RequestInterface;
    getInstallationsForUser(userOctokit: OctokitUserInstance, installationId?: number): Promise<TMinimalInstallationInfo[]>;
    protected actingAsOauthUser({ code, installationId }: {
        code: string;
        installationId?: number;
    }): Promise<Response>;
    protected actingAsUser(code: string): Promise<Octokit & {
        token: string;
        code: string;
        login: string;
        userId: number;
    }>;
    protected getPublicRepos(userOctokit: Octokit, login: string): Promise<TViewerRepos & {
        installationId: number | null;
    }>;
    protected createAppAuth(installationId?: number, type?: string): AuthInterface;
    /**
 * Even if {IttyDurable} does already take care of handling the fetch method by default, we need to
 * inject our Sentry client here, so we override it.
 *
 * @param {Request} request
 * @returns {Response}
 */
    fetch(req: Request): Promise<Response>;
    getSentryInstance(req?: Request): Toucan;
    protected getOctokit(): Octokit;
    protected getOctokitForInstallation(installationId: number): Promise<Octokit>;
    protected getStoredWithTtl<T extends Record<string, unknown>>(key: string): Promise<T & {
        ttl: number;
    }>;
    protected storeWithExpiration<T>(key: string, result: T, ttl?: number): T & {
        expiration: number;
        ttl: number;
    };
    static secondsRemaining(expiration?: number): number;
    protected getAuthParams(): {
        appId: number;
        privateKey: string;
        clientId: string;
        clientSecret: string;
        installationId?: number;
        type?: string;
    };
}
export {};
