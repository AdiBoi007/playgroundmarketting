"use client";

import { useState } from "react";
import Link from "next/link";
import { Arrow, Eyebrow } from "@/components/ui/Primitives";

const routes = [
  {
    id: "launch", label: "Launch", title: "Take the next step.",
    description: "If pilot customers can use your product and find it useful, release it to a small group first.",
    example: "The invoice example needs a change first. Three people stopped before sending.",
    steps: ["Invite the pilot customers who tested it.", "Watch where new customers get stuck."],
  },
  {
    id: "change", label: "Make a change", title: "Keep the idea. Fix this part.",
    description: "If pilot customers get stuck, fix that part before you launch.",
    example: "Let people review before sending. Then check whether the change helps them finish.",
    steps: ["Let them check the invoice before it sends.", "Explain what access you need, and why."],
  },
  {
    id: "rethink", label: "Rethink it", title: "Find a better starting point.",
    description: "If pilot customers don’t need the product, check who it helps and what problem it solves before building more.",
    example: "The invoice example points to a smaller fix. It does not show that the whole idea needs replacing.",
    steps: ["Find out who needs the problem solved.", "Try a simpler idea before building more."],
  },
] as const;
type RouteId = (typeof routes)[number]["id"];

function ForkLandscape() {
  return (
    <svg className="crossroads-landscape" viewBox="0 0 760 421" fill="none" aria-hidden="true" focusable="false">
<g>
    <path d="M0 174c74-45 148-73 230-61 111 16 134 85 241 77 108-8 163-83 289-52v262H0V174Z" fill="#D0DE87"/>
    <path d="M0 255c127-44 209-35 286-18 82 19 149 18 234-2 73-18 144-24 240 4v161H0V255Z" fill="#A7C791"/>
    <path d="M0 320c121-38 219-18 311 4 107 25 177-37 271-35 66 2 118 21 178 24v87H0v-80Z" fill="#76AC75"/>
    <path d="M0 174c74-45 148-73 230-61m530 25c-53-13-94-8-138 9" stroke="#123B3F" strokeWidth="1.5" strokeOpacity=".2"/>
  </g>
  <g>
    <g fill="#F4E5C7" transform="translate(0 5)">
      <path d="M330 421c5-70-73-111-137-159-64-47-110-77-126-119l36-6c24 47 48 58 112 93 69 38 150 88 187 191h-72Z"/>
      <path d="M332 421c6-62 15-121 29-184 14-62 17-92 3-133l28-7c22 67 12 111-2 165-14 60 0 110 18 159h-76Z"/>
      <path d="M332 421c33-73 113-134 184-181 72-48 131-70 192-100l16 29c-61 24-117 44-171 90-64 44-127 91-145 162h-76Z"/>
    </g>
    <g fill="#FBF7EB">
      <path d="M330 421c5-70-73-111-137-159-64-47-110-77-126-119l36-6c24 47 48 58 112 93 69 38 150 88 187 191h-72Z"/>
      <path d="M332 421c6-62 15-121 29-184 14-62 17-92 3-133l28-7c22 67 12 111-2 165-14 60 0 110 18 159h-76Z"/>
      <path d="M332 421c33-73 113-134 184-181 72-48 131-70 192-100l16 29c-61 24-117 44-171 90-64 44-127 91-145 162h-76Z"/>
    </g>
    <g stroke="#123B3F" strokeWidth="1.5" strokeDasharray="7 10" strokeLinecap="round" strokeOpacity=".7">
      <path d="M367 421c-5-88-95-131-163-176-65-43-100-65-118-102"/>
      <path d="M369 349c-1-29 4-69 9-105 10-62 18-99 1-144"/>
      <path d="M395 350c36-40 90-73 141-107 66-45 124-67 179-88"/>
    </g>
  </g>
  <g stroke="#123B3F" strokeLinecap="round" strokeLinejoin="round">
    <g transform="translate(153 102)">
      <path d="M15 33v55m0-33L6 45m9 22 10-11" strokeWidth="1.8"/>
      <path d="M15 0C5 0 0 11 0 22c0 15 6 25 15 25s15-10 15-25C30 11 25 0 15 0Z" fill="#76AC75" strokeWidth="1.4"/>
      <path d="M15 8v35" strokeWidth="1.2" strokeOpacity=".3"/>
    </g>
    <g transform="translate(661 228)">
      <path d="M13 25v60m0-32L3 43m10 22 10-11" strokeWidth="1.8"/>
      <path d="M13 0 0 23h7L-4 43H6L0 57h27l-7-14h10L19 23h7L13 0Z" fill="#D0DE87" strokeWidth="1.4"/>
    </g>
  </g>
  <g stroke="#123B3F" strokeLinejoin="round" strokeLinecap="round">
    <ellipse cx="481" cy="332" rx="44" ry="6" fill="#123B3F" opacity=".13" stroke="none"/>
    <path d="M472 42h18v287h-18z" fill="#F4E5C7" strokeWidth="1.8"/>
    <path d="M485 43h5v285h-5z" fill="#123B3F" opacity=".13" stroke="none"/>
    <path d="M466 328h30" strokeWidth="2"/>
    <g>
      <path d="M476 42v-7h10v7" fill="#168EF9" strokeWidth="1.5"/>
      <circle cx="481" cy="25" r="11" fill="#FBF7EB" strokeWidth="1.5"/>
      <circle cx="481" cy="25" r="4" fill="#168EF9" stroke="none"/>
      <path d="M481 8V4m-17 9-3-3m37 3 3-3" strokeWidth="1.3"/>
    </g>
    <g className="crossroads-sign sign-launch">
      <path d="M317 62h194v46H317l-25-23 25-23Z" fill="#123B3F" stroke="none" opacity=".12"/>
      <path d="M317 57h194v46H317l-25-23 25-23Z" className="sign-face" fill="#76AC75" strokeWidth="1.8"/>
      <path d="M505 62v36" strokeWidth="1" strokeOpacity=".18"/>
      <circle cx="481" cy="80" r="2.2" fill="#123B3F" stroke="none"/>

    </g>
    <g className="crossroads-sign sign-change">
      <path d="M433 125h220l29 27-29 27H433v-54Z" fill="#123B3F" stroke="none" opacity=".14"/>
      <path d="M433 119h220l29 27-29 27H433v-54Z" className="sign-face" fill="#FF7548" strokeWidth="2"/>
      <path d="M439 125v42" strokeWidth="1" strokeOpacity=".18"/>
      <circle cx="450" cy="146" r="2.2" fill="#123B3F" stroke="none"/>

    </g>
    <g className="crossroads-sign sign-rethink">
      <path d="M342 191h169v44H342l-22-22 22-22Z" fill="#123B3F" stroke="none" opacity=".12"/>
      <path d="M342 186h169v44H342l-22-22 22-22Z" className="sign-face" fill="#CE7D67" strokeWidth="1.8"/>
      <path d="M505 191v34" strokeWidth="1" strokeOpacity=".18"/>
      <circle cx="481" cy="208" r="2.2" fill="#123B3F" stroke="none"/>

    </g>
  </g>
  <g stroke="#123B3F" strokeLinecap="round" strokeWidth="1.4">
    <path d="m117 325 3-9m4 12 6-6M245 345l3-7m4 10 5-5M582 359l3-9m4 12 6-6M48 374l3-8m4 10 6-5" strokeOpacity=".5"/>
    <path d="M525 323h9m18-5h5m-305-133h8m-21 9h4" strokeOpacity=".35"/>
    <path d="M553 365v-19m0 13-7-7m7 10 7-8"/>
    <path d="M553 337c-6 3-8 7-6 11 5 0 7-4 6-11Zm2 7c6 0 9 3 8 7-5 2-8-1-8-7Z" fill="#D0DE87" strokeWidth="1.2"/>
    <path d="M203 294c5-6 15-6 19 0h-19Z" fill="#F4E5C7" strokeWidth="1.1"/>
    <path d="M563 282c3-4 9-4 12 0h-12Z" fill="#F4E5C7" strokeWidth="1.1"/>
  </g>

    </svg>
  );
}

