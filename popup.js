// Fetch the latest podcast's YouTube URL with timestamp
document.addEventListener("DOMContentLoaded", async () => {
  // Fetch the most recent podcast with timestamp (from your backend or local storage)
  const latestPodcast = await fetchLatestPodcast();
  document.getElementById("latestPodcastLink").href = latestPodcast.url;
  document.getElementById(
    "latestPodcastLink"
  ).innerText = `Watch on YouTube: ${latestPodcast.title}`;

  // Fetch list of followed podcasts
  const podcasts = await fetchUserPodcasts();
  displayPodcasts(podcasts);
});

// Fetch the latest podcast from the backend
async function fetchLatestPodcast() {
  // Example: Fetch from your backend
  const response = await fetch("http://localhost:3000/api/latestPodcast");
  return await response.json();
}

// Fetch followed podcasts from the backend
async function fetchUserPodcasts() {
  // Example: Fetch podcasts from backend
  const response = await fetch("http://localhost:3000/api/followedPodcasts");
  return await response.json();
}

// Display the list of podcasts in the popup
function displayPodcasts(podcasts) {
  const podcastListDiv = document.getElementById("podcastList");

  podcasts.forEach((podcast) => {
    const dropdownDiv = document.createElement("div");
    dropdownDiv.classList.add("dropdown");

    const button = document.createElement("button");
    button.innerText = podcast.name;
    button.onclick = () => toggleDropdown(podcast.id);

    const dropdownContent = document.createElement("div");
    dropdownContent.id = `dropdown-${podcast.id}`;
    dropdownContent.style.display = "none";

    // Fetch the 5 most recent episodes and display them
    fetchRecentEpisodes(podcast.id).then((episodes) => {
      episodes.forEach((episode) => {
        const episodeLink = document.createElement("a");
        episodeLink.href = episode.url;
        episodeLink.innerText = episode.title;
        episodeLink.target = "_blank";
        dropdownContent.appendChild(episodeLink);
        dropdownContent.appendChild(document.createElement("br"));
      });
    });

    dropdownDiv.appendChild(button);
    dropdownDiv.appendChild(dropdownContent);
    podcastListDiv.appendChild(dropdownDiv);
  });
}

function toggleDropdown(podcastId) {
  const dropdown = document.getElementById(`dropdown-${podcastId}`);
  dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
}

// Fetch recent episodes from backend
async function fetchRecentEpisodes(podcastId) {
  const response = await fetch(
    `http://localhost:3000/api/podcasts/${podcastId}/episodes`
  );
  return await response.json();
}
