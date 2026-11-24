import { lazy } from "react";
import { Lazy } from "../lib/Lazy.jsx";
import "./questions/questions.css";

// The questions: the heading on the left, the eight questions on the right in the kit's free Accordion.
// Settled by the owner on 2026-11-23 ("A, the list"). The two options not chosen are parked in
// sections/parked/QuestionsAsk.jsx and QuestionsNow.jsx; the section before them is QuestionsAccordion.jsx.
// The questions and answers are in src/copy.jsx (`faq`).
const List = lazy(() => import("./questions/List.jsx").then((m) => ({ default: m.List })));

export function Questions() {
  return (
    <section className="section qs" id="faq" aria-labelledby="faq-h">
      <Lazy minHeight={0} fallback={<div className="qs__wait" aria-hidden />}>
        <List />
      </Lazy>
    </section>
  );
}