export function Crossroads() {
  const [selected, setSelected] = useState<RouteId>("change");
  const route = routes.find(item => item.id === selected)!;
  return (
    <section id="crossroads" className="crossroads-section" aria-labelledby="crossroads-title">
      <div className="container">
        <div className="crossroads-heading" data-reveal>
          <div><Eyebrow>AFTER CUSTOMER TESTING</Eyebrow><h2 id="crossroads-title">Know what to<br />do next.</h2></div>
          <p>Use feedback from pilot customers to decide:<br />launch, fix a problem, or rethink the idea.</p>
        </div>
        <div className="crossroads-layout">
          <div className="crossroads-world" data-path={selected} data-reveal>
            <div className="crossroads-scene">
              <ForkLandscape />
              <div className="crossroads-choices" role="group" aria-label="Explore the next move">
                {routes.map(item => <button key={item.id} type="button" className={`crossroads-choice choice-${item.id}`} aria-label={item.label} aria-pressed={selected === item.id} aria-controls="crossroads-detail" onClick={() => setSelected(item.id)}><span className="crossroads-full-label">{item.label}</span>{item.id === "change" && <span className="crossroads-short-label" aria-hidden="true">Change</span>}</button>)}
              </div>
            </div>
            <p className="crossroads-art-note">Choose a sign to explore your next step.</p>
          </div>
          <div className="crossroads-example" data-reveal>
            <div className="crossroads-card" data-path={selected}>
              <div className="crossroads-card-top"><span>AN INVOICING APP</span><span>EXAMPLE</span></div>
              <div className="crossroads-verdict-row">
                <span className="crossroads-stamp">{route.label}<Arrow /></span>
                <div className="crossroads-finding"><strong>2 of 5</strong><span>people sent an invoice.<br />Three stopped before sending.</span></div>
              </div>
              <div id="crossroads-detail" className="crossroads-detail" role="region" aria-label="What this path means" aria-live="polite" aria-atomic="true">
                <div className="crossroads-detail-intro"><h3>{route.title}</h3><p>{route.description}</p></div>
                <ol className="crossroads-next-steps">{route.steps.map((step, index) => <li key={step}><span aria-hidden="true">0{index + 1}</span><p>{step}</p></li>)}</ol>
                <p className="crossroads-example-reason">{route.example}</p>
              </div>
              <Link className="crossroads-report-link" href="/run-a-test">Plan a test for my product <Arrow /></Link>
            </div>
            <p className="crossroads-example-note">A made-up example, so you can see what you get back.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
