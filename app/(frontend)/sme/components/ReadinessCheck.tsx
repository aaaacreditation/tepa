"use client";

import { useState } from "react";
import { IconArrow } from "../../components/Icons";
import { readiness, site } from "../content";
import { setReadinessResult } from "./readiness-store";

/* The six-step business readiness check, ported from the website's SME page
   (ReadinessCheck.tsx there). Nothing is sent anywhere: the score stays in the
   browser, and only travels if the visitor then applies (see readiness-store).

   It opens straight on the first step — the launcher's button is the "start"
   click, so the website version's intro screen would be a second one. */

const CATS = readiness.categories;
const TOTAL_Q = CATS.length * 2;
const MAX_SCORE = TOTAL_Q * 2;
const LAST_PAGE = CATS.length - 1;

type View = "wizard" | "result";

function levelFor(pct: number): string {
  return readiness.levels.find((level) => pct >= level.min)?.name ?? readiness.levels[readiness.levels.length - 1].name;
}

export function ReadinessCheck() {
  const [view, setView] = useState<View>("wizard");
  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const answeredCount = Object.keys(answers).length;
  const pageAnswered = answers[`${page}-0`] !== undefined && answers[`${page}-1`] !== undefined;

  const total = Object.values(answers).reduce((sum, value) => sum + value, 0);
  const pct = Math.round((total / MAX_SCORE) * 100);
  const level = levelFor(pct);

  function select(key: string, value: number) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }
  function next() {
    if (!pageAnswered) return;
    if (page < LAST_PAGE) {
      setPage(page + 1);
    } else {
      setView("result");
      setReadinessResult({ score: pct, level });
    }
  }
  function back() {
    if (page > 0) setPage(page - 1);
  }
  function retake() {
    setAnswers({});
    setPage(0);
    setView("wizard");
    setReadinessResult(null);
  }

  const strengths: string[] = [];
  const gaps: string[] = [];
  CATS.forEach((c, i) => {
    const score = (answers[`${i}-0`] || 0) + (answers[`${i}-1`] || 0);
    if (score >= 3) strengths.push(c.cat);
    else gaps.push(c.cat);
  });

  return (
    <div className="smerc-card">
      {view === "wizard" && (
        <div className="smerc-wizard">
          <div className="smerc-bar">
            <div className="smerc-bar-fill" style={{ width: `${(page / CATS.length) * 100}%` }} />
          </div>
          <div className="smerc-step">
            Step {page + 1} of {CATS.length}
          </div>
          <div className="smerc-cat">{CATS[page].cat}</div>

          {CATS[page].qs.map((q, qi) => {
            const key = `${page}-${qi}`;
            return (
              <div className="smerc-q" key={key}>
                <div className="smerc-qtext">{q}</div>
                <div className="smerc-opts">
                  {readiness.options.map((o) => (
                    <button
                      type="button"
                      key={o.label}
                      className={"smerc-opt" + (answers[key] === o.value ? " sel" : "")}
                      aria-pressed={answers[key] === o.value}
                      onClick={() => select(key, o.value)}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="smerc-nav">
            <button type="button" className="btn btn-ghost" onClick={back} disabled={page === 0}>
              Back
            </button>
            <span className="smerc-progress">
              {answeredCount} of {TOTAL_Q} answered
            </span>
            <button type="button" className="btn btn-primary" onClick={next} disabled={!pageAnswered}>
              {page === LAST_PAGE ? "See my result" : "Next"} <IconArrow className="arrow" />
            </button>
          </div>
        </div>
      )}

      {view === "result" && (
        <div className="smerc-result">
          <div className="smerc-congrats">
            <strong>{readiness.congrats}</strong>
            <p>{readiness.congratsText}</p>
          </div>

          <div className="smerc-top">
            <div
              className="smerc-ring"
              style={{ background: `conic-gradient(var(--aaa-blue) ${pct}%, var(--ink-200) ${pct}%)` }}
            >
              <div className="smerc-ring-inner">
                <span className="smerc-pct">{pct}%</span>
                <span className="smerc-rlbl">Your score</span>
              </div>
            </div>
            <div className="smerc-band">
              <span className="smerc-band-name">{level}</span>
              <span className="smerc-band-sub">{readiness.bandText}</span>
            </div>
          </div>

          <div className="smerc-cols">
            <div className="smerc-col ok">
              <h4>Your strengths</h4>
              <ul>
                {strengths.length ? (
                  strengths.map((s) => <li key={s}>{s}</li>)
                ) : (
                  <li>Build a strength in any area to see it here.</li>
                )}
              </ul>
            </div>
            <div className="smerc-col gap">
              <h4>Focus areas</h4>
              <ul>
                {gaps.length ? gaps.map((s) => <li key={s}>{s}</li>) : <li>No gaps flagged. You look funding-ready.</li>}
              </ul>
            </div>
          </div>

          <div className="smerc-cta">
            <a href="#apply" className="btn btn-primary">
              {readiness.apply} <IconArrow className="arrow" />
            </a>
            <a href={site.calendly} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
              {readiness.talk}
            </a>
            <button type="button" className="btn btn-ghost" onClick={retake}>
              {readiness.retake}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
