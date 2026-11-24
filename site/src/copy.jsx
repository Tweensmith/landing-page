// Every line of marketing copy on the page lives here.
//
// This is the page for milestone 1 (PRODUCT-STRATEGY.md section 9): the open-source release of the free web
// components. It presents the free set and nothing from Pro. Three kinds of line need care:
//   - Facts (counts, spec lines, tool names, the MCP reply) are not written here. They are computed at build
//     time from the kit's own files (virtual:catalogue in vite.config.js, src/data/mcp-search.json) and passed in.
//   - Destinations (repository, install command, docs, Brief) live in src/links.js. None is live yet.
//   - Lines wrapped in <Prov> are not true until something outside this page happens. Open the page with ?prov
//     in the URL to outline them. Find them all with:  grep -n "Prov" src/
//
// Native: until the native core exists, the Expo components are described as a preview of app patterns.

export function Prov({ children, as: Tag = "span", note, ...rest }) {
  return <Tag data-prov={note ?? "provisional"} {...rest}>{children}</Tag>;
}

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen"];
const word = (n) => WORDS[n] ?? String(n);
const cap = (t) => t[0].toUpperCase() + t.slice(1);
/** "Every one publishes its presets" only while that is true of the free set; otherwise the count. */
const share = (n, of, all, some) => (n === of ? all : `${n} of the ${of} ${some}`);

export const hero = {
  // The headline (owner, 2026-11-22, chosen in the planning session: "Feel finished"). It says who the product is
  // for and what it does for them; "Finished" is one of the three approved pillars. It must never say or imply that
  // an AI cannot do this without Tweensmith. The brand's short line, "Everything comes to rest.", is not dropped: it
  // stays the brand's line, to be placed elsewhere on the page.
  // The words, the tones and the line breaks are in sections/Hero.jsx (each word is a button you can throw).
  titlePlain: "Make what your AI builds feel finished.",
  // One line under it that says what the product is. The owner's rule (2026-11-23): the hero is not to be changed,
  // this line included. A reworded line with "free" in it was tried on the page the same day and taken back out.
  sub: () => "A motion-first component library for React and Expo.",
};

export const sections = {
  specimens: {
    // two tones: the first part in ink, the second in the muted heading colour.
    // Headings (owner, 2026-11-23): the second line says what the builder gets, not what to do to the page.
    title: ["A whole screen, from the free set.", "Every part already works together."],
  },
  agent: {
    // True of our own server: the state names on the page are the ones it returns for each component.
    title: ["Your agent gets every state.", "Loading, error and success come finished."],
  },
  catalogue: {
    // The number is counted from the kit's files when the page is built, so it is passed in, not written here.
    title: (n) => [`${n} free components.`, "Open source, and yours to keep."],
  },
  get: {
    // Mine, not approved copy. Both halves are true of the plan: one command per component, and what it adds is
    // the component's source in your project (src/links.js, `install.what`).
    title: ["One command.", "The source lands in your project."],
  },
  close: {
    // Read only by the parked closing options (sections/parked/Closing*.jsx); the band on the page is the kit's CTA
    // Band and its copy is in sections/Closing.jsx. "Everything comes to rest." is the brand's approved short line
    // (brand/messaging). The second tones, the key's label and the hidden heading are mine, not approved.
    title: ["Everything comes to rest.", "Start with the free set."],
    // for the option whose pieces can be thrown; shown only when motion is allowed, since nothing can be thrown without it
    titleThrow: ["Everything comes to rest.", "Throw one and see."],
    cta: "Get the free set",
    sr: "Get the free components",
  },
  faq: {
    // Mine, not approved copy. The second tone is the sub-line the section had ("Straight answers, including the
    // ones that say not yet."), shortened.
    title: ["Asked before you install.", "Straight answers, including not yet."],
    // read only by the parked option that sorts the answers by whether they are true today
    // (sections/parked/QuestionsNow.jsx)
    titleNow: ["What is true now.", "And what is not yet."],
  },

  // PARKED until the paid launch (milestone 3). Not rendered: Pricing.jsx is not mounted in App.jsx.
  pricing: {
    eyebrow: "Pricing",
    title: <Prov note="pricing plan">Pay once. Keep everything you downloaded.</Prov>,
    lede: (
      <Prov note="pricing plan">
        One licence covers web and Expo. Twelve months of updates and the Pro MCP come with it; renewing after that is optional.
      </Prov>
    ),
  },
};

