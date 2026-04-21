const svgNS = "http://www.w3.org/2000/svg";

const nodes = [
  { id: 39, x: 160, y: 2050, title: "숨길 39", body: "짙은 물가와 바위 그림자 사이로 길이 다시 또렷해지는 자리." },
  { id: 40, x: 230, y: 1975, title: "숨길 40", body: "조용한 오르막 끝, 바람이 한 번 접히며 방향을 바꾸는 곳." },
  { id: 41, x: 294, y: 1888, title: "숨길 41", body: "숲 가장자리에 빛이 스치며 오래 머무는 작은 경계." },
  { id: 42, x: 292, y: 1770, title: "숨길 42", body: "얇은 발자국이 남아 있는 평탄한 길, 기운이 모이는 지점." },
  { id: 43, x: 230, y: 1688, title: "숨길 43", body: "낮은 나무와 빈 여백이 함께 열리며 시야가 넓어지는 구간." },
  { id: 44, x: 170, y: 1638, title: "숨길 44", body: "곡선이 완만해지고 발걸음이 느려지는 숨 고르기의 마디." },
  { id: 45, x: 132, y: 1538, title: "숨길 45", body: "바람이 낮게 흐르고 나무 그림자가 길게 겹치는 길목." },
  { id: 46, x: 190, y: 1410, title: "숨길 46", body: "짙은 숲의 경계선 위로 다음 길이 부드럽게 떠오르는 자리." },
  { id: 47, x: 238, y: 1280, title: "숨길 47", body: "높이가 한 번 바뀌며 먼 봉우리의 윤곽이 가까워지는 곳." },
  { id: 48, x: 286, y: 1146, title: "숨길 48", body: "고요한 능선 아래로 길이 밝게 이어지는 중간 지점." },
  { id: 49, x: 321, y: 982, title: "숨길 49", body: "작은 수평선 같은 쉼표가 놓인, 상단 구간의 조용한 마당." },
  { id: 50, x: 344, y: 808, title: "숨길 50", body: "하늘이 열리고 화면 위쪽 공기가 가장 가벼워지는 도착점." }
];

const mapLayers = document.getElementById("mapLayers");
const routeLayer = document.getElementById("routeLayer");
const nodeLayer = document.getElementById("nodeLayer");
const particles = document.getElementById("particles");
const mapScreen = document.getElementById("mapScreen");
const mapStage = document.getElementById("mapStage");
const nodeTitle = document.getElementById("nodeTitle");
const nodeBody = document.getElementById("nodeBody");

let activeNodeId = 45;

function createSvgElement(tag, attrs = {}) {
  const el = document.createElementNS(svgNS, tag);
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  return el;
}

