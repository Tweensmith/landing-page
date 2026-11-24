// Every destination the page sends people to, in one place.
//
// None of these exists yet (2026-11-22): the repository is not public, the domain is not registered, the docs
// site and the registry are not built. So each `href` is null and `live` is false, and the page shows the
// destination as "not live yet" instead of linking anywhere. Nothing here is a guessed address.
//
// When one goes live: fill in its `href` (and `command` for install, `config` for the MCP server) and set
// `live: true`. In `command`, write {slug} where the component's name goes (the page puts a name there). Nothing else on the
// page needs to change; the hero, the top bar, the "Get it" section, the closing band and the footer all read this.
export const links = {
  repo: {
    live: false, href: null,
    slug: null,   // "owner/name" once the repository is public: the star count in the top bar and the hero is then read live from GitHub
    label: "GitHub repository", short: "GitHub",
    what: "The free components as open source: source, tokens, guidelines and the checker.",
    pending: "The repository is not public yet.",
  },
  install: {
    live: false, href: null, command: null,
    label: "Install a component", short: "Install",
    what: "One command puts a free component's source in your project.",
    pending: "The install command is published with the repository.",
  },
  docs: {
    live: false, href: null,
    label: "Documentation", short: "Docs",
    what: "A page per component: props, states, keyboard, motion.",
    pending: "The docs site is not built yet.",
  },
  mcp: {
    live: false, href: null,
    config: null,   // the snippet a person pastes into their agent's MCP settings, once the server is published
    label: "Brief: the MCP server", short: "Brief MCP",
    what: "The free part of Brief, the agent kit: a local server your agent asks for components, ranges and recipes.",
    pending: "It runs locally from the kit today; setup instructions arrive with the repository.",
  },
  llms: {
    live: false, href: null,
    label: "Brief: llms.txt", short: "llms.txt",
    what: "The whole kit as plain text an agent can read without a server.",
    pending: "Generated with the docs; not published yet.",
  },
};

/** The Pro waitlist form. No service is chosen to collect addresses, so submitting saves nothing. */
export const waitlist = { live: false, endpoint: null };

/** href for a call to action: the real destination once live, the "Get it" section until then. */
export const hrefFor = (key) => (links[key].live && links[key].href ? links[key].href : "#get");
