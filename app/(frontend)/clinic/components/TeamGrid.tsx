"use client";

import Image from "next/image";
import { useState } from "react";
import { team } from "../content";

/* The same flip card /healthcare uses, in this page's navy and gold.

   The card turns on hover for a mouse and on tap or Enter for everything else.
   The whole card is one button rather than a card with a button inside it: a
   face turned away is still focusable, so two controls would mean tabbing onto
   something invisible.

   Both faces stay in the document, so the biography reaches a screen reader
   whether or not the card has been turned; the copy repeated on the back is
   hidden from it so the card is not announced twice. */
export function TeamGrid() {
  const [flipped, setFlipped] = useState<string | null>(null);

  return (
    <ul className="cl-team-grid">
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
              className="cl-flip"
              data-flipped={isFlipped}
              aria-expanded={isFlipped}
              onClick={() => setFlipped(isFlipped ? null : member.name)}
            >
              <span className="cl-flip-inner">
                <span className="cl-flip-face cl-flip-front">
                  <span className="cl-portrait">
                    <Image
                      src={member.image}
                      alt=""
                      width={132}
                      height={132}
                      sizes="132px"
                    />
                  </span>
                  <span className="cl-flip-name">{member.name}</span>
                  <span className="cl-flip-role">{member.role}</span>
                  {/* Both hints ship; CSS picks the one that fits the card
                      at this width. */}
                  <span className="cl-flip-hint" aria-hidden="true">
                    <span className="cl-flip-hint-long">{team.hint}</span>
                    <span className="cl-flip-hint-short">{team.hintShort}</span>
                  </span>
                </span>

                <span className="cl-flip-face cl-flip-back">
                  <span className="cl-flip-name" aria-hidden="true">
                    {member.name}
                  </span>
                  <span className="cl-flip-role" aria-hidden="true">
                    {member.role}
                  </span>
                  <span className="cl-flip-bio">{member.bio}</span>
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
