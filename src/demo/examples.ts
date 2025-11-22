import { Ctrls } from "../ctrls";

export const initExamples = () => {
  const examples = document.querySelectorAll(".example");

  examples.forEach((example) => {
    try {
      const configElement = example.querySelector("pre") as HTMLPreElement;

      const json = configElement.textContent || "";

      let config;
      if (json.includes("downloadButton")) {
        const downloadButton = document.createElement("button");
        downloadButton.classList.add("ctrls__btn", "ctrls__btn--lg");
        downloadButton.style.marginLeft = "0";
        downloadButton.innerHTML = "PNG";
        downloadButton.addEventListener("click", () => {
          alert("Download button clicked");
        });
        config = {
          type: "html",
          name: "download",
          html: downloadButton,
        };
      } else {
        config = JSON.parse(json);
      }

      new Ctrls([config], {
        title: "Controls",
        showRandomizeButton: false,
        storage: "none",
        parent: example,
      });
    } catch (error) {
      console.error("Error parsing JSON:", error);
    }
  });
};
