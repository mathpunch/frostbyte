"use strict";

document.addEventListener("DOMContentLoaded", function() {
  const form = document.getElementById("uv-form");
  const address = document.getElementById("uv-address");
  const searchEngine = document.getElementById("uv-search-engine");
  const error = document.getElementById("uv-error");
  const errorCode = document.getElementById("uv-error-code");
  const frame = document.getElementById("uv-frame");
  const connection = new BareMux.BareMuxConnection("/baremux/worker.js");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const inputValue = address.value.trim();
    if (!inputValue) return;

    try {
      await registerSW();
    } catch (err) {
      error.textContent = "Failed to register service worker.";
      errorCode.textContent = err.toString();
      console.error(err);
      return;
    }

    const url = search(inputValue, "https://duckduckgo.com/?q=%s");
    frame.style.display = "block";

    const wispUrl = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/wisp/`;
    if (await connection.getTransport() !== "/epoxy/index.mjs") {
      await connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
    }

    frame.src = __uv$config.prefix + __uv$config.encodeUrl(url);
  });

  frame.addEventListener("load", () => {
    try {
      const doc = frame.contentDocument || frame.contentWindow.document;
      const links = doc.querySelectorAll("a[target='_blank']");
      links.forEach(link => link.target = "_self");
    } catch (err) {}
  });
});