function addBackground() {
  const base = createSvgElement("rect", {
    x: 0,
    y: 0,
    width: 390,
    height: 2200,
    fill: "#f5efd9"
  });
  mapLayers.append(base);

  const topWash = createSvgElement("rect", {
    x: 0,
    y: 0,
    width: 390,
    height: 460,
    fill: "#faf6ea"
  });
  mapLayers.append(topWash);

  const topMountains = createSvgElement("path", {
    d: "M0 170 L45 88 L86 156 L140 78 L197 168 L248 98 L310 154 L350 108 L390 144 L390 560 L0 560 Z",
    fill: "#ebe4ca"
  });
  topMountains.classList.add("layer-parallax-slow");
  mapLayers.append(topMountains);

  const topRidges = createSvgElement("path", {
    d: "M0 240 L40 190 L78 238 L138 176 L195 248 L228 205 L270 250 L316 184 L360 236 L390 210 L390 650 L0 650 Z",
    fill: "#d9d5b8"
  });
  topRidges.classList.add("layer-parallax-fast");
  mapLayers.append(topRidges);

  const forestBand = createSvgElement("path", {
    d: "M0 1210 L20 1170 L36 1202 L54 1166 L72 1200 L90 1158 L106 1198 L126 1148 L142 1186 L160 1134 L176 1180 L194 1140 L212 1176 L228 1118 L244 1162 L260 1104 L278 1166 L292 1108 L308 1160 L326 1110 L344 1156 L362 1092 L380 1144 L390 1130 L390 1322 L0 1322 Z",
    fill: "#2d3f63"
  });
  forestBand.classList.add("layer-parallax-fast");
  mapLayers.append(forestBand);

  const midSlope = createSvgElement("path", {
    d: "M0 1330 L390 1154 L390 1680 L0 1680 Z",
    fill: "#f7ecd3"
  });
  mapLayers.append(midSlope);

  const lowerWater = createSvgElement("path", {
    d: "M0 2020 L390 1978 L390 2200 L0 2200 Z",
    fill: "#c3d8cb"
  });
  mapLayers.append(lowerWater);

  const cliff = createSvgElement("path", {
    d: "M0 1986 L30 1966 L48 1982 L70 1940 L98 1948 L126 1922 L158 1936 L188 1916 L210 1928 L244 1900 L274 1912 L304 1898 L330 1908 L352 1870 L390 1880 L390 1980 L0 2020 Z",
    fill: "#2d356d"
  });
  mapLayers.append(cliff);

  const shoreline = createSvgElement("path", {
    d: "M0 1986 L30 1966 L48 1982 L70 1940 L98 1948 L126 1922 L158 1936 L188 1916 L210 1928 L244 1900 L274 1912 L304 1898 L330 1908 L352 1870 L390 1880",
    fill: "none",
    stroke: "#f1e5c9",
    "stroke-width": 8,
    "stroke-linecap": "round",
    "stroke-linejoin": "round"
  });
  mapLayers.append(shoreline);
}

function addDecorations() {
  const footprints = [
    [72, 430], [236, 255], [278, 514], [55, 846], [226, 1548], [102, 1704]
  ];

  footprints.forEach(([x, y], index) => {
    const group = createSvgElement("g", {
      transform: `translate(${x} ${y}) rotate(${index % 2 === 0 ? -18 : 14})`,
      opacity: "0.12"
    });
    group.append(createSvgElement("ellipse", { cx: 0, cy: 8, rx: 8, ry: 12, fill: "#c7bfaa" }));
    group.append(createSvgElement("circle", { cx: -10, cy: -5, r: 3, fill: "#c7bfaa" }));
    group.append(createSvgElement("circle", { cx: -4, cy: -10, r: 3, fill: "#c7bfaa" }));
    group.append(createSvgElement("circle", { cx: 3, cy: -11, r: 3, fill: "#c7bfaa" }));
    group.append(createSvgElement("circle", { cx: 9, cy: -6, r: 3, fill: "#c7bfaa" }));
    mapLayers.append(group);
  });

  const mintDashes = [
    [336, 1010], [334, 1184], [320, 1470]
  ];

  mintDashes.forEach(([x, y]) => {
    mapLayers.append(createSvgElement("rect", {
      x, y, width: 40, height: 5, rx: 3, fill: "#7fb19f", opacity: "0.9"
    }));
  });

  const shoreFoam = createSvgElement("path", {
    d: "M198 2028 C208 2008, 222 2010, 228 2030 C236 2012, 252 2016, 250 2038 C268 2028, 278 2040, 268 2054 C286 2052, 292 2066, 278 2076 L214 2076 C196 2066, 190 2046, 198 2028 Z",
    fill: "#f6f1e3",
    opacity: "0.95"
  });
  shoreFoam.classList.add("sparkle");
  mapLayers.append(shoreFoam);
}

