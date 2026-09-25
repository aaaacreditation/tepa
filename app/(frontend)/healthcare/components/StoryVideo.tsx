"use client";

import Image from "next/image";
import { useState } from "react";
import { IconPlay } from "../../components/Icons";
import { story } from "../content";

/* The same facade /clinic uses for the same approved video. Nothing is
   requested from youtube.com until the visitor presses play: the embed pulls
   about a megabyte of script and drops its cookies on arrival, and the poster
   carries the section until someone has actually chosen to watch. */
export function StoryVideo() {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className="hc-video is-playing">
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
    <div className="hc-video">
      <button type="button" onClick={() => setPlaying(true)}>
        <Image
          src={story.poster}
          alt={story.posterAlt}
          fill
          sizes="(max-width: 1040px) 100vw, 620px"
        />
        <span className="hc-video-scrim" aria-hidden="true" />
        <span className="hc-video-play">
          <IconPlay />
        </span>
        <span className="hc-video-label">
          Play the story
          <small>{story.videoTitle}</small>
        </span>
      </button>
    </div>
  );
}
