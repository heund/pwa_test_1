const svgNS = "http://www.w3.org/2000/svg";

const nodes = [
  { id: 39, x: 158, y: 2062 },
  { id: 40, x: 242, y: 1968 },
  { id: 41, x: 300, y: 1866 },
  { id: 42, x: 286, y: 1738 },
  { id: 43, x: 232, y: 1642 },
  { id: 44, x: 166, y: 1572 },
  { id: 45, x: 124, y: 1468 },
  { id: 46, x: 186, y: 1328 },
  { id: 47, x: 228, y: 1194 },
  { id: 48, x: 286, y: 1056 },
  { id: 49, x: 326, y: 894 },
  { id: 50, x: 350, y: 724 }
];

const routePoints = [
  { x: 148, y: 2208 },
  ...nodes,
  { x: 362, y: 566 }
];

const mapLayers = document.getElementById("mapLayers");
const routeLayer = document.getElementById("routeLayer");
const nodeLayer = document.getElementById("nodeLayer");
const particles = document.getElementById("particles");
const mapScreen = document.getElementById("mapScreen");
const mapStage = document.getElementById("mapStage");

let activeNodeId = 45;

function isStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function registerPwaShell() {
  document.documentElement.dataset.displayMode = isStandaloneMode() ? "standalone" : "browser";

  const updateViewportHeight = () => {
    const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    document.documentElement.style.setProperty("--app-height", `${viewportHeight}px`);
  };

  const minimizeBrowserChrome = () => {
    if (isStandaloneMode()) return;
    window.setTimeout(() => {
      window.scrollTo(0, 1);
    }, 120);
  };

  updateViewportHeight();

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", updateViewportHeight);
  }

  window.addEventListener("resize", updateViewportHeight);
  window.addEventListener("orientationchange", () => {
    updateViewportHeight();
    minimizeBrowserChrome();
  });
  window.addEventListener("load", minimizeBrowserChrome);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      updateViewportHeight();
      minimizeBrowserChrome();
    }
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // Keep the prototype running even if SW registration fails locally.
    });
  });
}

function createSvgElement(tag, attrs = {}) {
  const el = document.createElementNS(svgNS, tag);
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  return el;
}

function append(parent, tag, attrs = {}) {
  const el = createSvgElement(tag, attrs);
  parent.append(el);
  return el;
}

function addBackground() {
  append(mapLayers, "rect", {
    x: 0,
    y: 0,
    width: 390,
    height: 2200,
    fill: "#f5eed8"
  });

  append(mapLayers, "rect", {
    x: 0,
    y: 0,
    width: 390,
    height: 178,
    fill: "#f1f0ee"
  });

  const skyMountains = append(mapLayers, "path", {
    d: "M0 248 L26 116 L62 230 L108 92 L150 262 L200 124 L242 232 L296 136 L338 228 L390 122 L390 734 L0 734 Z",
    fill: "#eee6cf"
  });
  skyMountains.classList.add("layer-parallax-slow");

  const backPeaks = append(mapLayers, "path", {
    d: "M0 364 L38 258 L82 390 L132 272 L174 414 L228 248 L276 372 L322 226 L366 332 L390 294 L390 964 L0 964 Z",
    fill: "#ddd7bc"
  });
  backPeaks.classList.add("layer-parallax-fast");

  append(mapLayers, "path", {
    d: "M0 1338 L390 1180 L390 1952 L0 2060 Z",
    fill: "#f7ecd2"
  });

  append(mapLayers, "path", {
    d: "M0 1208 L20 1160 L34 1204 L54 1166 L72 1198 L90 1144 L106 1202 L126 1152 L144 1192 L162 1128 L178 1188 L194 1118 L214 1184 L232 1120 L248 1166 L266 1094 L282 1160 L298 1102 L316 1160 L336 1108 L354 1148 L372 1088 L390 1128 L390 1326 L0 1326 Z",
    fill: "#26365a"
  });

  append(mapLayers, "path", {
    d: "M0 1996 L26 1978 L48 1986 L74 1950 L102 1958 L126 1936 L156 1944 L184 1924 L212 1932 L240 1916 L268 1926 L294 1910 L320 1918 L344 1880 L368 1892 L390 1888 L390 2200 L0 2200 Z",
    fill: "#2c356d"
  });

  append(mapLayers, "path", {
    d: "M0 2012 L26 1994 L48 2002 L74 1968 L102 1976 L126 1952 L156 1962 L184 1940 L212 1946 L240 1932 L268 1942 L294 1928 L320 1938 L344 1900 L368 1910 L390 1908 L390 2200 L0 2200 Z",
    fill: "#33407b",
    opacity: "0.55"
  });

  append(mapLayers, "path", {
    d: "M0 2000 L390 1968 L390 2200 L0 2200 Z",
    fill: "#bfd8cc"
  });

  append(mapLayers, "path", {
    d: "M0 1988 L28 1968 L46 1984 L72 1946 L98 1952 L124 1930 L156 1940 L186 1918 L208 1926 L238 1908 L268 1916 L296 1900 L324 1908 L348 1868 L372 1878 L390 1878",
    fill: "none",
    stroke: "#f5e8cb",
    "stroke-width": 8,
    "stroke-linecap": "round",
    "stroke-linejoin": "round"
  });

  const guideLines = [
    "M24 1530 L138 1410",
    "M56 1786 L206 1640",
    "M250 1650 L372 1536",
    "M292 1468 L390 1368"
  ];

  guideLines.forEach((d) => {
    append(mapLayers, "path", {
      d,
      fill: "none",
      stroke: "#dfe4d8",
      "stroke-width": 3,
      opacity: "0.55"
    });
  });
}

