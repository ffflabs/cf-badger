import Toucan from 'toucan-js';
import type { Context } from 'toucan-js/dist/types';
import type { EnvWithBindings } from 'itty-router-extras';

export function getSentryInstance(ctx: Context, env: EnvWithBindings): Toucan {
    /**
     * Only instance Toucan when we have a valid DSN in the environment
     */
    if (env.SENTRY_DSN) {
        return new Toucan({
            context: ctx,
            request: ctx.request,
            dsn: String(env.SENTRY_DSN),
            environment: String(env.WORKER_ENV),
            release: env.RELEASE,
            debug: false
        });
    }
    let breadCrumbs = [] as { [s: string]: unknown; }[];
    /**
     * Otherwise, return a dummy
     */
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
