import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import PodcastList from "../components/PodcastList";
import axios from "axios";

const Root = () => {
  const [podcasts, setPodcasts] = useState([]);
  const [loading, setLoading] = useState(true);
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold text-center mb-8">Podcasts</h1>
        <PodcastList podcasts={podcasts} />
      </div>
    </>
  );
};

export default Root;
