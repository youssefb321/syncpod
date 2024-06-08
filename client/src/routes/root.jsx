import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import PodcastList from "../components/PodcastList";
import axios from "axios";
import PodcastCard from "../components/PodcastCard";

const Root = () => {
  const [podcasts, setPodcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPodcasts, setSelectedPodcasts] = useState([]);

  useEffect(() => {
    const fetchPodcasts = async () => {
      try {
        const { data } = await axios.get(
          "http://localhost:5000/spotify/podcasts",
          {
            withCredentials: true,
          }
        );

        const shows = data.items.map((item) => item.show);
        setPodcasts(shows);
      } catch (err) {
        console.error("Error fetching podcasts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPodcasts();
  }, []);

  const handleSelectPodcast = (podcastId) => {
    setSelectedPodcasts((prevSelected) => {
      if (prevSelected.includes(podcastId)) {
        return prevSelected.filter((id) => id !== podcastId);
      } else {
        return [...prevSelected, podcastId];
      }
    });
  };

  const saveSelectedPodcasts = async () => {
    console.log("Selected podcasts: ", selectedPodcasts);
    const podcastData = podcasts
      .filter((podcast) => selectedPodcasts.includes(podcast.id))
      .map((podcast) => ({
        showId: podcast.id,
        showName: podcast.name,
      }));

    console.log("Data to be saved: ", podcastData);

    try {
      const response = await axios.post(
        "http://localhost:5000/spotify/podcasts",
        podcastData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Server response: ", response.data);
      alert("Selected podcasts saved successfully");
    } catch (err) {
      console.error("Error saving podcasts:", err);
    }
  };

  return (
    <>
      <Navbar />
      {loading && <p>loading...</p>}
      {!loading && (
        <div className="container mx-auto p-4">
          <h1 className="text-3xl font-bold text-center mb-8">Podcasts</h1>
          {podcasts.map((podcast) => (
            <PodcastCard
              key={podcast.id}
              podcast={podcast}
              isSelected={selectedPodcasts.includes(podcast.id)}
              onSelect={handleSelectPodcast}
            />
          ))}
          <button
            className="p-2 rounded bg-green-500 text-white hover:bg-green-600 transition-colors"
            onClick={saveSelectedPodcasts}
          >
            Save Selected Podcasts
          </button>
        </div>
      )}
    </>
  );
};

export default Root;
