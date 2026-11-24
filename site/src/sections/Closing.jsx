import { lazy, useEffect, useState } from "react";
import { Lazy } from "../lib/Lazy.jsx";
import { footerColumns } from "../menu.jsx";
import { CloseBand } from "./CloseBand.jsx";
import "./foot/foot.css";

const L = (load, name) => lazy(() => load().then((m) => ({ default: m[name] })));
const Footer = L(() => import("../../../components/footer/index.jsx"), "Footer");

// The kit measures its big word once, when the footer is first laid out. The logo's letters come from a font
// that is only brought in when the footer is reached, so that first measurement is taken with another face's
// widths. The footer is therefore laid out again, once, when the page is really setting text in the logo's
// letters.
//
// "Really" matters. The browser reports the font loaded a moment before it starts using it for layout, and a
// footer laid out in that moment is measured half with one face and half with the other (seen 2026-11-23 at
// phone width, about two runs in seven: the word a few pixels short, the letters crowded). So after the font
// reports loaded, a hidden line of the word is measured each frame against the same line in a plain face, and
// the footer is laid out again only once the two differ. If the font never arrives the footer stays as it is.
const NAME = "tweensm\u0131th";
function inLogoLetters() {
  const line = (family) => {
    const el = document.createElement("span");
    el.textContent = NAME;
    el.style.cssText = `position:absolute;left:-9999px;top:0;visibility:hidden;white-space:pre;font:600 100px ${family}`;
    document.body.appendChild(el);
    const w = el.getBoundingClientRect().width;
    el.remove();
    return w;
  };
  return Math.abs(line('"Tweensmith Name", monospace') - line("monospace")) > 1;
}
function FooterInLogoType(props) {
  const [type, setType] = useState(0);
  useEffect(() => {
    let on = true, frame = 0, tries = 0;
    const look = () => {
      if (!on) return;
      if (inLogoLetters()) setType(1);
      else if (++tries < 120) frame = requestAnimationFrame(look);
    };
    (document.fonts?.load?.(`600 100px "Tweensmith Name"`, NAME) ?? Promise.reject()).then(() => { if (on) frame = requestAnimationFrame(look); }, () => {});
    return () => { on = false; cancelAnimationFrame(frame); };
  }, []);
  return <Footer key={type} {...props} />;
}

// The closing band is sections/CloseBand.jsx; under it, the footer: the kit's Footer, kept by the owner on
// 2026-11-23 ("Keep and tidy") with its small print taken out (the server status pill and the "not live yet"
// line). Footer is a Pro component (its meta.json, `tier`); the owner has been told.
//
// The footer's big word is the logo's name: lower case, in the logo's typeface, with the logo's ball on the i
// (owner, 2026-11-23: "A, logo's letters"). The word is still the kit Footer's own (one span a letter, rising
// into focus as the footer is reached); the page only sets its type and draws the ball, in
// sections/foot/foot.css. The dotless i (U+0131) is passed so the ball can stand where the logo has it; the kit
// hides the word from assistive technology. The two versions not chosen are in parked/footer-word-options.css.
// The word keeps the kit's top-to-bottom fade and the fade answers the pointer (owner, 2026-11-23: "Keep the fade
// and make it react to hover"); that is in foot.css too.
export function Closing({ mode, pref, onAppearance }) {
  return (
    <>
      <CloseBand mode={mode} />

      <Lazy minHeight={320} className="foot">
        <FooterInLogoType
          layout="curtain"
          demoPage={false}
          showNewsletter={false}
          wordmark={NAME}
          brand={{ name: "Tweensmith", href: "#top", statement: "Motion-first components for React and Expo that publish their presets, states and prop ranges to your agent." }}
          // the menu's own four columns (src/menu.jsx)
          columns={footerColumns}
          columnCount={4}
          socials={[]}
          legal={{ owner: "Tweensmith", top: "Back to top" }}
          defaultAppearance={pref}
          onAppearanceChange={onAppearance}
        />
      </Lazy>
    </>
  );
}
