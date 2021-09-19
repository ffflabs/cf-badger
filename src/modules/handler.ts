
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
  workflow_runs: WorkflowRun[];
}
type ShieldsAttributes = { color: string; message: string, isError?: boolean }

export type WorkflowRunPart = Pick<WorkflowRun, 'id' | 'url' | 'name' | 'head_branch' | 'status' | 'conclusion' | 'workflow_id'>



export const Errors = {

  server_error: (): ShieldsAttributes => ({
    color: "inactive",
    message: "server error",
    isError: true
  })

  , no_runs: (): ShieldsAttributes => ({
    color: "inactive",
    message: "no runs",
    isError: true
  })

  , repository_not_found: (): ShieldsAttributes => ({
    color: "critical",
    message: "repository not found",
    isError: true
  })
}

export function computeColorAndMessage(runs: WorkflowRunPart[], workflow_id: number, branch?: string | null | undefined): ShieldsAttributes {
  const wfRun = runs.find(run => run.workflow_id === workflow_id && (!branch || run.head_branch === branch))

  const payload = (label: string) => ({
    "schemaVersion": 1,
    label,
    "namedLogo": "github",
    "cacheSeconds": 300
  })
  if (!wfRun) {
    return { ...payload('Unknown workflow'), ...Errors.no_runs() }
  }

  if (wfRun.status === 'completed') {
    return { ...payload(wfRun.name), ...Conclusion[wfRun.conclusion]() }
  }
  return { ...payload(wfRun.name), ...Status[wfRun.status]() }
}