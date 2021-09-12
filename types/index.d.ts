/**
 * This worker will parse an url e.g.
 * @link http://static.mydot.app/thumb/w=200_h=200/pampers.png
 *
 * and return a 200x200 thumbnail of
 * @link http://static.mydot.app/pampers.png
 *
 * generated on the fly by images.weserv.nl.
 * The response has aggresive caching headers.
 *
 * URL parsing rules are, for example
 * http://static.mydot.app/thumb/w=200_h=200/productos/detergente.jpg
 *
 *  - get the pathname and split by '/' (['','thumb','w=150_h=150','productos', 'detergente.jpg'])
 *  - first two elements are ignored
 *  - next element is used to figure out resize parameters ('w=150_h=150')
 *  - everything else is used to figure out the original image url
 *    ['productos','detergente.jpg'] means its path is /productos/detergente.jpg
 *
 * It will return a 150x150 thumbnail for  http://static.mydot.app/productos/detergente.jpg
 * Other default params are added as explained in method 'toWeserve'
 */
interface IWaitableObject {
  waitUntil: (promise: Promise<any>) => void;
}
export interface Repository {
  type: string;
  url: string;
  directory: string;
}
export interface IPkgConfig {
  name: string;
  description: string;
  main: string;
  repository?: Repository;
  license: string;
  version: string;
  devDependencies: {
    [key: string]: string;
  };
}
import Toucan from 'toucan-js';
export interface EnvWithBindings {
  USE_CLOUDFLARE: boolean;
  USE_AVIF: boolean;
  WORKER_NAMESPACE: string;
  PNG_QUALITY: number;
  JPG_QUALITY: number;
  SENTRY_CONNSTRING: string;
  WORKER_ENV: string;
  WORKER_URL: string;
  USE_CACHE: boolean;
}
export declare type TctxWithSentry = {
  request: Request;
  sentry: Toucan;
} & IWaitableObject;
export {};
