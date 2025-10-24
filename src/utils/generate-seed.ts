import Alea from "./alea";
import random from "./random";
import { words } from "./words";

const rng = Alea();

export default function generateSeed() {
  return [1, 2, 3]
    .map(() => {
      const index = random(0, words.length - 1, rng, 0);
      return words[index];
    })
    .join("-");
}
