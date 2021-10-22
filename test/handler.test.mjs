import { ConsoleLog, Miniflare } from "miniflare";
import { Request } from "@mrbbot/node-fetch";
import test from "ava";
const owner = "huasofoundries", repo = "jpgraph", wflow_id = 8501839;
test.beforeEach((t) => {
  const mf = new Miniflare({
    scriptPath: "./dist/index.mjs",
    sourceMap: true,
    log: new ConsoleLog(),
    wranglerConfigPath: "./wrangler.toml",
    watch: true,
    kvNamespaces: ["BADGER_KV"],
    upstream: "https://cf-worker.com",
    cachePersist: false,
    port: 8989,
    wranglerConfigEnv: "dev",
    durableObjects: { Badger: { className: "Badger" } },
    durableObjectsPersist: true,
    modules: true,
    modulesRules: [
      { type: "ESModule", include: ["**/*.mjs"], fallthrough: true }
    ]
  });
  t.context = { mf };
});
test("lists available workflows with code ", async (t) => {
  const { mf } = t.context, availableWorkflowsRequest = new Request(`http://localhost:8989/badger/${owner}/${repo}`, {
    "headers": {
      "accept": "application/json",
      "cookie": `gh_code=${process.env.BADGER_KV_ID}`
    },
    "method": "GET"
  });
  let result = await mf.dispatchFetch(availableWorkflowsRequest);
  t.is(result.status, 200);
  const wflows = await result.json().then(({ workflows }) => workflows);
  t.assert(Array.isArray(wflows));
  t.assert(wflows.every((workflow) => {
    let { id, url, name, filename_url } = workflow;
    return typeof id === "number" && typeof url === "string" && typeof name === "string" && typeof filename_url === "string";
  }));
});
test("lists workflow runs for each branch", async (t) => {
  const { mf } = t.context, resultsRequest = new Request(`http://localhost:8989/badger/${owner}/${repo}/${wflow_id}`, {
    "headers": {
      "accept": "application/json",
      "cookie": `gh_code=${process.env.BADGER_KV_ID}`
    },
    "method": "GET"
  });
  const result = await mf.dispatchFetch(resultsRequest);
  t.is(result.status, 200);
  const branchesObj = await result.json();
  t.assert(Array.isArray(branchesObj.branches));
  t.assert(branchesObj.branches.every((workflow) => {
    let { id, name, head_branch, workflow_id } = workflow;
    t.is(workflow_id, wflow_id);
    return typeof id === "number" && typeof workflow_id === "number" && typeof name === "string" && typeof head_branch === "string";
  }));
});
