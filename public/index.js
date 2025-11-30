"use strict";
document.addEventListener("DOMContentLoaded", function() {
  const form = document.getElementById("uv-form");
  const address = document.getElementById("uv-address");
  const searchEngine = document.getElementById("uv-search-engine");
  const error = document.getElementById("uv-error");
  const errorCode = document.getElementById("uv-error-code");
  const frame = document.getElementById("uv-frame");
  const connection = new BareMux.BareMuxConnection("/baremux/worker.js");

  // Load settings from localStorage
  function loadSettings() {
    // Load search engine
    const savedSearchEngine = localStorage.getItem('searchEngine');
    if (savedSearchEngine) {
      searchEngine.value = savedSearchEngine;
    }

    // Apply tab cloaking
    const tabCloak = localStorage.getItem('tabCloak') === 'true';
    if (tabCloak) {
      const cloakTitle = localStorage.getItem('cloakTitle') || 'Google';
      const cloakFavicon = localStorage.getItem('cloakFavicon') || 'https://www.google.com/favicon.ico';
      
      document.title = cloakTitle;
      
      // Update favicon
      let favicon = document.querySelector("link[rel*='icon']");
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'shortcut icon';
        document.head.appendChild(favicon);
      }
      favicon.href = cloakFavicon;
    }

    // Apply panic key
    const panicKey = localStorage.getItem('panicKey');
    const panicUrl = localStorage.getItem('panicUrl') || 'https://www.google.com';
    
    if (panicKey) {
      document.addEventListener('keydown', function(e) {
        if (e.key === panicKey) {
          window.location.href = panicUrl;
        }
      });
    }
  }

  // Load settings on page load
  loadSettings();

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

    // Use the saved search engine or default
    const currentSearchEngine = searchEngine.value || "https://www.bing.com/search?q=%s";
    const url = search(inputValue, currentSearchEngine);
    frame.style.display = "block";

    // Check for saved transport setting
    const savedTransport = localStorage.getItem('transport') || 'epoxy';
    const transportPath = savedTransport === 'epoxy' ? '/epoxy/index.mjs' : '/libcurl/index.mjs';
    
    const wispUrl = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/wisp/`;
    if (await connection.getTransport() !== transportPath) {
      await connection.setTransport(transportPath, [{ wisp: wispUrl }]);
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
