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
        return match;
      });

      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
      }

      node.parentNode.replaceChild(fragment, node);
    });

        // Let the DOM settle, then scroll based on the element type
    setTimeout(() => {
      const firstMark = document.querySelector(".search-highlight");
      
      if (!firstMark) return;

      const parentHeading = firstMark.closest("h1, h2, h3, h4, h5, h6");

      if (parentHeading) {
        // 1. Look for Chirpy's generated anchor link inside the heading
        const anchorLink = parentHeading.querySelector("a.anchor");
        
        if (anchorLink) {
          // Simulate a mouse click on Chirpy's native link!
          // This triggers the theme's built-in smooth scroll perfectly.
          anchorLink.click();
        } else if (parentHeading.id) {
          // Fallback just in case the link hasn't generated yet
          window.location.hash = parentHeading.id;
        }
      } else {
        // 2. It's inside normal text. We use standard smooth scrolling.
        firstMark.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }

      // 3. Clean up the URL: removes ?highlight= but keeps the clean #hash
      params.delete("highlight");
      const newQuery = params.toString();
      const newUrl = location.pathname + (newQuery ? "?" + newQuery : "") + location.hash;
      
      history.replaceState({}, "", newUrl);

    }, 300);
