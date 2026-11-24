import { lazy } from "react";
import { counts } from "../lib/counts.js";
import { Lazy } from "../lib/Lazy.jsx";
import "./free/free.css";

// Kept as an export because other sections import the counts from here.
export { counts };

// The free set (owner's choice, 2026-11-23): every free web component's name on one row to throw, under a stage
// that runs the one the row comes to rest on. Pro and the Expo patterns are not listed. The loaders are in
// sections/free/shared.jsx, written out by name so that nothing that is not free is bundled into the page.
// Not chosen, parked in sections/parked/: FreeParagraph.jsx (the names as a paragraph), FreeSorter.jsx (tags in
// three orders) and CatalogueList.jsx (four counts and a list by category, the section before them).
const Row = lazy(() => import("./free/Row.jsx").then((m) => ({ default: m.Row })));

// `order`: the names in a given order. The page passes them category by category, so that a category's row in the
// menu can open the free set on that category; without it, A to Z.
export function Catalogue({ mode = "dark", order }) {
  return (
    <section className="section fr" id="catalogue" aria-labelledby="cat-h">
      <Lazy minHeight={0} fallback={<div className="fr__wait" aria-hidden />}>
        <Row key={order ? "family" : "name"} mode={mode} order={order} />
      </Lazy>
    </section>
  );
}
