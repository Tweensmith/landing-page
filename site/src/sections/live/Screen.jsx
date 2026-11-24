import { useEffect, useRef, useState } from "react";
import { Theme } from "../../../../components/_shared/theme.jsx";
import { Breadcrumbs } from "../../../../components/breadcrumbs/index.jsx";
import { SegmentedControl } from "../../../../components/segmented-control/index.jsx";
import { Stepper } from "../../../../components/stepper/index.jsx";
import { Select } from "../../../../components/select/index.jsx";
import { Switch } from "../../../../components/switch/index.jsx";
import { TextField } from "../../../../components/text-field/index.jsx";
import { Button } from "../../../../components/button/index.jsx";
import { NumberTicker } from "../../../../components/number-ticker/index.jsx";
import { Badge } from "../../../../components/badge/index.jsx";
import { AvatarGroup } from "../../../../components/avatar-group/index.jsx";
import { ToastStack, toast } from "../../../../components/toast-stack/index.jsx";

/*
 * The live section: one finished screen. A booking page for a photo studio, made only of free components, and
 * working: change the length, the people or the extras and the total rolls to its new value; confirm and the button
 * works, then a toast arrives in the top bar. Hovering a part names the component it is made of.
 *
 * The components imported here are the ones listed in lib/counts.js (SPECIMEN_SLUGS), which refuses to build if one
 * of them is not free. Keep the two in step. The studio, the prices and the people are made up; nothing here is a
 * claim about a customer.
 */
const LENGTHS = [
  { value: "half", label: "Half day", days: 1, price: 240 },
  { value: "full", label: "Full day", days: 1, price: 420 },
  { value: "two", label: "Two days", days: 2, price: 780 },
];
const STARTS = ["08:00", "09:00", "10:00", "13:00", "14:00"];
const INCLUDED = 4, PER_PERSON = 25, LIGHTING = 120, ASSISTANT = 180;
const money = (n) => "$" + n.toLocaleString("en-US");
const PEOPLE = [{ name: "Ines Duarte" }, { name: "Tomás Reyes" }, { name: "Kofi Mensah" }];

function Part({ name, className = "", children }) {
  return <div className={"scr__part" + (className ? " " + className : "")} data-part={name}>{children}</div>;
}

export function Screen({ mode, preset }) {
  const [length, setLength] = useState("full");
  const [people, setPeople] = useState(2);
  const [start, setStart] = useState("09:00");
  const [lighting, setLighting] = useState(true);
  const [assistant, setAssistant] = useState(false);
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState("idle");   // idle | loading | success
  const timers = useRef([]);
  useEffect(() => () => { timers.current.forEach(clearTimeout); toast.dismiss(); }, []);

  const plan = LENGTHS.find((l) => l.value === length);
  const more = Math.max(0, people - INCLUDED);
  // every line is always there, so the summary keeps its shape; a line that is not chosen shows a dash
  const lines = [
    ["Studio, " + plan.label.toLowerCase(), plan.price],
    [more ? `${more} more ${more === 1 ? "person" : "people"}` : `Up to ${INCLUDED} people`, more * PER_PERSON * plan.days],
    ["Lighting kit", lighting ? LIGHTING * plan.days : 0],
    ["Assistant on set", assistant ? ASSISTANT * plan.days : 0],
  ];
  const total = lines.reduce((sum, [, n]) => sum + n, 0);

  const confirm = () => {
    if (phase !== "idle") return;
    setPhase("loading");
    timers.current.push(setTimeout(() => {
      setPhase("success");
      toast({ id: "booked", title: "Pier 4 is booked", description: `${plan.label} from ${start}, ${people} ${people === 1 ? "person" : "people"}.`, tone: "success", duration: 5000 });
    }, 1100));
    timers.current.push(setTimeout(() => setPhase("idle"), 3000));
  };

  return (
    <Theme preset={preset} mode={mode} buttonShape="pill" className="scr">
      <div className="scr__bar">
        <Part name="Breadcrumbs" className="scr__crumbs">
          <Breadcrumbs width={360} onNavigate={(it, i, e) => e?.preventDefault?.()}
            items={[{ label: "Studios", href: "#specimens", icon: "home" }, { label: "Pier 4", href: "#specimens" }, { label: "Book" }]} />
        </Part>
        <Part name="Avatar Group">
          <AvatarGroup people={PEOPLE} size="sm" overlap={10} live={false} label="People on this booking" />
        </Part>
      </div>

      <div className="scr__body">
        <div className="scr__form">
          <div className="scr__title">
            <h3>Book Pier 4</h3>
            <Part name="Badge"><Badge tone="success" dot>Available</Badge></Part>
          </div>
          <Part name="Segmented Control">
            <SegmentedControl label="Length" fill name="length" value={length} onChange={(v) => setLength(v)} options={LENGTHS.map(({ value, label }) => ({ value, label }))} />
          </Part>
          <div className="scr__row">
            <Part name="Stepper"><Stepper label="People" name="people" min={1} max={8} value={people} onChange={(v) => setPeople(v)} /></Part>
            <Part name="Select" className="scr__grow"><Select label="Start" name="start" options={STARTS} value={start} onChange={(v) => v && setStart(v)} maxWidth={0} /></Part>
          </div>
          <Part name="Switch"><Switch label="Lighting kit" description="Two heads, stands and a softbox." name="lighting" checked={lighting} onChange={(on) => setLighting(!!on)} maxWidth={0} /></Part>
          <Part name="Switch"><Switch label="Assistant on set" description="Sets up, tethers and wraps." name="assistant" checked={assistant} onChange={(on) => setAssistant(!!on)} maxWidth={0} /></Part>
          <Part name="Text Field">
            <TextField label="Email for the receipt" name="receipt" autoComplete="off" value={email} showSuccess={false} maxWidth={0}
              onChange={(v) => setEmail(typeof v === "string" ? v : v?.target?.value ?? "")} />
          </Part>
        </div>

        <aside className="scr__sum" aria-label="Booking summary">
          <p className="scr__label">Total</p>
          <Part name="Number Ticker" className="scr__total">
            <NumberTicker value={total} format="currency" decimals={0} cue={false} label="Total" />
          </Part>
          <dl className="scr__lines">
            {lines.map(([label, n], i) => (<div key={i} data-off={n ? undefined : ""}><dt>{label}</dt><dd className="mono">{n ? money(n) : i === 1 ? "included" : "–"}</dd></div>))}
          </dl>
          <Part name="Button" className="scr__go">
            <Button label="Confirm booking" size="lg" fullWidth loading={phase === "loading"} success={phase === "success"} onClick={confirm} />
          </Part>
        </aside>
      </div>
      <div className="scr__toasts"><ToastStack position="top-center" max={1} /></div>
    </Theme>
  );
}
