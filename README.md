
&nbsp; &nbsp;&nbsp; &nbsp;&nbsp; &nbsp;![Logo](docs/images/cf-badger-extended-title-round-corners.svg)&nbsp; &nbsp;&nbsp; &nbsp;&nbsp; &nbsp;

Cf-Badger generates short urls displaying current status (actually, delayed up to 5 min) of your private repos workflows. 
 
<p align="center" style="text-align:center">
<a href="https://workers.cloudflare.com/">
<img src="docs/images/cf-workers-badge.svg"></a>
&nbsp; 
<a href="https://github.com/ffflabs/cf-badger/actions/workflows/tests.yml">
<img src="https://cf-badger.com/badger/9c6530e5f3abdb0f6247/endpoint.svg?branch=master&style=for-the-badge">
</a>&nbsp; 
<a href="https://pages.cloudflare.com/">
<img src="docs/images/cf-pages-badge.svg"></a>
<img src="https://img.shields.io/static/v1?label=Made%20With&message=TypeScript&color=f0f0f0&labelColor=3974c0&style=for-the-badge&logo=typescript&logoColor=white&messageColor=3974c0">

<div align="center" style="text-align:center">CF-Badger is my project for the <a href="https://challenge.developers.cloudflare.com/">Cloudflare Developer Summer Challenge</a></div>

</p> 

## FAQ

### :shield: Private Repos vs Public Badges

Sometimes you might want to display status badges for a private repo's workflows. Wether it's for Github Pages, public repo wikis, custom health dashboards or even for previewing your README contents in your ide, you'll discover it's not really straightforward.

Albeit it covers most bases, Shields.io's excellent service doesn't cover private repos. 

:octocat: Github provides badges for workflows on these repos, but but unless you have read permissions on it, and you're currently logged on GH, only a broken image is displayed. 

<p align="center" style="text-align:center">


<img src="docs/images/before_and_after200.svg">

<div align="center" style="font-size:0.8em;text-align:center">How to get from broken to flawless?</div>

</p>

Enter **CF-Badger**. It will present you with a brief form (which, by the way, is hosted on [Cloudflare Pages](https://pages.cloudflare.com)) whose final output is a short url to the status badge, updated every 5 minutes.



<p align="center">


<img src="docs/images/screenshot.png">

</p>

--------------

### 🎯 How?

 We request the outcome of your workflows directly to Github's API, on your behalf. To do this, we'll need you to provide a [personal access token](https://github.com/settings/tokens/new?scopes=repo&description=cf-badger.com) with 'repo' privileges.  


This result is formatted in compliance to Shields.io schema, and provided as parameter to [Shields.io endpoint API](https://shields.io/endpoint), (🙌 without which CF-Badger wouldn't work). 

Finally, we'll generate and provide you with a shortened URL to the computed status badge

<p align="center">


<img src="docs/images/markdown.png">

</p>

**🔐 Security wise**, this token is stored internally on the persistent storage of a [Durable Object](https://blog.cloudflare.com/introducing-workers-durable-objects/) and it's never exposed to third parties nor used other than to query Github's API on your behalf. 

If your use case for CF-Badger involves public repos, we still need you to enter a token, albeit with the much narrower and harmless `public_repo` scope. **However**, for that use case, you might want to use Shields.io direcly. Just look in their [Builds Category](https://shields.io/category/build) for "Github Workflows" section.


### 🤷 Why do you address yourself as "we" if you're the only contributor? 


It kinda makes the project sound like a serious initiative. 

--------------
## 🏆 Acknowledgements 

**[Cloudflare Workers](https://www.cloudflare.com/products/workers)**, along with [Workers KV](https://www.cloudflare.com/products/workers-kv/), [Cloudflare Pages](https://pages.cloudflare.com/) and [Durable Objects](https://blog.cloudflare.com/introducing-workers-durable-objects/). This is the blazing fast platform on which CF-Badger runs and replicates over 200+ locations worldwide. Did I mention CF-Badger is my project for the **[Cloudflare Developer Summer Challenge](https://challenge.developers.cloudflare.com/)**?

**[Shields.io](https://shields.io)**, whose service renders actual badges and without which CF-Badger would generate broken images, which would be ironic.

**[Atrox's Github Actions Badge](https://actions-badge.atrox.dev/)**, on which CF-Badger was inspired. Albeit I used (and loved) its functionality, I didn't feel comfortable having my token displayed in the badge's URL query parameters, and I also needed to track several workflows for each repo.