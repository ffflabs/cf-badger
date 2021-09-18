import Toucan from 'toucan-js';
import type { Context } from 'toucan-js/dist/types';
import type { EnvWithBindings } from '../index';

export function getSentryInstance(ctx: Context, env: EnvWithBindings): Toucan {
    if (env.SENTRY_CONNSTRING) {
        return new Toucan({
            context: ctx,
            request: ctx.request,
            dsn: String(env.SENTRY_CONNSTRING),
            environment: String(env.WORKER_ENV),
            release: env.RELEASE,
            debug: false
        });
    }
    let breadCrumbs = [] as { [s: string]: unknown; }[];
    return {
        captureException: (err: Error) => {
            console.error(err);
            return Date.now();
        },
        addBreadcrumb: (args: { [s: string]: unknown; }) => {
            breadCrumbs.push(args);
        },
        captureMessage: (msg: string) => {
            console.log(msg);
            return Date.now();
        }
    } as unknown as Toucan;

}
