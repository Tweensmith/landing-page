import { THEMES, themeVars } from "../../../../components/_shared/theme.jsx";

// The colour themes a customer gets. The page itself wears the brand's preset (porcelain), which is held back from
// the public release, so it is not offered: the components are shown as they ship.
export const SHIPPED = ["tweensmith", "indigo", "ember", "forest", "mono"].filter((p) => THEMES[p]);
const themeName = (p) => (p === "tweensmith" ? "default" : p);

/** The colour themes as dots: a radio group, the arrow keys move the choice. */
export function Swatches({ preset, onPreset, mode }) {
  const onKey = (e) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    e.stopPropagation();
    const i = (SHIPPED.indexOf(preset) + step + SHIPPED.length) % SHIPPED.length;
    onPreset(SHIPPED[i]);
    e.currentTarget.querySelectorAll("[role=radio]")[i]?.focus();
  };
  return (
    <div className="swatches" role="radiogroup" aria-label="Colour theme of the components" onKeyDown={onKey}>
      {SHIPPED.map((p) => (
        <button key={p} type="button" role="radio" aria-checked={p === preset} tabIndex={p === preset ? 0 : -1} className="swatches__dot"
          aria-label={`${themeName(p)} theme`} title={`${themeName(p)} theme`} onClick={() => onPreset(p)}>
          <i aria-hidden style={{ background: themeVars(p, mode)["--ts-accent"] }} />
        </button>
      ))}
    </div>
  );
}
