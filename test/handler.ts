import { expect, use } from 'chai';
import { handleRequest } from '../src/handler';
import fetch from 'node-fetch';
import chaiHttp from 'chai-http';
use(chaiHttp);
const urls = [
  'https://assets.mydot.app/thumb/w=200_h=200/1606328093252_pampers_premium_care_xxg_128_600x600.png',
  'https://static.mydot.app/thumb/w=200_h=200/pampers.png',
  'https://assets.mydot.app/thumb/w=200_h=200/1606149250508_stevia_900_600x600.png',
  'https://static.mydot.app/banners/dots_virtuales_leyenda_15000_v2_600x313.gif',
];
describe('handler returns ok response', () => {
  urls.forEach((imgUrl) => {
    it(imgUrl, async () => {
      const response = await fetch(imgUrl);
      expect(response).to.be.ok;
    });
  });
});
const urlsByExtension = [
  'https://assets.mydot.app/thumb/w=200_h=200/1606149250508_stevia_900_600x600.png',
  'https://static.mydot.app/banners/dots_virtuales_leyenda_15000_v2_600x313.gif',
];
describe('responses have correct content type headers', () => {
  urlsByExtension.forEach((imgUrl) => {
    it(imgUrl, async () => {
      const response = await fetch(imgUrl),
        headers = response.headers,
        headerEntries = response.headers.entries();
      console.log(headerEntries);

      for (let [headerName, headerValue] of headerEntries) {
        if (headerName.startsWith('content-type')) {
          expect(headerValue).to.include('image/');
        }
        if (headerName.startsWith('cf-')) {
          console.log({ headerName, headerValue });
        }
      }
    });
  });
});
