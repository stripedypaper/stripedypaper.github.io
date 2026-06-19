(function () {
  const config = window.TRICKCAL_CONFIG || {};
  const apiBaseUrl = (config.apiBaseUrl || "").replace(/\/$/, "");

  const loading = document.getElementById("loading");
  const signedOut = document.getElementById("signed-out");
  const signedIn = document.getElementById("signed-in");
  const loginLink = document.getElementById("login-link");
  const logoutButton = document.getElementById("logout-button");
  const userAvatar = document.getElementById("user-avatar");
  const userName = document.getElementById("user-name");
  const userId = document.getElementById("user-id");
  const message = document.getElementById("message");

  function show(view) {
    loading.hidden = view !== "loading";
    signedOut.hidden = view !== "signed-out";
    signedIn.hidden = view !== "signed-in";
  }

  function setMessage(text) {
    message.textContent = text || "";
  }

  function avatarUrl(user) {
    if (!user.avatar) {
      return "https://cdn.discordapp.com/embed/avatars/0.png";
    }

    const extension = user.avatar.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${extension}?size=128`;
  }

  function displayUser(user) {
    userAvatar.src = avatarUrl(user);
    userAvatar.alt = `${user.global_name || user.username}'s Discord avatar`;
    userName.textContent = user.global_name || user.username;
    userId.textContent = `@${user.username} · ${user.id}`;
    show("signed-in");
  }

  async function loadSession() {
    if (!apiBaseUrl) {
      loginLink.href = "#";
      setMessage("Set apiBaseUrl in config.js after deploying the AWS backend.");
      show("signed-out");
      return;
    }

    const returnTo = new URL(window.location.href);
    returnTo.search = "";
    returnTo.hash = "";
    loginLink.href = `${apiBaseUrl}/auth/start?return_to=${encodeURIComponent(returnTo.href)}`;
    show("loading");
    setMessage("");

    try {
      const response = await fetch(`${apiBaseUrl}/auth/me`, {
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error(`Session check failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.user) {
        displayUser(data.user);
      } else {
        show("signed-out");
      }
    } catch (error) {
      show("signed-out");
      setMessage(error.message);
    }
  }

  logoutButton.addEventListener("click", async () => {
    if (!apiBaseUrl) {
      return;
    }

    logoutButton.disabled = true;
    setMessage("");

    try {
      await fetch(`${apiBaseUrl}/auth/logout`, {
        method: "POST",
        credentials: "include"
      });
      show("signed-out");
    } catch (error) {
      setMessage(error.message);
    } finally {
      logoutButton.disabled = false;
    }
  });

  loadSession();
})();
