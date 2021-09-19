export interface IWorkflowList {
    total_count: number;
    workflows: Workflow[];
}
export interface Workflow {
    id: number;
    node_id: string;
    name: string;
    path: string;
    state: string;
    created_at: string;
    updated_at: string;
    url: string;
    html_url: string;
    badge_url: string;
}
export interface WorkflowRun {
    id: number;
    name: string;
    node_id: string;
    head_branch: string;
    run_number: number;
    status: string & keyof typeof Status;
    conclusion: string & keyof typeof Conclusion;
    workflow_id: number;
    check_suite_id: number;
    check_suite_node_id: string;
    url: string;
    html_url: string;
    jobs_url: string;
    logs_url: string;
    check_suite_url: string;
    artifacts_url: string;
    cancel_url: string;
    rerun_url: string;
    workflow_url: string;
}
export declare const Conclusion: {
    success: () => ShieldsAttributes;
    neutral: () => ShieldsAttributes;
    failure: () => ShieldsAttributes;
    cancelled: () => ShieldsAttributes;
    timed_out: () => ShieldsAttributes;
    action_required: () => ShieldsAttributes;
};
export declare const Status: {
    queued: () => ShieldsAttributes;
    in_progress: () => ShieldsAttributes;
    completed: () => string;
};
export interface IWorkflowRuns {
    total_count: number;
    workflow_runs: WorkflowRun[];
}
declare type ShieldsAttributes = {
    color: string;
    message: string;
    isError?: boolean;
};
export declare type WorkflowRunPart = Pick<WorkflowRun, 'id' | 'url' | 'name' | 'head_branch' | 'status' | 'conclusion' | 'workflow_id'>;
export declare const Errors: {
    server_error: () => ShieldsAttributes;
    no_runs: () => ShieldsAttributes;
    repository_not_found: () => ShieldsAttributes;
};
export declare function computeColorAndMessage(runs: WorkflowRunPart[], workflow_id: number, branch?: string | null | undefined): ShieldsAttributes;
export {};
