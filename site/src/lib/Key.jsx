/**
 * The page's pressable: a flat key (the card colour with a hairline edge) or, with `primary`, the one filled pill.
 * Nothing is raised: no lip, no travel. A press is a small scale-down; hover shades the face.
 * `latched` marks the chosen one in a set. `chip` is a small tag set inside the key.
 */
export function Key({ href, primary = false, latched = false, small = false, chip, children, className = "", ...rest }) {
  const Tag = href ? "a" : "button";
  return (
    <Tag
      className={`key${primary ? " key--primary" : ""}${small ? " key--sm" : ""}${className ? " " + className : ""}`}
      href={href}
      type={href ? undefined : "button"}
      data-on={latched ? "" : undefined}
      {...rest}
    >
      <span className="key__label">{children}</span>
      {chip != null && <span className="chip mono key__chip">{chip}</span>}
    </Tag>
  );
}
