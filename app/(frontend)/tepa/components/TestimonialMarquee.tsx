"use client";

import { useState } from "react";
import Image from "next/image";
import type { CSSProperties } from "react";

type Testimonial = {
  readonly organization: string;
  readonly location: string;
  readonly sector: string;
  readonly quote: string;
  readonly logo: string;
  readonly photo: string;
  readonly photoAlt: string;
  readonly photoPosition: string;
};

type TestimonialMarqueeProps = {
  readonly stories: readonly Testimonial[];
};

function TestimonialCard({ story }: { readonly story: Testimonial }) {
  return (
    <blockquote className="story-card">
      <div className="story-media">
        <Image
          src={story.photo}
          alt={story.photoAlt}
          fill
          sizes="(max-width: 520px) 80vw, (max-width: 900px) 320px, 400px"
          style={{ objectPosition: story.photoPosition }}
        />
      </div>
      <span className="quote-mark" aria-hidden="true">
        “
      </span>
      <p>{story.quote}</p>
      <footer>
        <span className="story-logo" aria-hidden="true">
          <Image src={story.logo} alt="" fill sizes="70px" />
        </span>
        <span className="story-attribution">
          <strong>{story.organization}</strong>
          <span className="story-meta">
            <span>{story.location}</span>
            <span>{story.sector}</span>
          </span>
        </span>
      </footer>
    </blockquote>
  );
}

export function TestimonialMarquee({ stories }: TestimonialMarqueeProps) {
  const [paused, setPaused] = useState(false);

  return (
    <section
      id="testimonials"
      className="story-marquee reveal"
      aria-label="Accredited provider testimonials"
      aria-roledescription="carousel"
      style={{ "--story-count": stories.length } as CSSProperties}
    >
      <div className="story-marquee-bar">
        <p>
          <span>Provider stories</span>
          <strong>Accreditation in their words</strong>
        </p>
        <button
          type="button"
          className="story-toggle"
          aria-controls="testimonial-track"
          aria-pressed={paused}
          onClick={() => setPaused((current) => !current)}
        >
          <span aria-hidden="true">{paused ? "▶" : "Ⅱ"}</span>
          {paused ? "Play stories" : "Pause stories"}
        </button>
      </div>

      <div className="story-viewport" tabIndex={0}>
        <div
          id="testimonial-track"
          className="story-track"
          data-paused={paused}
          aria-live="off"
        >
          <ul className="story-set">
            {stories.map((story) => (
              <li key={story.organization}>
                <TestimonialCard story={story} />
              </li>
            ))}
          </ul>
          <ul className="story-set story-set--clone" aria-hidden="true">
            {stories.map((story) => (
              <li key={`clone-${story.organization}`}>
                <TestimonialCard story={story} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
