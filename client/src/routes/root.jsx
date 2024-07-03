import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import axios from "axios";
import PodcastCard from "../components/PodcastCard";

const Root = () => {
  const [podcasts, setPodcasts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPodcasts = async () => {
      try {
        const { data: podcastData } = await axios.get(
          "http://localhost:5000/spotify/podcasts",
          {
            withCredentials: true,
          }
        );

        setPodcasts(podcastData);
      } catch (err) {
        console.error("Error fetching podcasts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPodcasts();
  }, []);

  const handleSelectPodcast = async (podcastId) => {
    const updatedPodcasts = podcasts.map((podcast) =>
      podcast.id === podcastId
        ? {
            ...podcast,
            switchState: podcast.switchState === "ON" ? "OFF" : "ON",
          }
        : podcast
    );
    setPodcasts(updatedPodcasts);

    const updatedPodcast = updatedPodcasts.find(
      (podcast) => podcast.id === podcastId
    );

    try {
      await axios.post(
        "http://localhost:5000/spotify/podcasts",
        {
          podcastId: updatedPodcast.id,
          switchState: updatedPodcast.switchState,
        },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } catch (err) {
      console.error("Error updating podcast switch state:", err);
    }
  };

  return (
    <>
      <Navbar />
      {loading && <p>Loading...</p>}
      {!loading && (
        <div className="container mx-auto p-4 w-full flex-col">
          <h1 className="text-3xl font-bold text-center mb-8">Podcasts</h1>
          {podcasts.map((podcast) => (
            <PodcastCard
              key={podcast.id}
              podcast={podcast}
              isSelected={podcast.switchState === "ON"}
              onSelect={() => handleSelectPodcast(podcast.id)}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default Root;
