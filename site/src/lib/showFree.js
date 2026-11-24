// A way for a link anywhere on the page to say "show this free component": the free set (sections/free/Row.jsx)
// brings that name under its mark and runs it on its stage. The row is only built when it is reached, so a
// request made before then is kept and taken when the row is built.
let wanted = null;
const listeners = new Set();

/** Ask the free set to show the component with this slug. */
export const showFree = (slug) => { wanted = slug; listeners.forEach((f) => f(slug)); };
/** The request waiting to be shown, if any, left in place. For a first draw, which React may run more than once. */
export const peekWanted = () => wanted;
/** The request waiting to be shown, if any; reading it clears it. Call it once the row is really on the page. */
export const takeWanted = () => { const w = wanted; wanted = null; return w; };
/** Be told of each request; returns the function that stops it. */
export const onShowFree = (f) => { listeners.add(f); return () => listeners.delete(f); };
