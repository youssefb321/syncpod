import React from "react";
import Switch from "./Switch";

const PodcastCard = ({ podcast, isSelected, onSelect }) => {
  const handleChange = () => {
    onSelect(podcast.id);
  };

  return (
    <div className="max-w-sm rounded overflow-hidden shadow-lg m-4 bg-white">
      <img
        className="w-16 h-16 mx-auto mt-4"
        src={podcast.image}
        alt={podcast.name}
      />
      <div className="px-6 py-4">
        <div className="font-bold text-xl mb-2">{podcast.name}</div>
        <p className="text-gray-700 text-base">{podcast.publisher}</p>
      </div>
      <div className="px-6 py-4">
        <label className="inline-flex items-center">
          <Switch isOn={isSelected} onToggle={handleChange} />
        </label>
      </div>
    </div>
  );
};

export default PodcastCard;
