"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Image from "next/image";

/* The client asked for a carousel here rather than the continuous marquee
   /tepa uses. It is a separate component on purpose: TestimonialMarquee is
   shared with /tepa, and changing it would change that page too.

   One story at a time, advanced by the arrows, the dots, arrow keys or a
   swipe. It auto-advances so a visitor who never touches it still sees all
   three, and stops on hover, on focus, when the tab is hidden and whenever
   the visitor takes control — an auto-advance that fights the reader is
   worse than none. */

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

type TestimonialCarouselProps = {
  readonly stories: readonly Testimonial[];
  readonly kicker: string;
  readonly title: string;
};

const ADVANCE_MS = 7000;
const SWIPE_THRESHOLD = 40;

export function TestimonialCarousel({ stories, kicker, title }: TestimonialCarouselProps) {
  const count = stories.length;
  const [index, setIndex] = useState(0);
  /* Set once the visitor drives it themselves; never unset. */
  const [taken, setTaken] = useState(false);
  const [resting, setResting] = useState(false);
  const trackId = useId();
  const touchStart = useRef<number | null>(null);

  const goTo = useCallback(
    (next: number) => {
      setTaken(true);
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (taken || resting || count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      /* A carousel advancing in a background tab is wasted motion, and the
         visitor returns to a slide they never saw start. */
      if (!document.hidden) setIndex((current) => (current + 1) % count);
    }, ADVANCE_MS);

    return () => window.clearInterval(timer);
  }, [taken, resting, count]);

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(index + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(index - 1);
    }
  }

  function onTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    const start = touchStart.current;
    touchStart.current = null;
    if (start === null) return;
    const delta = start - event.changedTouches[0].clientX;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    goTo(index + (delta > 0 ? 1 : -1));
  }

  return (
    <section
      className="ft-stories reveal"
      aria-roledescription="carousel"
      aria-label="Accredited provider testimonials"
      onMouseEnter={() => setResting(true)}
      onMouseLeave={() => setResting(false)}
      onFocusCapture={() => setResting(true)}
      onBlurCapture={() => setResting(false)}
    >
      <div className="ft-stories-bar">
        <p>
          <span>{kicker}</span>
          <strong>{title}</strong>
        </p>

        <div className="ft-stories-nav">
          <button
            type="button"
            className="ft-stories-arrow"
            aria-controls={trackId}
            aria-label="Previous story"
            onClick={() => goTo(index - 1)}
          >
            <span aria-hidden="true">‹</span>
          </button>
          <span className="ft-stories-count" aria-hidden="true">
            {index + 1} / {count}
          </span>
          <button
            type="button"
            className="ft-stories-arrow"
            aria-controls={trackId}
            aria-label="Next story"
            onClick={() => goTo(index + 1)}
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </div>

      <div
        className="ft-stories-viewport"
        tabIndex={0}
        role="group"
        aria-label={`Story ${index + 1} of ${count}`}
        onKeyDown={onKeyDown}
        onTouchStart={(event) => {
          touchStart.current = event.touches[0].clientX;
        }}
        onTouchEnd={onTouchEnd}
      >
        <ul
          id={trackId}
          className="ft-stories-track"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {stories.map((story, position) => (
            <li
              key={story.organization}
              className="ft-stories-slide"
              aria-hidden={position !== index}
              /* Off-screen slides stay in the DOM for the slide animation, so
                 their links and buttons have to leave the tab order. */
              inert={position !== index ? true : undefined}
            >
              <blockquote className="story-card">
                <div className="story-media">
                  <Image
                    src={story.photo}
                    alt={story.photoAlt}
                    fill
                    sizes="(max-width: 900px) 100vw, 420px"
                    style={{ objectPosition: story.photoPosition }}
                  />
                </div>
                <div className="ft-stories-body">
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
                </div>
              </blockquote>
            </li>
          ))}
        </ul>
      </div>

      <ul className="ft-stories-dots">
        {stories.map((story, position) => (
          <li key={story.organization}>
            <button
              type="button"
              className="ft-stories-dot"
              aria-controls={trackId}
              aria-current={position === index}
              aria-label={`Show ${story.organization}`}
              data-active={position === index}
              onClick={() => goTo(position)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
