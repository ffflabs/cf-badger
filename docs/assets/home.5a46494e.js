import{o as e,c as t,b as a,f as r,d as s,l,B as o,C as n,E as i,F as c}from"./vendor.eb742c19.js";import{c as d,d as g}from"./index.26520c44.js";const f={xmlns:"http://www.w3.org/2000/svg","xmlns:xlink":"http://www.w3.org/1999/xlink",width:"1.2em",height:"1.2em",preserveAspectRatio:"xMidYMid meet",viewBox:"0 0 32 32"},x=[a("path",{d:"M11.92 24.94A12.76 12.76 0 0 0 24.76 12.1v-.59A9.4 9.4 0 0 0 27 9.18a9.31 9.31 0 0 1-2.59.71a4.56 4.56 0 0 0 2-2.5a8.89 8.89 0 0 1-2.86 1.1a4.52 4.52 0 0 0-7.7 4.11a12.79 12.79 0 0 1-9.3-4.71a4.51 4.51 0 0 0 1.4 6a4.47 4.47 0 0 1-2-.56v.05a4.53 4.53 0 0 0 3.55 4.45a4.53 4.53 0 0 1-2 .08A4.51 4.51 0 0 0 11.68 21a9.05 9.05 0 0 1-5.61 2A9.77 9.77 0 0 1 5 22.91a12.77 12.77 0 0 0 6.92 2",fill:"currentColor"},null,-1)];var h={name:"carbon-logo-twitter",render:function(a,r){return e(),t("svg",f,x)}};const p={},u={class:"z-10 text-gray-700 bg-white lg:flex lg:items-stretch",style:{"min-height":"2rem"}},m={id:"navbarExampleTransparentExample",class:"py-0 px-0 shadow-xs lg:flex lg:items-stretch lg:flex-grow lg:flex-shrink-0"},b=a("div",{class:"lg:flex lg:items-stretch lg:justify-start lg:mr-auto"},null,-1),w={class:"lg:flex lg:items-stretch lg:justify-end lg:ml-auto"},v={class:"block relative flex-grow-0 flex-shrink-0 py-2 px-3 leading-normal lg:flex lg:items-center"},y={class:"flex justify-start"},k={class:"clear-both relative flex-shrink-0 p-0 m-0 text-base text-left box-border"},j={class:"inline-flex relative px-2 py-1 mx-1 justify-center items-center h-8 text-center text-gray-800 no-underline align-top rounded border border-gray-400 border-solid shadow-none appearance-none cursor-pointer select-none whitespace-no-wrap hover:border-gray-500 hover:text-gray-800 focus:border-blue-600 focus:text-gray-800","data-social-network":"Twitter","data-social-action":"tweet","data-social-target":"https://cf-badger.com",target:"_blank",href:"https://twitter.com/intent/tweet?text=cf-badger: a cloudflare worker that makes safe workflow status badges for Github private repos https://cf-badger.com #CloudflareSummerChallenge @CloudflareDev"},A={class:"inline-flex justify-center items-center w-6 h-6"},C=a("span",{class:""}," Tweet ",-1),$={class:"clear-both relative flex-shrink-0 p-0 m-0 text-base text-left box-border"},_={class:"inline-flex relative px-2 py-1 mx-1 justify-center items-center h-8 text-center text-gray-800 no-underline align-top rounded border border-gray-400 border-solid shadow-none appearance-none cursor-pointer select-none whitespace-no-wrap hover:border-gray-500 hover:text-gray-800 focus:border-blue-600 focus:text-gray-800","data-social-network":"Github","data-social-target":"https://cf-badger.com",target:"_blank",href:"https://github.com/ffflabs/cf-badger"},E={class:"inline-flex justify-center items-center w-6 h-6"},G=a("span",{class:""}," Github ",-1);p.render=function(s,l){const o=h,n=d;return e(),t("nav",u,[a("div",m,[b,a("div",w,[a("div",v,[a("div",y,[a("p",k,[a("a",j,[a("span",A,[r(o)]),C])]),a("p",$,[a("a",_,[a("span",E,[r(n)]),G])])])])])])])};const M={style:{flex:"1"},class:"px-4 py-1 text-center text-gray-700 dark:text-gray-200"};var P=s({setup(s){const d=l();console.log(`layout:mounted! ${location.href}`);const f=new URL(location.href);if(f.searchParams.has("code")){let e=`code=${f.searchParams.get("code")}`;const t=f.searchParams.get("installation_id");t&&(e+=`&installation_id=${t}`),d.push(`/#${e}`)}return(s,l)=>{const d=p,f=o("router-view"),x=g;return e(),t(c,null,[r(d),a("main",M,[r(f,n(i(s.$attrs)),null,16)]),r(x)],64)}}});export{P as default};
