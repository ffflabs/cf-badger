
&nbsp; &nbsp;&nbsp; &nbsp;&nbsp; &nbsp;![Logo](docs/images/cf-badger-extended-title-round-corners.svg)&nbsp; &nbsp;&nbsp; &nbsp;&nbsp; &nbsp;

Cf-Badger generates short urls displaying current status (actually, delayed up to 5 min) of your private repos workflows. 
 
<p align="center">
<a href="https://workers.cloudflare.com/">
<img src="https://img.shields.io/badge/Cloudflare-Workers-orange?color=f38020&logo=cloudflare&logoColor=f38020&style=for-the-badge&labelColor=3e464e"></a>
&nbsp; &nbsp;
<a href="https://github.com/ffflabs/cf-badger/actions/workflows/tests.yml">
<img src="https://cf-badger.ctohm.com/9c6530e5f3abdb0f6247/endpoint.svg?branch=master&style=for-the-badge">
</a>&nbsp; &nbsp;

<img src="https://img.shields.io/static/v1?label=Made%20With&message=TypeScript&color=f0f0f0&labelColor=3974c0&style=for-the-badge&logo=typescript&logoColor=white&messageColor=3974c0">

</p> 

## FAQ

### Why? 

Because, unless you're logged in github, it isn't trivial to display current statuses. And it grinds my gears when I see broken images in README's preview.

<p align="center" style="text-align:center">


<img src="docs/images/before_and_after200.svg">


</p>

Also, CF-Badger is my project for the **[Cloudflare Developer Summer Challenge](https://challenge.developers.cloudflare.com/)**
### How?

We request your workflows run outcome directly to Github's API, on your behalf, so you'll need to enter a [personal access token](https://github.com/settings/tokens/new?scopes=repo&description=cf-badger.ctohm.com) with 'repo' privileges for CF-Badger to access said info.

<p align="center">


<img src="docs/images/screenshot.png">

</p>

We compute and expose the last run outcome as JSON to [Shields.io endpoint API](https://shields.io/endpoint), without which CF-Badger wouldn't work.
### Security Concerns

Your token token won't be part of the generated URL. Instead, we'll store it internally, and provide an url you can safely share without exposing your token.

<p align="center">


<img src="docs/images/markdown.png">

</p>


### Do I need a token for public repos?

Yes, because we still query Github's API. However, if you intend to display workflow status badges for public repos, you can use Shields.io direcly. Just look in their [Builds Category](https://shields.io/category/build) for "Github Workflows" section.*


### Why do you address yourself as "we" if you're the only contributor?


It kinda makes the project sound like a serious initiative. 

--------------
## Acknowledgements

**[Cloudflare Workers](https://www.cloudflare.com/products/workers)**, along with [Workers KV](https://www.cloudflare.com/products/workers-kv/), and [Worker Sites](https://github.com/cloudflare/worker-sites-template) and [Durable Objects](https://blog.cloudflare.com/introducing-workers-durable-objects/). This is the blazing fast platform on which CF-Badger runs and replicates over 200+ locations worldwide. Did I mention CF-Badger is my project for the **[Cloudflare Developer Summer Challenge](https://challenge.developers.cloudflare.com/)**?

**[Shields.io](https://shields.io)**, whose service renders actual badges and without which CF-Badger would generate broken images, which would be ironic.

**[Atrox's Github Actions Badge](https://actions-badge.atrox.dev/)**, on which CF-Badger was inspired. Albeit I used (and loved) its functionality, I wanted to improve it by:

- Avoid exposing your personal access token in the badge's URL
- Allowing you to pick which action to display, given a repo might have several relevant workflows in place
- Enumerating available workflows and request their status by ID under the hood

