import { Prov } from "../../copy.jsx";

// How the "Get it" section reads a destination from src/links.js.

export const isLive = (d) => !!(d.live && (d.href || d.command));
/** The install command for one component: {slug} in the command is where the name goes. */
export const commandFor = (d, slug) => d.command.replace("{slug}", slug);

/** What stands where a destination will be until it is live. */
export function NotYet({ className = "" }) {
  return <Prov note="not live" className={"mono gt__not" + (className ? " " + className : "")}>Not live yet</Prov>;
}
