document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";
        activityCard.style.marginBottom = "1.5em";
        activityCard.style.padding = "1em";
        activityCard.style.border = "1px solid #e0e0e0";
        activityCard.style.borderRadius = "8px";
        activityCard.style.background = "#fafbff";

        const spotsLeft = details.max_participants - details.participants.length;

        // Participants section
        let participantsHTML = "";
        if (details.participants.length > 0) {
          participantsHTML = `
            <div class="participants-section" style="margin-top: 0.75em;">
              <strong>Participants:</strong>
              <ul class="participants-list" style="margin: 0.5em 0 0 1.2em; padding: 0; list-style: none;">
                ${details.participants.map(email => `
                  <li style="margin-bottom: 0.2em; display: flex; align-items: center;">
                    <span>${email}</span>
                    <button class="delete-participant-btn" title="Remove participant" data-activity="${name}" data-email="${email}" style="background: none; border: none; color: #c00; margin-left: 0.5em; cursor: pointer; font-size: 1em;">🗑️</button>
                  </li>
                `).join("")}
              </ul>
            </div>
          `;
        } else {
          participantsHTML = `
            <div class="participants-section" style="margin-top: 0.75em;">
              <strong>Participants:</strong>
              <span style="color: #888;">No participants yet</span>
            </div>
          `;
        }

        activityCard.innerHTML = `
          <h4 style="margin-bottom: 0.2em;">${name}</h4>
          <p style="margin: 0.2em 0 0.5em 0; color: #444;">${details.description}</p>
          <p style="margin: 0.2em 0;"><strong>Schedule:</strong> ${details.schedule}</p>
          <p style="margin: 0.2em 0;"><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities(); // Refresh activities list so UI updates
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
  // Handle participant delete (event delegation)
  activitiesList.addEventListener("click", async (event) => {
    if (event.target.classList.contains("delete-participant-btn")) {
      const activity = event.target.getAttribute("data-activity");
      const email = event.target.getAttribute("data-email");
      if (confirm(`Remove ${email} from ${activity}?`)) {
        try {
          const response = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, {
            method: "POST"
          });
          const result = await response.json();
          if (response.ok) {
            fetchActivities();
          } else {
            alert(result.detail || "Failed to remove participant.");
          }
        } catch (error) {
          alert("Error removing participant.");
        }
      }
    }
  });
});
