"use client";

import Image from "next/image";
import { useState } from "react";
import { team } from "../content";

/* The card flips on hover for a mouse and on tap or Enter for everything else.
   The whole card is one button rather than a card with a button inside it: a
   face turned away is still focusable, so two controls would mean tabbing onto
   something invisible.
   Both faces stay in the document, so the biography reaches a screen reader
   whether or not the card has been turned; the copy repeated on the back is
   hidden from it so the card is not announced twice. */
export function TeamGrid() {
  const [flipped, setFlipped] = useState<string | null>(null);

  return (
    <ul className="hc-team-grid">
      {team.members.map((member, index) => {
        const isFlipped = flipped === member.name;
        return (
          <li
            key={member.name}
            className="reveal"
            style={{ transitionDelay: `${index * 60}ms` }}
          >
            <button
              type="button"
              className="hc-flip"
              data-flipped={isFlipped}
              aria-expanded={isFlipped}
              onClick={() => setFlipped(isFlipped ? null : member.name)}
            >
              <span className="hc-flip-inner">
                <span className="hc-flip-face hc-flip-front">
                  <span className="hc-portrait">
                    <Image
                      src={member.image}
                      alt=""
                      width={132}
                      height={132}
                      sizes="132px"
                    />
                  </span>
                  <span className="hc-flip-name">{member.name}</span>
                  <span className="hc-flip-role">{member.role}</span>
                  <span className="hc-flip-hint" aria-hidden="true">
                    {team.hint}
                  </span>
                </span>

                <span className="hc-flip-face hc-flip-back">
                  <span className="hc-flip-name" aria-hidden="true">
                    {member.name}
                  </span>
                  <span className="hc-flip-role" aria-hidden="true">
                    {member.role}
                  </span>
                  <span className="hc-flip-bio">{member.bio}</span>
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
