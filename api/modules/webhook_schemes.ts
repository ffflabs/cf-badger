
export interface IInstallWebhook {
    action: string;
    installation: Installation;
    repositories_removed: Repository[];
    repositories_added: Repository[];
    sender: Sender;
}

export interface Installation {
    id: number;
    account: Sender;
    repository_selection: string;
    access_tokens_url: string;
    repositories_url: string;
    html_url: string;
    app_id: number;
    target_id: number;
    target_type: string;
    permissions: Permissions;
    events: string[];
    created_at: number;
    updated_at: number;
    single_file_name: string;
}

export interface Sender {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
}

export interface Permissions {
    metadata: string;
    contents: string;
    issues: string;
}

export interface Repository {
    id: number;
    node_id: string;
    name: string;
    full_name: string;
    private: boolean;
}
