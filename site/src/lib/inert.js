/**
 * Sets or clears `inert` on an element. React 18 warns about `inert=""` and React 19 reads it as false, so the
 * attribute is set on the node itself: <div ref={inert(hidden)} />.
 *
 * Only for an element that stays switched off for as long as it exists, and only on a plain element. On a Motion
 * element (`motion.div` and the like) the function is called once, when the element appears, and never again, so
 * a value that changes later is not applied: set the attribute in an effect instead (see MenuFloat in sections/nav/Menu.jsx).
 */
export const inert = (on) => (el) => { if (el) el.toggleAttribute("inert", !!on); };
