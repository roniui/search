(function () {
  "use strict";

  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  window.addEventListener("load", () => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("highlight");

    if (!query) return;

    // WAIT for Chirpy's AnchorJS and layout scripts to completely finish rewriting headings
    setTimeout(() => {
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

      // Now that we know our <mark> elements are safe from being overwritten, we scroll
      const liveHighlight = document.querySelector(".search-highlight");
      
      if (liveHighlight) {
        const headerOffset = 100; // Account for Chirpy's fixed top navbar
        const elementPosition = liveHighlight.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }

    }, 500); // 500ms delay to let Chirpy's DOM manipulation finish first

  });
})();
