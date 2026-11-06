
# PPUC website & documentation

This repo contains all the source code for [ppuc.org](https://ppuc.org), which also includes all user documentation.

## Structure

ppuc.org is assembled from two [MkDocs](http://www.mkdocs.org/) projects into one output folder:

| URL | Source | Config |
| --- | --- | --- |
| `ppuc.org/` | Landing page: choose PPUC Docs or PPUC/DMD | `website/mkdocs.yml` |
| `ppuc.org/dmd/` | PPUC/DMD website (The Idea, Distributors, Firmware) | `website/mkdocs.yml` |
| `ppuc.org/docs/` | PPUC documentation | `mkdocs.yml` |

The website in `website/` uses its own small theme (`website/theme/`); its pages are Markdown files in
`website/pages/`. The PPUC/DMD variants, the distributors and the header navigation are data in
`website/mkdocs.yml` under `extra:`, so adding a distributor or a display size only needs a change there.
Distributor logos go into `website/theme/assets/img/distributors/`.

Old documentation URLs from before the move to `/docs/` (e.g. `ppuc.org/ppuc_dmd/`) are forwarded by the
site-wide 404 page (`website/theme/404.html`).

## Technical details

The PPUC website is built using [MkDocs](http://www.mkdocs.org/), a static
site generator using Markdown files as the source. It uses the
[Material for MkDocs](https://squidfunk.github.io/mkdocs-material/) theme.

The base of this documentation is copied from https://github.com/missionpinball/mpf-docs/ which has been released using the MIT license.

The site is hosted on GitHub Pages, and the `main` branch of this repo controls
what's published to the live site. A [GitHub workflow](https://github.com/PPUC/docs/blob/main/.github/workflows/deploy.yml) is used to automatically
build and deploy the site whenever a commit or merge is made to the `main` branch.
You can see the commits and page builds in the [Actions tab](https://github.com/ppuc/docs/actions).

## To build / run locally

1. Clone the repo
2. Open a terminal window and `cd` into the root folder of this repo
3. `python3 -m venv venv`
4. `source venv/bin/activate` or `.\venv\Scripts\activate`
5. `pip3 install -r requirements.txt` (to install mkdocs and what it needs)
6. `python build.py --serve` builds the complete site into `out/`, serves it on port 8000, and rebuilds and
   reloads the browser whenever you save a file

You should be able to access the site via your web browser at `localhost:8000`.

## To contribute

We would love contributions to the docs! We have a [Contributing Guide](/docs/about/help_docs.md)
which explains how to contribute.

## Configuring site navigation

All the navigation for the site is configured in the `mkdocs.yml` file. This
is somewhat annoying since it means that if you add a new page, you have to
go to a completely separate place to set up the nav.

I tried to use the auto pages plugin to automatically
create the navigation, and/or at least keep it local to each subfolder, but
unfortunately our navigation tree is different from our folder hierarchy which
made that not possible. We may be able to combine both methods, and this is
something someone could look into.
