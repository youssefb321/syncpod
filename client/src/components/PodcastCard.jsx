import React, { useState } from "react";
// import axios from "axios";

const PodcastCard = ({ podcast, isSelected, onSelect }) => {
  // const [isSelected, setIsSelected] = useState(false);

  const handleChange = () => {
    onSelect(podcast.id);
  };

  // const fetchEpisodes = async (id) => {
  //   try {
  //     console.log("Fetching episodes with id: ", id);

  //     const response = await axios.post(
  //       "http://localhost:5000/spotify/podcasts/shows",
  //       { id },
  //       {
  //         withCredentials: true,
  //       }
  //     );

  //     console.log(response);
  //   } catch (err) {
  //     console.error("Error fetching episodes:", err);
  //   }
  // };

  // const toggleSelect = () => {
  //   setIsSelected((prevSelected) => {
  //     const newSelected = !prevSelected;
  //     if (newSelected) {
  //       fetchEpisodes(podcast.id);
  //     }

  //     return newSelected;
  //   });
  // };

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
            onChange={handleChange}
          />
          <span>Select</span>
        </label>
      </div>
    </div>
  );
};

export default PodcastCard;