// The one line about Pro on the milestone 1 page (decision 18): it says Pro is coming and sells nothing.
export const proSoon = {
  // Milestone 1 allows one "Pro is coming" line and sells nothing. The second tone is from the line as first built
  // ("A larger set of components, after the free release."). Mine, not approved copy.
  title: ["Pro is coming.", "A larger set, after the free release."],
  label: "Email",
  cta: "Tell me",
  ask: "Tell me when it is ready",
  // shown only once an address has really been taken (src/links.js, `waitlist`)
  done: "One email, when Pro is ready.",
  failed: "That did not go through. Try again.",
  // read by the parked first version (sections/parked/ProCard.jsx)
  text: "A larger set of components, after the free release. Leave an email to hear once, when it is ready.",
  unwired: "Not saved. The waitlist is not connected yet, so nothing was sent or stored.",
};

// The tiers, the founding offer and the terms are parked until the paid launch, in src/copy-pricing.jsx, a file
// the page does not import.

// Answers are true today, or say plainly what is not live yet.
export const faqCats = [
  { id: "release", name: "The release" },
  { id: "use", name: "Using it" },
];

export const faq = (c) => [
  {
    id: "free", cat: "release", when: "now", q: "What is free?",
    // was: "They are listed above, and eleven of them are running on this page." All of them run on the row now.
    a: `${c.freeWeb} web components, released as open source under the MIT licence. Every one of them runs on this page, in the row above.`,
  },
  {
    id: "install", cat: "release", when: "notyet", q: "Can I install it today?",
    a: "Not yet. The repository is not public, and the install command and the docs are published with it. This page goes live when they do.",
  },
  {
    id: "pro", cat: "release", when: "notyet", q: "What is Pro?",
    // was: "...leave an email in the line above the questions." No service takes addresses yet, so there is no field.
    a: "A larger set of components that is not released yet. This page presents the free set.",
  },
  {
    id: "native", cat: "release", when: "notyet", q: "Does it work in React Native or Expo?",
    a: `Not as a kit yet. ${c.native} app patterns for Expo exist as a preview, such as a bottom sheet, a swipe card stack and a story viewer. They are not part of this release; a native core follows the web one.`,
  },
  {
    id: "look", cat: "use", when: "now", q: "Will my product look like everyone else's?",
    a: "Every component reads its colours, radii and type from --ts-* variables, and the kit ships colour presets in light and dark. The motion is the part that stays the same.",
  },
  {
    id: "agent", cat: "use", when: "now", q: "Does it work without an agent?",
    a: "Yes. They are React components with props. The metadata that helps an agent (intents, prop ranges, presets, states) is also what the gallery's controls are built from.",
  },
  {
    id: "versions", cat: "use", when: "now", q: "Which React and Motion versions?",
    // was: "React 18 and Motion 11 ... React 19 and Motion 12 is on the list". The kit moved (its package.json:
    // react ^19.3.1, motion ^14.14.0, read 2026-11-23).
    a: "The components run on React 19 and Motion 14, styled with plain CSS on variables, with no Tailwind.",
  },
  {
    id: "reduced", cat: "use", when: "now", q: "What does reduced motion do?",
    // The answer used to end with figures from the cold-agent test of 20 November 2026 ("11 of the 13 components we
    // tested passed"). That test is stale and its figures are not to be on the page (planning session, 2026-11-23).
    a: "Most components switch to a still or near-still path when your system asks for reduced motion, and this page does too.",
  },
];
