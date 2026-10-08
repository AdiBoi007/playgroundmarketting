"use client";
import { useState } from "react";
import Link from "next/link";
import { Arrow } from "@/components/ui/Primitives";
import { track } from "@/lib/analytics";
import { useCases } from "@/lib/demo";
export function UseCases() {
  const [active, setActive] = useState(0);
  const selected = useCases[active];
  return (
    <div className="question-picker" data-reveal>
      <div className="question-picker-options" aria-label="Choose a product question">{useCases.map((item, index) => <button key={item.title} aria-pressed={active === index} onClick={() => { setActive(index); track("use_case_open", { use_case: item.title }); }}><span>0{index + 1}</span><span>{item.title}</span><Arrow /></button>)}</div>
      <div className="question-picker-answer" key={selected.title}><span className="example-tag">EXAMPLE TEST</span><h3>{selected.question}</h3><p>{selected.description}</p><div className="question-picker-task"><span>WHAT WE CHECK</span><p>{selected.mission}</p></div><Link href={`/run-a-test?focus=${encodeURIComponent(selected.title)}`} className="text-link">Ask this about your product <Arrow /></Link></div>
    </div>
  );
}