function addFootprints() {
  const footprints = [
    [64, 294], [192, 136], [270, 304], [50, 634], [214, 1580], [118, 1742]
  ];

  footprints.forEach(([x, y], index) => {
    const group = append(mapLayers, "g", {
      transform: `translate(${x} ${y}) rotate(${index % 2 === 0 ? -16 : 12})`,
      opacity: "0.13"
    });
    append(group, "ellipse", { cx: 0, cy: 8, rx: 8, ry: 12, fill: "#c8c0ab" });
    append(group, "circle", { cx: -10, cy: -5, r: 3, fill: "#c8c0ab" });
    append(group, "circle", { cx: -4, cy: -10, r: 3, fill: "#c8c0ab" });
    append(group, "circle", { cx: 3, cy: -11, r: 3, fill: "#c8c0ab" });
    append(group, "circle", { cx: 9, cy: -6, r: 3, fill: "#c8c0ab" });
  });
}

function addTallPine(x, baseY, scale = 1) {
  const group = append(mapLayers, "g", {
    transform: `translate(${x} ${baseY}) scale(${scale})`
  });
  group.classList.add("tree-sway");

  append(group, "rect", {
    x: -2.5,
    y: -160,
    width: 5,
    height: 160,
    rx: 2.5,
    fill: "#3f3b58"
  });

  [0, 1, 2, 3, 4].forEach((index) => {
    const y = -154 + index * 24;
    append(group, "path", {
      d: `M0 ${y} C-12 ${y + 4}, -20 ${y + 14}, -20 ${y + 20} C-8 ${y + 18}, 8 ${y + 18}, 20 ${y + 20} C20 ${y + 14}, 12 ${y + 4}, 0 ${y}`,
      fill: index % 2 === 0 ? "#87b3a2" : "#556f8a"
    });
  });
}

function addSmallPine(x, baseY, scale = 1) {
  const group = append(mapLayers, "g", {
    transform: `translate(${x} ${baseY}) scale(${scale})`
  });
  group.classList.add("tree-sway");

  append(group, "rect", {
    x: -2,
    y: -84,
    width: 4,
    height: 84,
    rx: 2,
    fill: "#4d4962"
  });

  append(group, "path", {
    d: "M0 -84 L16 -58 H-16 Z",
    fill: "#93b8a0"
  });
  append(group, "path", {
    d: "M0 -66 L13 -42 H-13 Z",
    fill: "#84ab95"
  });
  append(group, "path", {
    d: "M0 -50 L10 -28 H-10 Z",
    fill: "#709888"
  });
}

