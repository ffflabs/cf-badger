export { };

declare global {
  const SENTRY_PROJECT_ID: string;
  const SENTRY_KEY: string;
  const RELEASE: string;
  const GITHUB_TOKEN: boolean;
  const USE_AVIF: boolean;
  const WORKER_NAMESPACE: string;
  const PNG_QUALITY: number;
  const JPG_QUALITY: number;
  const SENTRY_CONNSTRING: string;
  const WORKER_ENV: string;
  const WORKER_URL: string | boolean;
  const USE_CACHE: boolean;
  const FALLBACK_DOMAIN: string;

}
