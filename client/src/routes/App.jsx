import React from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

const App = () => {
  const handleYoutubeLogin = () => {
    window.location.href = "http://localhost:5001/auth/google";
  };

  const handleSpotifyLogin = () => {
    window.location.href = "http://localhost:5001/auth/spotify";
  };

  const handleFetchPodcasts = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5001/spotify/podcasts",
        {
          withCredentials: true,
        }
      );

      console.log(response.data.items[0].show);
    } catch (err) {
      console.error("Error fetching podcasts:", err);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
          <div>
            <button
              onClick={handleYoutubeLogin}
              className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 transition-colors mb-2"
            >
              Login to YouTube
            </button>
            <button
              onClick={handleSpotifyLogin}
              className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition-colors mb-2"
            >
              Login to Spotify
            </button>
            <button
              onClick={handleFetchPodcasts}
              className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition-colors"
            >
              Fetch Podcasts
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default App;
