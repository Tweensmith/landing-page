# Tweensmith landing page

The landing page for Tweensmith, built from Tweensmith's own components.

## Run it

```bash
npm install
npm run dev
```

The page is served on port 5190. `npm run build` writes the finished page to `site/dist`.

## What is here

- `site/` is the page.
- `components/`, `brand/`, `native/`, `tokens.json` and `categories.json` are copies of the files the page
  imports or reads from the Tweensmith kit, at the places they have there. Only the files the page uses are here.
- `netlify.toml` holds the build settings for Netlify.

The page is developed inside the kit and written out to this repository by `site/scripts/export-repo.mjs`, which
replaces everything here. So changes are made in the kit and exported, not made here. The scripts in
`site/scripts/` that record the MCP server's answers need the whole kit and do not run from this repository.
