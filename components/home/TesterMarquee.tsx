import Image from "next/image";
import Link from "next/link";
import styles from "./TesterMarquee.module.css";

import { pilotCompanies as companies } from "@/lib/pilot-companies";


export function TesterMarquee() {
  return (
    <section className={styles.section} aria-labelledby="tester-companies-title">
      <div className={`container ${styles.heading}`}>
        <div className={styles.intro}>
          <span className={styles.eyebrow}>
            <span className={styles.dot} aria-hidden="true" />
            THE PILOT TESTER COMMUNITY
          </span>
          <h2 id="tester-companies-title">Real people from<br /><span>the world’s leading companies.</span></h2>
        </div>
        <div className={styles.aside}>
          <label className={styles.control}>
            <input className={styles.toggle} type="checkbox" />
            <span className={styles.srOnly}>Pause logo animation</span>
            <span className={styles.pause} aria-hidden="true">
              <svg viewBox="0 0 16 16" fill="currentColor"><rect x="4" y="3" width="2.5" height="10" rx=".75" /><rect x="9.5" y="3" width="2.5" height="10" rx=".75" /></svg>
              Pause
            </span>
            <span className={styles.play} aria-hidden="true">
              <svg viewBox="0 0 16 16" fill="currentColor"><path d="M5 3.5a.75.75 0 0 1 1.13-.65l7 4a.75.75 0 0 1 0 1.3l-7 4A.75.75 0 0 1 5 11.5v-8Z" /></svg>
              Play
            </span>
          </label>
        </div>
      </div>
      <div className={styles.viewport}>
        <div className={styles.track}>
          {[false, true].map((duplicate) => (
            <ul
              key={String(duplicate)}
              className={styles.logos}
              aria-label={duplicate ? undefined : "Companies our pilot customers come from"}
              aria-hidden={duplicate || undefined}
            >
              {companies.map((company) => (
                <li className={styles.logo} key={company.name}>
                  <Image
                    src={`/brand/testers/${company.file}`}
                    alt={duplicate ? "" : company.name}
                    width={company.width}
                    height={company.height}
                    unoptimized
                    loading="eager"
                    draggable={false}
                  />
                  {company.name === "CommBank" && (
                    <span className={styles.bankName} aria-hidden="true">CommBank</span>
                  )}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
      <p className={styles.invite}>Your experience has value. <Link href="/become-a-tester">Get paid to test <span aria-hidden="true">↗</span></Link></p>
    </section>
  );
}
