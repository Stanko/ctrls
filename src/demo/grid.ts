import { createNoise2D } from "simplex-noise";
import { options } from "./hero";
import random from "../utils/random";

export type GridItem = {
  x: number;
  y: number;
  r: number;
};

const MIN_SIDE = 16;
const MAX_SIDE = 32;

const sizeNoise = createNoise2D();

const generateHexGrid = (width: number, height: number): GridItem[] => {
  const points: GridItem[] = [];

  const side = Math.max(Math.min(width / 40, MAX_SIDE), MIN_SIDE);
  const h = (side * Math.sqrt(3)) / 2;

  const horizontalStep = side * 3;
  const verticalStep = h;

  const columnsCount = Math.ceil(width / (side * 3.5)) + 1;
  const rowsCount = Math.ceil(height / verticalStep);

  for (let rowIndex = 0; rowIndex <= rowsCount; rowIndex++) {
    const y = rowIndex * verticalStep;

    const isOddRow = rowIndex % 2 !== 0;
    const horizontalOffset = isOddRow ? horizontalStep / 2 : 0;

    for (let columnIndex = 0; columnIndex <= columnsCount; columnIndex++) {
      const x = columnIndex * horizontalStep + horizontalOffset;

      points.push({
        x: parseFloat(x.toFixed(2)),
        y: parseFloat(y.toFixed(2)),
        r: parseFloat((side * 0.95).toFixed(2)),
      });
    }
  }

  return points;
};

const getHexagons = (grid: GridItem[]): SVGPathElement[] => {
  return grid.map((item, i) => {
    const { x, y, r } = item;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

    path.classList.add("grid__hex");
    path.dataset.index = i.toString();
    path.dataset.x = x.toString();
    path.dataset.y = y.toString();
    path.dataset.r = r.toString();

    return path;
  });
};

export class Grid {
  svg: SVGElement;
  hexagons: SVGPathElement[];
  animationTime: number = 0;
  lastUpdate: number = performance.now();
  resizing: boolean = false;
  isInViewport: boolean = true;

  constructor(width: number, height: number) {
    const grid = generateHexGrid(width, height);
    const hexagons = getHexagons(grid);

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("fill", "none");
    svg.classList.add("grid");

    svg.replaceChildren(...hexagons);

    this.svg = svg;
    this.hexagons = hexagons;

    this.updateOpacity();
    this.drawFrame();

    window.addEventListener("scroll", this.handleScroll);
  }

  handleScroll = () => {
    const rect = this.svg.getBoundingClientRect();
    const isInViewport = rect.height > 0 && rect.bottom > -100;

    if (isInViewport !== this.isInViewport) {
      this.isInViewport = isInViewport;

      // Resume the animation
      if (this.isInViewport && options.getValues().animate) {
        this.animate();
      }
    }
  };

  resize(width: number, height: number) {
    const grid = generateHexGrid(width, height);
    const hexagons = getHexagons(grid);

    this.resizing = true;
    this.svg.replaceChildren(...hexagons);
    this.svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    this.hexagons = hexagons;
    this.resizing = false;

    this.updateOpacity();

    if (!options.getValues().animate) {
      this.drawFrame();
    }
  }

  updateOpacity() {
    const values = options.getValues();

    this.hexagons.forEach((hexagon) => {
      hexagon.style.opacity = random(
        0.1,
        1,
        values.opacitySeedRng,
        2,
      ).toString();
    });
  }

  animate() {
    this.lastUpdate = performance.now();
    this.drawFrame();
  }

  drawFrame() {
    const values = options.getValues();
    const { min, max } = values.size;
    const corners = parseInt(values.shape, 10);
    const time = this.animationTime;

    this.hexagons.forEach((hexagon) => {
      const x = parseFloat(hexagon.dataset.x as string);
      const y = parseFloat(hexagon.dataset.y as string);
      const r = parseFloat(hexagon.dataset.r as string);

      // Map noise to 0 - 1
      const noiseX = x / 400 + time;
      const noiseY = y / 400 + time;
      const n = sizeNoise(noiseX, noiseY) * 0.5 + 0.5;

      const radius = (min + (max - min) * n) * r;

      const points = [];

      for (let i = 0; i < corners; i++) {
        const angle = ((Math.PI * 2) / corners) * i;
        const pointX = x + radius * Math.cos(angle);
        const pointY = y + radius * Math.sin(angle);
        points.push(`${pointX.toFixed(2)}, ${pointY.toFixed(2)}`);
      }

      hexagon.setAttribute("d", `M ${points.join(" L ")} Z`);
    });

    if (options.getValues().animate && !this.resizing && this.isInViewport) {
      const now = performance.now();
      const delta = now - this.lastUpdate;
      this.animationTime += (delta * values.speed) / 5000;
      this.lastUpdate = now;
      requestAnimationFrame(() => this.drawFrame());
    }
  }
}