function addTrees() {
  [
    [18, 180, 1.08],
    [90, 212, 1.25],
    [206, 196, 1.12],
    [316, 178, 0.92]
  ].forEach(([x, y, s]) => addTallPine(x, y, s));

  [
    [44, 1184, 0.86],
    [100, 1538, 1.3],
    [356, 1608, 1.18]
  ].forEach(([x, y, s]) => addTallPine(x, y, s));

  [
    [26, 1812, 1],
    [66, 1940, 0.86],
    [122, 1666, 0.88],
    [218, 2060, 0.92],
    [288, 1744, 0.88],
    [374, 1934, 0.86]
  ].forEach(([x, y, s]) => addSmallPine(x, y, s));
}

function addWaterFoam() {
  const foam = append(mapLayers, "path", {
    d: "M198 2024 C208 2006, 222 2010, 226 2032 C236 2010, 252 2014, 250 2038 C266 2028, 278 2038, 270 2054 C286 2050, 294 2064, 280 2078 L216 2078 C198 2068, 190 2046, 198 2024 Z",
    fill: "#f7f2e5"
  });
  foam.classList.add("sparkle");
}

function routePathData(points) {
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const point = points[i];
    const dy = (prev.y - point.y) * 0.5;
    d += ` C ${prev.x} ${prev.y - dy}, ${point.x} ${point.y + dy}, ${point.x} ${point.y}`;
  }
  return d;
}

function addRoute() {
  const d = routePathData(routePoints);

  append(routeLayer, "path", {
    d,
    class: "route-main"
  });

  append(routeLayer, "path", {
    d,
    class: "route-highlight"
  });
}

function renderNodes() {
  nodeLayer.innerHTML = "";

  nodes.forEach((node) => {
    const group = append(nodeLayer, "g", {
      class: `map-node${node.id === activeNodeId ? " is-active" : ""}`,
      transform: `translate(${node.x} ${node.y})`,
      tabindex: "0",
      role: "button",
      "aria-label": `${node.id} 스테이지 선택`
    });

    group.dataset.id = String(node.id);

    append(group, "circle", {
      cx: 0,
      cy: 0,
      r: 28
    });

    const text = append(group, "text", {
      x: 0,
      y: 2
    });
    text.textContent = String(node.id);

    group.addEventListener("click", () => setActiveNode(node.id));
    group.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setActiveNode(node.id);
      }
    });
  });
}

function setActiveNode(id) {
  if (!nodes.find((node) => node.id === id)) return;
  activeNodeId = id;
  renderNodes();
  const target = nodes.find((node) => node.id === id);
  const topOffset = Math.max(target.y - window.innerHeight * 0.48, 0);
  mapScreen.scrollTo({ top: topOffset, behavior: "smooth" });
}

function createParticles() {
  particles.innerHTML = "";
  for (let i = 0; i < 22; i += 1) {
    const particle = document.createElement("span");
    particle.className = "particle";
    particle.style.left = `${8 + Math.random() * 84}%`;
    particle.style.top = `${4 + Math.random() * 90}%`;
    particle.style.setProperty("--duration", `${4.5 + Math.random() * 5.5}s`);
    particle.style.setProperty("--delay", `${Math.random() * -8}s`);
    particles.append(particle);
  }
}

function updateParallax() {
  const scrollTop = mapScreen.scrollTop;
  mapStage.style.setProperty("--parallax-slow", `${scrollTop * -0.02}px`);
  mapStage.style.setProperty("--parallax-fast", `${scrollTop * -0.04}px`);
}

function init() {
  registerPwaShell();
  registerServiceWorker();
  addBackground();
  addFootprints();
  addTrees();
  addWaterFoam();
  addRoute();
  renderNodes();
  createParticles();
  updateParallax();
  setActiveNode(activeNodeId);
}

mapScreen.addEventListener("scroll", () => {
  window.requestAnimationFrame(updateParallax);
}, { passive: true });

window.addEventListener("resize", updateParallax);

init();
