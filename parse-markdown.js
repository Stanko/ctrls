import fs from "fs";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";

marked.use(
  {
    gfm: true,
  },
  {
    renderer: {
      heading({ text, depth }) {
        const id = text
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");
        return `<h${depth} id="${id}">${text}</h${depth}>`;
      },
    },
  },
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  }),
);

const getHTML = () => {
  const readme = fs.readFileSync("README.md", "utf8");
  const parsed = marked(readme);

  const START_WITH = `<h2 id="made-for-algorithmicgenerative-art">`;
  const END_BEFORE = `<h2 id="todo">`;

  const start = parsed.indexOf(START_WITH);
  const end = parsed.indexOf(END_BEFORE);

  const html = parsed.slice(start, end);

  return html;
};

const writeIndex = (html) => {
  const index = fs.readFileSync("index.html", "utf8");

  const START_TOKEN = "<!--MARKDOWN--->";
  const END_TOKEN = "<!--END_MARKDOWN--->";

  const start = index.indexOf(START_TOKEN) + START_TOKEN.length;
  const end = index.indexOf(END_TOKEN);

  const updatedIndex =
    index.slice(0, start) + "\n" + html + "\n" + index.slice(end);

  fs.writeFileSync("index.html", updatedIndex);
};

writeIndex(getHTML());
