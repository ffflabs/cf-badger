
import { ConsoleLog, Miniflare } from "miniflare";

import test from "ava";
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
      wranglerConfigEnv:'dev',
      //host: 'http://127.0.0.1',
      
          
      durableObjects:{Badger:{className:'Badger'}},
      
      durableObjectsPersist: true,
      cachePersist: false,
      modules: true,
      modulesRules: [
        { type: "ESModule", include: ["**/*.mjs"], fallthrough: true }]
    });
    
  t.context = { mf };
});

test("lists available workflows with token "+process.env.GITHUB_TOKEN,
  /**
  * @param {import('ava').t}
  */
  async (t) => {
    // Get the Miniflare instance
    const { mf } = t.context,
    availableWorkflowsLink=`http://localhost:8989/badger/${owner}/${repo}?token=${process.env.GITHUB_TOKEN}`
    console.log(availableWorkflowsLink)
    // Dispatch a fetch event to our worker
     let result = await mf.dispatchFetch(availableWorkflowsLink);
     
    t.is(result.status, 200)
    const workflows = await result.json()
    t.assert(Array.isArray(workflows));
    t.assert(workflows.every(workflow => {
      let { id, id_url, name, filename_url } = workflow
      return typeof id === 'number'
        && typeof id_url === 'string'
        && typeof name === 'string'
        && typeof filename_url === 'string'
    }))
  });
  test("lists workflow runs for each branch",
  /**
  * @param {import('ava').t}
  */
  async (t) => {
    // Get the Miniflare instance
    const { mf } = t.context;
    // Dispatch a fetch event to our worker
    const result = await mf.dispatchFetch(`http://localhost:8989/badger/${owner}/${repo}/${wflow_id}`);
    t.is(result.status, 200)
    const branchesObj = await result.json()

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
