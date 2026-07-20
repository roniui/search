(function () {
  "use strict";

  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  window.addEventListener("load", () => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("highlight");

    if (!query) return;

    const article =
      document.querySelector("article") ||
      document.querySelector(".post-content") ||
      document.querySelector(".content");

    if (!article) return;

    const words = query
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(escapeRegExp);

    if (!words.length) return;

    const regex = new RegExp("(" + words.join("|") + ")", "gi");

    const SKIP = new Set([
      "SCRIPT", "STYLE", "NOSCRIPT", "PRE", "CODE",
      "KBD", "SAMP", "TEXTAREA", "INPUT", "BUTTON",
      "SELECT", "OPTION", "SVG", "MARK"
    ]);

    const walker = document.createTreeWalker(
      article,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          if (SKIP.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
          if (parent.closest(".toc,.sidebar,.search,.mermaid,.highlight,.rouge-table")) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const textNodes = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    let matchCount = 0;

    textNodes.forEach(node => {
      const text = node.nodeValue;
      regex.lastIndex = 0;

      if (!regex.test(text)) return;

      regex.lastIndex = 0;
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;

      text.replace(regex, (match, _, offset) => {
        if (offset > lastIndex) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex, offset)));
        }

        const mark = document.createElement("mark");
        mark.className = "search-highlight";
        mark.textContent = match;
        
        fragment.appendChild(mark);
        lastIndex = offset + match.length;
        matchCount++;
        return match;
      });

      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
      }

      node.parentNode.replaceChild(fragment, node);
    });

    // --- FLOATING NAVIGATOR UI ---
    if (matchCount > 0) {
      // Re-query to get live elements just in case the theme modified them
      const marks = document.querySelectorAll(".search-highlight");
      let currentIndex = -1; 

      const floatUI = document.createElement("div");
      floatUI.id = "search-highlight-nav";
      // Basic styling that adapts to dark/light mode using inherit
      floatUI.style.cssText = `
        position: fixed;
        bottom: 25px;
        right: 25px;
        background: var(--main-wrapper-bg, #ffffff);
        color: var(--text-color, #333333);
        border: 1px solid var(--border-color, #cccccc);
        padding: 10px 15px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 12px;
        font-family: inherit;
        font-size: 0.9rem;
      `;

      floatUI.innerHTML = `
        <span><span id="highlight-current-index">0</span> / ${matchCount}</span>
        <button id="btn-next-match" style="background: var(--link-color, #007bff); color: #fff; border: none; padding: 5px 12px; border-radius: 5px; cursor: pointer;">Next</button>
        <button id="btn-clear-match" style="background: transparent; color: inherit; border: 1px solid var(--border-color, #ccc); padding: 5px 12px; border-radius: 5px; cursor: pointer;">Clear</button>
      `;
      
      document.body.appendChild(floatUI);

      const indexLabel = document.getElementById("highlight-current-index");
      const btnNext = document.getElementById("btn-next-match");
      const btnClear = document.getElementById("btn-clear-match");

      // Scroll Action
      btnNext.addEventListener("click", () => {
        // Increment index, loop back to start if at the end
        currentIndex = (currentIndex + 1) % marks.length;
        
        // Update the counter text (1-based index for humans)
        indexLabel.textContent = currentIndex + 1;

        // Scroll to the current match
        marks[currentIndex].scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      });

      // Clear Action
      btnClear.addEventListener("click", () => {
        // Remove ?highlight from URL
        const url = new URL(window.location);
        url.searchParams.delete("highlight");
        window.history.replaceState({}, "", url);

        // Remove marks (unwrap them)
        marks.forEach(mark => {
          const parent = mark.parentNode;
          if (parent) {
            parent.replaceChild(document.createTextNode(mark.textContent), mark);
            parent.normalize(); // Merges adjacent text nodes cleanly
          }
        });

        // Destroy the UI
        floatUI.remove();
      });

      // Optionally, trigger the first click automatically to scroll to the first match
      // after a short delay (uncomment the line below if you want auto-scroll on load)
      // setTimeout(() => btnNext.click(), 500); 
    }

  });
})();
