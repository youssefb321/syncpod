import React from "react";
import PodcastCard from "./PodcastCard";

const PodcastList = ({ podcasts }) => {
  return (
    <div className="flex flex-wrap justify-center">
      {podcasts.map((podcast) => (
        <PodcastCard key={podcast.id} podcast={podcast} />
      ))}
    </div>
  );
};

export default PodcastList;
