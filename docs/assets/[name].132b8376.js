import{b as r,B as e}from"./index.f4c8c8ce.js";import{d as a,o as s,c as t,f as n,u as o,F as i}from"./vendor.eb742c19.js";var p=a({props:{message:String,name:{type:String,required:!0},installation:{type:String,required:!0}},setup(a){const p=a;return(a,l)=>{const u=r,c=e;return s(),t(i,null,[n(u),n(c,{api_url:o("https://cf-badger.com"),owner:p.installation,repo:p.name},null,8,["api_url","owner","repo"])],64)}}});export{p as default};