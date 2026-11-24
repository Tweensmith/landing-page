import { useEffect, useRef, useState } from "react";
import { TextField } from "../../../../components/text-field/index.jsx";
import { Button } from "../../../../components/button/index.jsx";
import { waitlist } from "../../links.js";
import { proSoon } from "../../copy.jsx";

/**
 * The waitlist, as the page may use it. `open` is false until a service takes addresses (src/links.js: `waitlist`
 * with `live` and an `endpoint`); the page then shows "Not live yet" and no field. Once it is live, `send` posts
 * the address to the endpoint as JSON and reports what happened. It has never run against a real service, because
 * none exists yet; it was run once against a local address (2026-11-23) to see both outcomes.
 */
export function useWaitlist() {
  const [state, setState] = useState("idle");          // idle | sending | done | error
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const open = !!(waitlist.live && waitlist.endpoint);
  const send = async (email) => {
    if (!open) return;
    setState("sending");
    let ok = false;
    try { ok = (await fetch(waitlist.endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) })).ok; }
    catch { ok = false; }
    if (alive.current) setState(ok ? "done" : "error");
  };
  return { open, state, send };
}

/** The email field and its key (the kit's Text Field and Button), both fully round. The key goes through its own loading and done states. */
export function WaitForm({ w, autoFocus = false, className = "" }) {
  const [email, setEmail] = useState("");
  const submit = (e) => {
    e.preventDefault();
    if (w.state === "sending" || w.state === "done") return;
    if (!e.currentTarget.checkValidity()) { e.currentTarget.reportValidity(); return; }
    w.send(email);
  };
  return (
    <form className={"pwform" + (className ? " " + className : "")} onSubmit={submit}>
      <TextField label={proSoon.label} name="email" type="email" autoComplete="email" required value={email} onChange={setEmail}
        showSuccess={false} maxWidth={0} readOnly={w.state === "done"} autoFocus={autoFocus} />
      <Button type="submit" variant="secondary" label={proSoon.cta} loading={w.state === "sending"} success={w.state === "done"} />
      <p className="pwform__say" role="status" aria-live="polite">{w.state === "done" ? proSoon.done : w.state === "error" ? proSoon.failed : ""}</p>
    </form>
  );
}
