(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {

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
      .map(word =>
        word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      );

    if (!words.length) return;

    const regex = new RegExp("(" + words.join("|") + ")", "gi");

    const SKIP = new Set([
      "SCRIPT",
      "STYLE",
      "NOSCRIPT",
      "PRE",
      "CODE",
      "KBD",
      "SAMP",
      "TEXTAREA",
      "INPUT",
      "BUTTON",
      "SELECT",
      "OPTION",
      "SVG",
      "MARK"
    ]);

    let firstHighlight = null;

    const walker = document.createTreeWalker(
      article,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {

          if (!node.nodeValue.trim())
            return NodeFilter.FILTER_REJECT;

          const parent = node.parentNode;

          if (!parent)
            return NodeFilter.FILTER_REJECT;

          if (SKIP.has(parent.nodeName))
            return NodeFilter.FILTER_REJECT;

          if (
            parent.closest(
              ".toc,.sidebar,.search,.mermaid,.highlight,.rouge-table"
            )
          ) {
            return NodeFilter.FILTER_REJECT;
          }

          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const nodes = [];

    while (walker.nextNode()) {
      nodes.push(walker.currentNode);
    }

    nodes.forEach(textNode => {

      const text = textNode.nodeValue;

      regex.lastIndex = 0;

      if (!regex.test(text))
        return;

      regex.lastIndex = 0;

      const fragment = document.createDocumentFragment();

      let lastIndex = 0;

      text.replace(regex, (match, p1, offset) => {

        if (offset > lastIndex) {
          fragment.appendChild(
            document.createTextNode(
              text.slice(lastIndex, offset)
            )
          );
        }

        const mark = document.createElement("mark");

        mark.className = "search-highlight";

        mark.textContent = match;

        if (!firstHighlight)
          firstHighlight = mark;

        fragment.appendChild(mark);

        lastIndex = offset + match.length;

      });

      if (lastIndex < text.length) {
        fragment.appendChild(
          document.createTextNode(
            text.slice(lastIndex)
          )
        );
      }

      textNode.parentNode.replaceChild(
        fragment,
        textNode
      );

    });

    if (firstHighlight) {

      setTimeout(() => {

        const heading = firstHighlight.closest("h1,h2,h3,h4,h5,h6");

if (heading && heading.id) {
  location.hash = heading.id;
} else {
  firstHighlight.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
      }

      }, 150);

    }

    params.delete("highlight");

    const newQuery = params.toString();

    history.replaceState(
      {},
      "",
      location.pathname +
      (newQuery ? "?" + newQuery : "") +
      location.hash
    );

  });

})();
