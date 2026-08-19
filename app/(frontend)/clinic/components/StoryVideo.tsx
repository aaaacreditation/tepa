"use client";

import Image from "next/image";
import { useState } from "react";
import { IconPlay } from "../icons";
import { story } from "../content";

/* A facade rather than a bare iframe. YouTube's embed pulls roughly a megabyte
   of script before anyone has decided to watch anything, and it drops its
   cookies on arrival; here nothing at all is requested from youtube.com until
   the visitor presses play, and the poster carries the section's weight in the
   meantime. nocookie plus autoplay-on-click keeps the behaviour identical to
   the approved embed from the visitor's side. */
export function StoryVideo() {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className="cl-video is-playing">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${story.videoId}?rel=0&autoplay=1`}
          title={story.videoTitle}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="cl-video">
      <button type="button" onClick={() => setPlaying(true)}>
        <Image
          src={story.poster}
          alt={story.posterAlt}
          fill
          sizes="(max-width: 1040px) 100vw, 620px"
        />
        <span className="cl-video-scrim" aria-hidden="true" />
        <span className="cl-video-play">
          <IconPlay />
        </span>
        <span className="cl-video-label">
          Play the story
          <small>{story.videoTitle}</small>
        </span>
      </button>
    </div>
  );
}
