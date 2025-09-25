import { Ctrls } from "../ctrls";
// import { highlightJSON } from "./highlight-json";

export const initExamples = () => {
  const examples = document.querySelectorAll(".example");

  examples.forEach((example) => {
    try {
      const configElement = example.querySelector("pre") as HTMLPreElement;

      const json = configElement.textContent || "";
      const config = JSON.parse(json);
      // configElement.innerHTML = highlightJSON(json);

      new Ctrls([config], {
        showRandomizeButton: false,
        storage: "none",
        parent: example,
      });
    } catch (error) {
      console.error("Error parsing JSON:", error);
    }
  });
};
