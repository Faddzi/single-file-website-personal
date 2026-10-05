# single-file-website-personal

## Hosting and contact

The site is static and deploys to GitHub Pages from `main` using `.github/workflows/pages.yml`. It requires no server, API keys, or third-party form service.

The contact form prepares an email draft addressed to `me@faddzi.com` in the visitor's default email app. The visitor must send the draft; GitHub Pages does not receive or store form submissions.

### GitHub Pages setup

Enable Pages for this repository with **Build and deployment → GitHub Actions**. The published project site is `https://faddzi.github.io/single-file-website-personal/`.

To serve the site at `faddzi.com`, add `faddzi.com` as the custom domain in **Settings → Pages**, then point the domain's DNS to GitHub Pages:

- Apex `A` records: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, and `185.199.111.153`.
- Optional `AAAA` records: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, and `2606:50c0:8003::153`.
- Optional `www` `CNAME`: `faddzi.github.io`.

Remove any old records pointing the domain at the previous hosting provider. DNS changes are made at the domain's DNS provider, not in the GitHub repository.