/**
 * This function will receive an URL whose path has the form
 * `/thumbnails/w=600_h=313/banners202102/01_lysto_grandes_formatos.jpg`
 *
 * From the original image url and its parameters, build the corresponding
 * weserv url using {fit = contain , af = true, q = 50 - l=-1 } @see https://images.weserv.nl/docs/fit.html#contain
 * the height and width are taken from a url part e.g. `/w=640_h=480/`.
 * the `url`  parameter is computed by rebuilding the original url (removal of worker namespace
 * and str)
 *
 * @param {URL} url
 * @returns {{resizedUrl:string,fullSizeImgStr:string,passThrough: boolean}}
 */
export declare function toWeserve(
  url: URL,
): {
  resizedUrl: URL;
  fullSizeImgStr: string;
  passThrough: boolean;
};
