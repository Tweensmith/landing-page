import { Accordion } from "../../../../components/accordion/index.jsx";
import { faq, sections } from "../../copy.jsx";
import { counts } from "../../lib/counts.js";
import { Title } from "../../lib/Title.jsx";

/*
 * The list. The heading on the left; on the right the eight questions in the kit's free Accordion with
 * everything but the questions turned off: no search field, no topic chips, no count, no label, no sub-line, no
 * "was this helpful". One answer is open at a time, and the first is open to begin with.
 */
const ITEMS = faq(counts).map(({ id, q, a }) => ({ id, q, a }));

export function List() {
  return (
    <div className="qslist">
      <Title id="faq-h" parts={sections.faq.title} />
      <Accordion items={ITEMS} categories={[]} mode="single" layout="plain" defaultOpen={ITEMS[0].id}
        showSearch={false} showCategories={false} showCount={false} showFeedback={false} showCopyLink={false}
        eyebrow="" title="" subtitle="" status={null} help={null} ariaLabel="Questions about Tweensmith" />
    </div>
  );
}
