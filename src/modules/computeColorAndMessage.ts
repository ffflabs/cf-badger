
export interface IWorkflowList {
  total_count: number;
  workflows: IWorkflow[];
}

export interface IWorkflow {
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

export interface IWorkflowRun {
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
// #CB2431

export const Conclusion = {
  success: (): ShieldsAttributes => ({
    color: "success",
    message: "success",
  })

  , neutral: (): ShieldsAttributes => ({
    color: "success",
    message: "neutral",
  })

  , failure: (): ShieldsAttributes => ({
    color: "critical",
    message: "failing",
  })

  , cancelled: (): ShieldsAttributes => ({
    color: "inactive",
    message: "cancelled",
  })
  , timed_out: (): ShieldsAttributes => ({
    color: "critical",
    message: "timed out",
    isError: true
  })

  , action_required: (): ShieldsAttributes => ({
    color: "critical",
    message: "action required",
    isError: true
  })

}
export const Status = {
  queued: (): ShieldsAttributes => ({
    color: "yellow",
    message: "pending",
  }),
  in_progress: (): ShieldsAttributes => ({
    color: "yellow",
    message: "pending",
  }),
  completed: (): string => 'completed'
}
export interface IWorkflowRuns {
  total_count: number;
  workflow_runs: IWorkflowRun[];
}
export type ShieldsAttributes = { color: string; message: string, isError?: boolean }

export type WorkflowRunPart = Pick<IWorkflowRun, 'id' | 'url' | 'name' | 'head_branch' | 'status' | 'conclusion' | 'workflow_id'>



export const OutcomeErrors = {

  server_error: (): ShieldsAttributes => ({
    color: "inactive",
    message: "server error",
    isError: true
  })

  , no_runs: (branch?: string): ShieldsAttributes => ({
    color: "inactive",
    message: "no runs" + (branch ? ` on branch ${branch}` : ``),
    isError: true
  })

  , repository_not_found: (): ShieldsAttributes => ({
    color: "critical",
    message: "repository not found",
    isError: true
  })
}
export const schemaPayload = (label: string): { schemaVersion: number; label: string; namedLogo: string; cacheSeconds: number } => ({
  "schemaVersion": 1,
  label,
  "namedLogo": "github",
  "cacheSeconds": 300
})
export function computeColorAndMessage(runs: WorkflowRunPart[], workflow_id: number, branch?: string | null | undefined): ShieldsAttributes {
  const wfRun = runs.length === 1 ? runs[0] : runs.find(run => run.workflow_id === workflow_id && (!branch || run.head_branch === branch))


  if (!wfRun) {
    return { ...schemaPayload('Unknown workflow'), ...OutcomeErrors.no_runs() }
  }

  if (wfRun.status === 'completed') {
    return { ...schemaPayload(wfRun.name), ...Conclusion[wfRun.conclusion]() }
  }
  return { ...schemaPayload(wfRun.name), ...Status[wfRun.status]() }
}