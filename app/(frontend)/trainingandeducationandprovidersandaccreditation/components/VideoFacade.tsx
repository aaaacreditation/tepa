"use client";

import Image from "next/image";
import { useState } from "react";
import { IconPlay } from "../../tepa/components/Icons";

type VideoFacadeProps = {
  videoId: string;
  title: string;
  label: string;
};

/* A poster until the visitor asks for the video, so YouTube's player and its
   cookies load only for someone who presses play. */
export function VideoFacade({ videoId, title, label }: VideoFacadeProps) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="ft-video">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          className="ft-video-facade"
          onClick={() => setPlaying(true)}
          aria-label={`Play video: ${title}`}
        >
          <Image
            src="/tepa/why-aaa-poster.jpg"
            alt=""
            fill
            sizes="(max-width: 900px) 100vw, 640px"
            className="cover-image"
          />
          <span className="ft-video-play" aria-hidden="true">
            <IconPlay />
          </span>
          <span className="ft-video-caption">
            <span>{label}</span>
            {title}
          </span>
        </button>
      )}
    </div>
  );
}