function addTrees() {
  const trees = [
    [26, 210, 0.95], [88, 150, 1.2], [208, 112, 1.08], [322, 144, 0.88],
    [44, 988, 0.74], [96, 748, 1.28], [348, 1030, 1.15],
    [22, 1508, 1.02], [68, 1608, 0.7], [140, 1488, 0.78], [222, 1722, 0.86], [354, 1650, 0.74]
  ];

  trees.forEach(([x, y, scale]) => {
    const group = createSvgElement("g", {
      transform: `translate(${x} ${y}) scale(${scale})`
    });
    group.classList.add("tree-sway");

    group.append(createSvgElement("rect", {
      x: 0, y: 0, width: 5, height: 120, rx: 2.5, fill: "#3f3a58"
    }));

    [0, 18, 36, 54, 72].forEach((offset, idx) => {
      group.append(createSvgElement("path", {
        d: `M2 ${6 + offset} C-10 ${10 + offset}, -17 ${18 + offset}, -18 ${24 + offset} C-5 ${22 + offset}, 8 ${22 + offset}, 18 ${24 + offset} C15 ${18 + offset}, 10 ${10 + offset}, 2 ${6 + offset}`,
        fill: idx % 2 === 0 ? "#7fb19f" : "#557694"
      }));
    });

    mapLayers.append(group);
  });

  const smallTrees = [
    [84, 1490], [44, 1760], [100, 1860], [324, 1334], [366, 1788]
  ];

  smallTrees.forEach(([x, y]) => {
    const group = createSvgElement("g", {
      transform: `translate(${x} ${y})`
    });
    group.classList.add("tree-sway");
    group.append(createSvgElement("rect", {
      x: 6, y: 18, width: 4, height: 66, rx: 2, fill: "#4a4762"
    }));
    group.append(createSvgElement("path", {
      d: "M8 0 L24 26 H-8 Z",
      fill: "#91b49f"
    }));
    group.append(createSvgElement("path", {
      d: "M8 14 L20 36 H-4 Z",
      fill: "#7ea694"
    }));
    group.append(createSvgElement("path", {
      d: "M8 28 L16 46 H0 Z",
      fill: "#6d9688"
    }));
    mapLayers.append(group);
  });
}

function routePathData(points) {
  if (!points.length) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const point = points[i];
    const midY = (prev.y + point.y) / 2;
    d += ` C ${prev.x} ${midY}, ${point.x} ${midY}, ${point.x} ${point.y}`;
  }
  return d;
}

function addRoute() {
  const ordered = [...nodes].reverse();
  const d = routePathData(ordered);

  routeLayer.append(createSvgElement("path", {
    d,
    class: "route-main"
  }));

  routeLayer.append(createSvgElement("path", {
    d,
    class: "route-highlight"
  }));
}

function renderNodes() {
  nodeLayer.innerHTML = "";

  nodes.forEach((node) => {
    const group = createSvgElement("g", {
      class: `map-node${node.id === activeNodeId ? " is-active" : ""}`,
      transform: `translate(${node.x} ${node.y})`,
      tabindex: "0",
      role: "button",
      "aria-label": `${node.title} 선택`
    });

    group.dataset.id = String(node.id);

    group.append(createSvgElement("circle", {
      class: "node-pulse",
      cx: 0,
      cy: 0,
      r: 36
    }));

    group.append(createSvgElement("circle", {
      cx: 0,
      cy: 0,
      r: 28
    }));

    const text = createSvgElement("text", {
      x: 0,
      y: 2
    });
    text.textContent = String(node.id);
    group.append(text);

    group.addEventListener("click", () => setActiveNode(node.id));
    group.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setActiveNode(node.id);
      }
    });

    nodeLayer.append(group);
  });
}

function setActiveNode(id) {
  const next = nodes.find((node) => node.id === id);
  if (!next) return;
  activeNodeId = id;
  nodeTitle.textContent = next.title;
  nodeBody.textContent = next.body;
  renderNodes();

  const topOffset = Math.max(next.y - window.innerHeight * 0.48, 0);
  mapScreen.scrollTo({ top: topOffset, behavior: "smooth" });
}

function createParticles() {
  for (let i = 0; i < 24; i += 1) {
    const particle = document.createElement("span");
    particle.className = "particle";
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;
    particle.style.setProperty("--duration", `${4.5 + Math.random() * 5.5}s`);
    particle.style.setProperty("--delay", `${Math.random() * -8}s`);
    particles.append(particle);
  }
}

function updateParallax() {
  const scrollTop = mapScreen.scrollTop;
  mapStage.style.setProperty("--parallax-slow", `${scrollTop * -0.025}px`);
  mapStage.style.setProperty("--parallax-fast", `${scrollTop * -0.045}px`);
}

function init() {
  addBackground();
  addDecorations();
  addTrees();
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
