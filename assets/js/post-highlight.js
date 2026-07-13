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

    const walker = document.createTreeWalker(
      article,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {

          if (!node.nodeValue.trim()) {
            return NodeFilter.FILTER_REJECT;
          }

          const parent = node.parentElement;

          if (!parent) {
            return NodeFilter.FILTER_REJECT;
          }

          if (SKIP.has(parent.tagName)) {
            return NodeFilter.FILTER_REJECT;
          }

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

    const textNodes = [];

    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    let firstHighlight = null;

    textNodes.forEach(node => {

      const text = node.nodeValue;

      regex.lastIndex = 0;

      if (!regex.test(text)) {
        return;
      }

      regex.lastIndex = 0;

      const fragment = document.createDocumentFragment();

      let lastIndex = 0;

      text.replace(regex, (match, _, offset) => {

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

        if (!firstHighlight) {
          firstHighlight = mark;
        }

        fragment.appendChild(mark);

        lastIndex = offset + match.length;

        return match;
      });

      if (lastIndex < text.length) {
        fragment.appendChild(
          document.createTextNode(
            text.slice(lastIndex)
          )
        );
      }

      node.parentNode.replaceChild(
        fragment,
        node
      );

    });

    requestAnimationFrame(() => {

      requestAnimationFrame(() => {

        if (firstHighlight) {

          const target =
            firstHighlight.closest(
              "h1,h2,h3,h4,h5,h6"
            ) || firstHighlight;

          const HEADER_OFFSET = 90;

          const top =
            target.getBoundingClientRect().top +
            window.scrollY -
            HEADER_OFFSET;

          window.scrollTo({
            top,
            behavior: "smooth"
          });

        }

        params.delete("highlight");

        const newQuery = params.toString();

        history.replaceState(
          {},
          "",
          location.pathname +
          (newQuery ? "?" + newQuery : "")
        );

      });

    });

  });

})();
