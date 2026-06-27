import "server-only";

import sanitizeHtml from "sanitize-html";

export function sanitizeEmailHtml(html: string) {
  return sanitizeHtml(html, {
    allowedAttributes: {
      a: ["href", "name", "target", "rel"],
      blockquote: ["cite"],
      span: ["style"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedStyles: {
      span: {
        color: [/^#[0-9a-fA-F]{3,6}$/, /^rgb\((\s*\d+\s*,){2}\s*\d+\s*\)$/],
        "font-weight": [/^\d{3}$/, /^bold$/],
      },
    },
    allowedTags: [
      "a",
      "b",
      "blockquote",
      "br",
      "code",
      "em",
      "h2",
      "h3",
      "i",
      "li",
      "ol",
      "p",
      "pre",
      "span",
      "strong",
      "u",
      "ul",
    ],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noopener noreferrer",
        target: "_blank",
      }),
    },
  }).trim();
}

export function htmlToPlainText(html: string) {
  return sanitizeHtml(html, {
    allowedTags: [],
    textFilter: (text) => text.replace(/\s+/g, " "),
  })
    .replace(/\s+/g, " ")
    .trim();
}
