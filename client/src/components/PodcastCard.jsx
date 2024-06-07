import React, { useState } from "react";
import axios from "axios";

const PodcastCard = ({ podcast }) => {
  const [isSelected, setIsSelected] = useState(true);

  const toggleSelect = () => {
    setIsSelected(!isSelected);
  };

  const handleFetchEpisodes = async (id) => {
    try {
      console.log("Fetching episodes with id: ", id);

      const response = await axios.post(
        "http://localhost:5000/spotify/podcasts/shows",
        { id },
        {
          withCredentials: true,
        }
      );
    } catch (err) {
      console.error("Error fetching episodes:", err);
    }
  };

  return (
    <div className="max-w-sm rounded overflow-hidden shadow-lg m-4 bg-white">
      <img
        className="w-16 h-16 mx-auto mt-4"
        src={podcast.images[2].url}
        alt={podcast.name}
      />
      <div className="px-6 py-4">
        <div className="font-bold text-xl mb-2">{podcast.name}</div>
        <p className="text-gray-700 text-base">{podcast.publisher}</p>
      </div>
      <div className="px-6 py-4">
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            className="form-checkbox"
            checked={isSelected}
            onChange={toggleSelect}
          />
          <span>Select</span>
        </label>
      </div>
      <button
        onClick={() => handleFetchEpisodes(podcast.id)}
        className="bg-green-500 text-white p-2 m-3 rounded hover:bg-green-600 transition-colors"
      >
        Fetch episodes
      </button>
    </div>
  );
};

export default PodcastCard;
