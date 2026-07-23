"use client";

import Image from "next/image";
import { useState } from "react";
import { site, why } from "../content";
import { IconPlay, Ornament } from "./Icons";

export function WhySection() {
  const [playing, setPlaying] = useState(false);

  return (
    <section id="why" className="bg-bone-200 py-24 lg:py-32">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="reveal mx-auto max-w-2xl text-center">
          <span className="eyebrow text-gold-500">{why.eyebrow}</span>
          <h2 className="display mt-4 text-[2.1rem] text-navy-800 sm:text-[2.6rem]">{why.title}</h2>
          <Ornament className="mx-auto mt-6 h-4 w-52 text-gold-400" />
          <p className="lede mt-6 text-[1.0625rem] leading-relaxed text-ink-500">{why.lede}</p>
        </div>

        <div className="reveal mx-auto mt-14 max-w-4xl lg:mt-16">
          <div className="frame-gold">
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-navy-900 shadow-[0_50px_90px_-50px_rgba(7,23,41,0.65)]">
              {playing ? (
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={`https://www.youtube-nocookie.com/embed/${site.videoId}?autoplay=1&rel=0&modestbranding=1`}
                  title={site.videoTitle}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setPlaying(true)}
                  className="video-facade group absolute inset-0 h-full w-full cursor-pointer"
                  aria-label={`Play video: ${site.videoTitle}`}
                >
                  <Image
                    src="/tepa/why-aaa-poster.jpg"
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 100vw, 56rem"
                    className="object-cover transition-transform duration-700 ease-out"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-navy-950/75 via-navy-950/15 to-navy-950/25"
                  />
                  <span className="play-badge absolute left-1/2 top-1/2 grid h-[4.5rem] w-[4.5rem] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-navy-800 shadow-2xl">
                    <IconPlay className="ml-0.5 h-7 w-7" />
                  </span>
                  <span className="absolute inset-x-0 bottom-0 p-6 text-left sm:p-8">
                    <span className="block text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-gold-300">
                      Provider Story
                    </span>
                    <span className="mt-2 block max-w-lg text-[0.9375rem] font-medium leading-snug text-white sm:text-base">
                      {site.videoTitle}
                    </span>
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
