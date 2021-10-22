
import { ConsoleLog, Miniflare } from "miniflare";
import { Request } from '@mrbbot/node-fetch'
import test from "ava";
import type * as ava from 'ava'
import type { TWorkflow } from "../api/modules/TInstallations";
import type { TRunResults } from '../api/modules/computeColorAndMessage';
const owner = "huasofoundries",
  repo = "jpgraph",
  wflow_id = 8501839

test.beforeEach((t) => {
  // Create a new Miniflare environment for each test
  const mf = new Miniflare({
    scriptPath: "./dist/index.mjs",
    // Some options omitted, see api/options/index.ts for the full list
    sourceMap: true,
    log: new ConsoleLog(), // Defaults to no-op logger
    wranglerConfigPath: "./wrangler.toml",
    watch: true,
    kvNamespaces: ["BADGER_KV"],
    upstream: 'https://cf-worker.com',
    cachePersist: false,

    port: 8989,
    wranglerConfigEnv: 'dev',
    //host: 'http://127.0.0.1',


    durableObjects: { Badger: { className: 'Badger' } },

    durableObjectsPersist: true,

    modules: true,
    modulesRules: [
      { type: "ESModule", include: ["**/*.mjs"], fallthrough: true }]
  });

  t.context = { mf };
});


test("lists available workflows with code ",

  async (t: ava.ExecutionContext<unknown>) => {
    // Get the Miniflare instance

    const { mf }: { mf: Miniflare } = t.context as { mf: Miniflare },
      availableWorkflowsRequest = new Request(`http://localhost:8989/badger/${owner}/${repo}`, {
        "headers": {
          "accept": "application/json",
          "cookie": `gh_code=${process.env.BADGER_KV_ID}`
        },
        "method": "GET"
      });


    // Dispatch a fetch event to our worker
    let result = await mf.dispatchFetch(availableWorkflowsRequest);

    t.is(result.status, 200)
    const wflows: TWorkflow[] = await result.json().then(({ workflows }) => workflows)
    t.assert(Array.isArray(wflows));
    t.assert(wflows.every(workflow => {
      let { id, url, name, filename_url } = workflow
      return typeof id === 'number'
        && typeof url === 'string'
        && typeof name === 'string'
        && typeof filename_url === 'string'
    }))
  });
test("lists workflow runs for each branch",

  async (t: ava.ExecutionContext<unknown>) => {
    // Get the Miniflare instance
    const { mf }: { mf: Miniflare } = t.context as { mf: Miniflare },

      resultsRequest = new Request(`http://localhost:8989/badger/${owner}/${repo}/${wflow_id}`, {
        "headers": {
          "accept": "application/json",
          "cookie": `gh_code=${process.env.BADGER_KV_ID}`
        },
        "method": "GET"
      });

    // Dispatch a fetch event to our worker
    const result = await mf.dispatchFetch(resultsRequest);
    t.is(result.status, 200)
    const branchesObj: { branches: TRunResults[] } = await result.json()

    t.assert(Array.isArray(branchesObj.branches));
    t.assert(branchesObj.branches.every(workflow => {
      let { id, name, head_branch, workflow_id } = workflow
      t.is(workflow_id, wflow_id)

      return typeof id === 'number'
        && typeof workflow_id === 'number'
        && typeof name === 'string'
        && typeof head_branch === 'string'
    }))
  });
