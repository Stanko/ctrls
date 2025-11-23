import "./scss/index.scss";
import "./scss/demo.scss";

import "./demo/hero";
import { initExamples } from "./demo/examples";
import "./demo/nav";
import "./demo/theme-controls";
import "./demo/all-controls";

initExamples();

// Goatcounter
if (import.meta.env.PROD) {
  const gc = document.createElement("script");
  gc.setAttribute(
    "data-goatcounter",
    "https://muffinman_io.goatcounter.com/count",
  );
  gc.setAttribute("async", "");
  gc.src = "//gc.zgo.at/count.js";

  document.body.appendChild(gc);
}
