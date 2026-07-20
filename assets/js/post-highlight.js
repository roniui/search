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

    // Variable to track the very first match
    let isFirstMatch = true; 

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

        // Give ONLY the first match a unique ID so we can navigate to it
        if (isFirstMatch) {
          mark.id = "search-highlight-target"; 
          isFirstMatch = false;
        }

        mark.textContent = match;
        fragment.appendChild(mark);
        lastIndex = offset + match.length;
        return match;
      });

      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
      }

      node.parentNode.replaceChild(fragment, node);
    });

    // Let the DOM settle, then use native URL hashes to trigger the scroll
    setTimeout(() => {
      const targetMark = document.getElementById("search-highlight-target");

      if (targetMark) {
        // Check if our highlight is inside a heading (h1-h6)
        const parentHeading = targetMark.closest("h1, h2, h3, h4, h5, h6");

        if (parentHeading && parentHeading.id) {
          // If it is in a heading, use the heading's ID (exactly like your example URL!)
          window.location.hash = parentHeading.id;
        } else {
          // If it is in normal text, add a CSS offset so the top navbar doesn't cover it
          targetMark.style.scrollMarginTop = "100px";
          // Jump directly to our custom <mark> ID
          window.location.hash = targetMark.id; 
        }
      }

      // We can safely clean up the URL here. This removes the ?highlight= parameter
      // but keeps the #hash, resulting in a perfectly clean URL.
      params.delete("highlight");
      const newQuery = params.toString();
      const newUrl = location.pathname + (newQuery ? "?" + newQuery : "") + location.hash;
      history.replaceState({}, "", newUrl);

    }, 150);

  });
})();
