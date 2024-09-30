chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "updateTimestamp") {
    // Send the updated timestamp to your backend
    fetch("http://localhost:3000/api/updateTimestamp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        videoId: message.videoId,
        currentTime: message.currentTime,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Timestamp updated successfully:", data);
      })
      .catch((err) => {
        console.error("Error updating timestamp:", err);
      });
  }
});
