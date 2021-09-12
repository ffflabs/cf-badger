// set up global namespace for worker environment
import makeServiceWorkerEnv from 'service-worker-mock';
// eslint-disable-next-line no-var
declare var global: any;
Object.assign(global, makeServiceWorkerEnv());
