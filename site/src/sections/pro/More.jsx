import { useRef } from "react";
import { Skeleton } from "../../../../components/skeleton/index.jsx";
import { proSoon } from "../../copy.jsx";
import { Title } from "../../lib/Title.jsx";
import { useOnScreen } from "../../lib/Lazy.jsx";
import { inert } from "../../lib/inert.js";
import { NotYet } from "../get/dest.jsx";
import { WaitForm, useWaitlist } from "./shared.jsx";

/*
 * The one line about Pro. The heading with the email field and its key beside it, over a slow row of blank
 * name-plates (the kit's free Skeleton): a larger set is on its way, and none of it is named, shown or counted. The plates echo
 * the row of free names higher up the page. Their number and widths mean nothing; they are not a count of Pro.
 *
 * Until a service takes addresses (src/links.js, `waitlist`), "Not live yet" stands where the field would be.
 * The row drifts only while it is on screen. Under reduced motion it stands still and the plates do not shimmer.
 */
const PLATES = [230, 150, 320, 190, 270, 130, 300, 210, 170, 350, 200, 260];

export function More() {
  const w = useWaitlist();
  const root = useRef(null);
  const seen = useOnScreen(root, "0px");
  return (
    <>
      <div className="pwline">
        <Title id="pro-h" parts={proSoon.title} />
        {w.open ? <WaitForm w={w} /> : <NotYet />}
      </div>
      <div className="pwmore" ref={(el) => { root.current = el; inert(true)(el); }} aria-hidden>
        <div className="pwmore__row" data-run={seen || undefined}>
          {[...PLATES, ...PLATES].map((width, i) => <Skeleton key={i} layout="rect" width={width} height={46} radius={12} framed={false} label="" />)}
        </div>
      </div>
    </>
  );
}
