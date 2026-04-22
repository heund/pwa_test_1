import {
  getCachedJejuSceneState,
  getJejuSceneState,
  getNextRefreshDelay
} from "./services/jeju-solar.js";

const mapSceneAssets = {
  day: "images/map_no_cloud.svg",
  sunset: "images/map_sunset.svg",
  night: "images/map_night.svg"
};

const cloudAssets = [
  {
    base: "images/cloud_asset_01.svg",
    sunset: "images/cloud_asset_01_sunset.svg",
    night: "images/cloud_asset_01_night.svg"
  },
  {
    base: "images/cloud_asset_02.svg",
    sunset: "images/cloud_asset_02_sunset.svg",
    night: "images/cloud_asset_02_night.svg"
  },
  {
    base: "images/cloud_asset_03.svg",
    sunset: "images/cloud_asset_03_sunset.svg",
    night: "images/cloud_asset_03_night.svg"
  },
  {
    base: "images/cloud_asset_04.svg",
    sunset: "images/cloud_asset_04_sunset.svg",
    night: "images/cloud_asset_04_night.svg"
  },
  {
    base: "images/cloud_asset_05.svg",
    sunset: "images/cloud_asset_05_sunset.svg",
    night: "images/cloud_asset_05_night.svg"
  }
];

let mapStage;
let mapImagePrimary;
let mapImageSecondary;
let cloudLayer;
let bottomCloudLayer;
let backgroundAudio;
let loadingScreen;
let loadingBarFill;
let cloudTimers = [];
let bottomCloudTimers = [];
let cloudResizeFrame = 0;
let sceneRefreshTimer = 0;
let isAudioStarting = false;
let hasStartedAudio = false;
let loadingProgress = 0;
let currentScenePhase = null;
let activeMapImage;
let inactiveMapImage;

const cloudLanes = [0.02, 0.07, 0.11, 0.15];
const bottomCloudLanes = [0.78, 0.84, 0.9, 0.95];
const cloudMinGap = 110;
const bottomCloudMinGap = 90;

function isStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

async function startBackgroundAudio() {
  if (hasStartedAudio || isAudioStarting) return;
  isAudioStarting = true;

  try {
    if (!backgroundAudio) {
      backgroundAudio = document.getElementById("mapBackgroundAudio");
    }
    if (!backgroundAudio) return;

    backgroundAudio.volume = 1;
    backgroundAudio.muted = false;
    backgroundAudio.loop = true;
    await backgroundAudio.play();
    hasStartedAudio = true;
  } catch {
    // Leave audio stopped if the browser blocks or decoding fails.
  } finally {
    isAudioStarting = false;
  }
}

function registerAudioStart() {
  if (!mapStage) return;

  const handleFirstInteraction = async () => {
    await startBackgroundAudio();
    if (hasStartedAudio) {
      mapStage.removeEventListener("pointerdown", handleFirstInteraction);
      mapStage.removeEventListener("click", handleFirstInteraction);
      mapStage.removeEventListener("touchstart", handleFirstInteraction);
    }
  };

  mapStage.addEventListener("pointerdown", handleFirstInteraction, { passive: true });
  mapStage.addEventListener("click", handleFirstInteraction, { passive: true });
  mapStage.addEventListener("touchstart", handleFirstInteraction, { passive: true });
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

function clearTimers(timerStore) {
  timerStore.forEach((timer) => window.clearTimeout(timer));
  timerStore.length = 0;
}

function getActiveCloudRects(layer) {
  return Array.from(layer ? layer.children : []).map((cloud) => ({
    left: Number(cloud.dataset.left || 0),
    width: Number(cloud.dataset.width || 0),
    lane: Number(cloud.dataset.lane || 0)
  }));
}

function getViewportCloudRects(layer) {
  return getActiveCloudRects(layer).filter((cloud) => cloud.left < window.innerWidth && cloud.left + cloud.width > 0);
}

function pickCloudLane(layer, lanes) {
  const activeLanes = new Set(
    getActiveCloudRects(layer)
      .filter((cloud) => cloud.left < window.innerWidth && cloud.left + cloud.width > 0)
      .map((cloud) => cloud.lane)
  );

  const availableLanes = lanes.filter((_, index) => !activeLanes.has(index));
  if (availableLanes.length > 0) {
    const lane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
    return { lane, laneIndex: lanes.indexOf(lane) };
  }

  const laneIndex = Math.floor(Math.random() * lanes.length);
  return { lane: lanes[laneIndex], laneIndex };
}

function randomCloudSpec(config) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const { lane, laneIndex } = pickCloudLane(config.layer, config.lanes);
  const width = Math.round(viewportWidth * (config.minWidthRatio + Math.random() * config.widthRatioSpread));
  const laneTop = Math.round(viewportHeight * lane);
  const topJitter = Math.round((Math.random() - 0.5) * config.topJitter);

  return {
    asset: cloudAssets[Math.floor(Math.random() * cloudAssets.length)],
    width,
    top: Math.max(12, laneTop + topJitter),
    laneIndex,
    opacity: config.minOpacity + Math.random() * config.opacitySpread,
    duration: config.minDuration + Math.random() * config.durationSpread,
    floatDuration: config.minFloatDuration + Math.random() * config.floatDurationSpread,
    floatOffset: config.minFloatOffset + Math.random() * config.floatOffsetSpread
  };
}

function hasEnoughHorizontalGap(layer, left, width, laneIndex, minGap) {
  return getViewportCloudRects(layer).every((cloud) => {
    const isNearbyLane = Math.abs(cloud.lane - laneIndex) <= 1;
    const cloudRight = cloud.left + cloud.width;
    const nextRight = left + width;
    if (!isNearbyLane) {
      return true;
    }
    return nextRight + minGap < cloud.left || left > cloudRight + minGap;
  });
}

function findSpawnLeft(layer, width, laneIndex, minGap, options = {}) {
  const {
    visible = false,
    minVisibleRatio = 0.2,
    maxVisibleRatio = 0.55
  } = options;

  const viewportWidth = window.innerWidth;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const left = visible
      ? Math.round(
          -width * maxVisibleRatio +
          Math.random() * ((viewportWidth - width * minVisibleRatio) - (-width * maxVisibleRatio))
        )
      : -width;

    if (hasEnoughHorizontalGap(layer, left, width, laneIndex, minGap)) {
      return left;
    }
  }

  return visible ? Math.max(24, Math.round(viewportWidth * 0.16)) : -width;
}

function scheduleCloudSpawn(layer, timerStore, spawnFn, delay = 0) {
  const timer = window.setTimeout(() => {
    const activeClouds = layer ? layer.childElementCount : 0;
    const shouldSpawn =
      activeClouds === 0 ||
      (activeClouds === 1 && Math.random() < 0.96) ||
      (activeClouds === 2 && Math.random() < 0.58);

    if (shouldSpawn) {
      spawnFn();
    } else {
      scheduleCloudSpawn(layer, timerStore, spawnFn, 700 + Math.random() * 900);
    }

    const index = timerStore.indexOf(timer);
    if (index >= 0) {
      timerStore.splice(index, 1);
    }
  }, delay);

  timerStore.push(timer);
}

function attachCloudLifecycle(cloud, timerStore, layer, spawnFn, respawnMin, respawnSpread) {
  const handleEnd = () => {
    cloud.remove();
    scheduleCloudSpawn(layer, timerStore, spawnFn, respawnMin + Math.random() * respawnSpread);
  };

  return handleEnd;
}

function placeCloud(cloud, left, top, width, laneIndex) {
  cloud.style.left = `${left}px`;
  cloud.style.top = `${top}px`;
  cloud.style.width = `${width}px`;
  cloud.dataset.left = String(left);
  cloud.dataset.width = String(width);
  cloud.dataset.lane = String(laneIndex);
}

function animateCloud(cloud, startLeft, targetLeft, duration, timerStore, layer, spawnFn, respawnMin, respawnSpread) {
  const travel = Math.max(targetLeft - startLeft, 0);
  const onFinish = attachCloudLifecycle(cloud, timerStore, layer, spawnFn, respawnMin, respawnSpread);

  cloud.dataset.left = String(targetLeft);

  const animation = cloud.animate(
    [
      { transform: "translateX(0px)" },
      { transform: `translateX(${travel}px)` }
    ],
    {
      duration: duration * 1000,
      easing: "linear",
      fill: "forwards"
    }
  );

  animation.addEventListener("finish", onFinish, { once: true });
}

function spawnCloud(layer, timerStore, config, options = {}) {
  if (!layer || layer.childElementCount >= config.maxClouds) return;

  const spec = randomCloudSpec(config);
  const cloud = document.createElement("div");
  const cloudImageBase = document.createElement("img");
  const cloudImageSunset = document.createElement("img");
  const cloudImageNight = document.createElement("img");
  const endLeft = window.innerWidth + spec.width;
  const startLeft = findSpawnLeft(layer, spec.width, spec.laneIndex, config.minGap, options);
  const remainingDistance = Math.max(endLeft - startLeft, spec.width);
  const remainingDuration = Math.max(spec.duration * (remainingDistance / (window.innerWidth + spec.width * 2)), 18);

  cloud.className = "cloud";
  if (config.layerClass) {
    cloud.classList.add(config.layerClass);
  }
  cloud.style.opacity = spec.opacity.toFixed(2);
  cloud.style.setProperty("--cloud-float-duration", `${spec.floatDuration}s`);
  cloud.style.setProperty("--cloud-float-offset", `${spec.floatOffset}px`);

  cloudImageBase.className = "cloud__image cloud__image--base";
  cloudImageBase.src = spec.asset.base;
  cloudImageBase.alt = "";

  cloudImageSunset.className = "cloud__image cloud__image--sunset";
  cloudImageSunset.src = spec.asset.sunset;
  cloudImageSunset.alt = "";
  cloudImageSunset.setAttribute("aria-hidden", "true");

  cloudImageNight.className = "cloud__image cloud__image--night";
  cloudImageNight.src = spec.asset.night || spec.asset.base;
  cloudImageNight.alt = "";
  cloudImageNight.setAttribute("aria-hidden", "true");

  cloud.append(cloudImageBase, cloudImageSunset, cloudImageNight);
  placeCloud(cloud, startLeft, spec.top, spec.width, spec.laneIndex);

  layer.append(cloud);
  animateCloud(
    cloud,
    startLeft,
    endLeft,
    remainingDuration,
    timerStore,
    layer,
    () => spawnCloud(layer, timerStore, config),
    config.respawnMin,
    config.respawnSpread
  );
}

function createClouds() {
  const cloudLayerElement = document.getElementById("cloudLayer");
  const bottomCloudLayerElement = document.getElementById("bottomCloudLayer");
  if (!cloudLayerElement || !bottomCloudLayerElement) return;

  window.clearTimeout(cloudResizeFrame);
  clearTimers(cloudTimers);
  clearTimers(bottomCloudTimers);
  cloudLayerElement.innerHTML = "";
  bottomCloudLayerElement.innerHTML = "";

  const topConfig = {
    layer: cloudLayerElement,
    lanes: cloudLanes,
    minWidthRatio: 0.18,
    widthRatioSpread: 0.1,
    topJitter: 10,
    minOpacity: 0.92,
    opacitySpread: 0.08,
    minDuration: 52,
    durationSpread: 30,
    minFloatDuration: 12,
    floatDurationSpread: 7,
    minFloatOffset: 2,
    floatOffsetSpread: 2,
    minGap: cloudMinGap,
    maxClouds: 3,
    respawnMin: 300,
    respawnSpread: 700
  };

  const bottomConfig = {
    layer: bottomCloudLayerElement,
    lanes: bottomCloudLanes,
    minWidthRatio: 0.12,
    widthRatioSpread: 0.08,
    topJitter: 12,
    minOpacity: 0.93,
    opacitySpread: 0.05,
    minDuration: 40,
    durationSpread: 18,
    minFloatDuration: 11,
    floatDurationSpread: 6,
    minFloatOffset: 1.5,
    floatOffsetSpread: 1.5,
    minGap: bottomCloudMinGap,
    maxClouds: 4,
    respawnMin: 450,
    respawnSpread: 900,
    layerClass: "cloud--bottom"
  };

  spawnCloud(cloudLayerElement, cloudTimers, topConfig, {
    visible: true,
    minVisibleRatio: 0.28,
    maxVisibleRatio: 0.68
  });
  spawnCloud(bottomCloudLayerElement, bottomCloudTimers, bottomConfig, {
    visible: true,
    minVisibleRatio: 0.18,
    maxVisibleRatio: 0.46
  });
  spawnCloud(bottomCloudLayerElement, bottomCloudTimers, bottomConfig, {
    visible: true,
    minVisibleRatio: 0.52,
    maxVisibleRatio: 0.82
  });
  scheduleCloudSpawn(cloudLayerElement, cloudTimers, () => spawnCloud(cloudLayerElement, cloudTimers, topConfig), 900 + Math.random() * 1200);
  scheduleCloudSpawn(bottomCloudLayerElement, bottomCloudTimers, () => spawnCloud(bottomCloudLayerElement, bottomCloudTimers, bottomConfig), 700 + Math.random() * 900);
}

function resetSceneClasses() {
  document.body.classList.remove("scene-sunset", "scene-night");
}

function setLoadingProgress(value) {
  loadingProgress = Math.max(0, Math.min(value, 1));
  if (loadingBarFill) {
    loadingBarFill.style.transform = `scaleX(${loadingProgress})`;
  }
}

function markSceneReady() {
  setLoadingProgress(1);
  document.body.classList.remove("scene-loading");
  document.body.classList.add("scene-ready");
  window.setTimeout(() => {
    document.body.classList.add("scene-live");
  }, 0);
  if (loadingScreen) {
    window.setTimeout(() => {
      loadingScreen.classList.add("is-hidden");
    }, 40);
  }
}

function setScenePhase(phase) {
  resetSceneClasses();
  if (phase === "sunset") {
    document.body.classList.add("scene-sunset");
    return;
  }
  if (phase === "night") {
    document.body.classList.add("scene-sunset", "scene-night");
  }
}

function hasRenderableSceneState(sceneState) {
  return Boolean(sceneState?.phase);
}

function waitForImageElement(image) {
  if (!image) {
    return Promise.resolve();
  }

  if (image.complete && image.naturalWidth > 0) {
    return image.decode ? image.decode().catch(() => {}) : Promise.resolve();
  }

  return new Promise((resolve) => {
    const finish = () => {
      image.removeEventListener("load", finish);
      image.removeEventListener("error", finish);
      resolve();
    };

    image.addEventListener("load", finish, { once: true });
    image.addEventListener("error", finish, { once: true });
  }).then(() => (image.decode ? image.decode().catch(() => {}) : undefined));
}

async function preloadStartupAssets() {
  const mapUrls = Object.values(mapSceneAssets);
  const cloudUrls = cloudAssets.flatMap((asset) => [asset.base, asset.sunset, asset.night]).filter(Boolean);
  const uniqueCloudUrls = Array.from(new Set([...mapUrls, ...cloudUrls]));

  const assetPromises = uniqueCloudUrls.map((src) => {
    const image = new Image();
    image.decoding = "async";
    image.src = src;
    return waitForImageElement(image);
  });

  await Promise.all(assetPromises);
}

function setMapImageSource(image, src) {
  if (!image) return;
  if (!src) {
    image.removeAttribute("src");
    return;
  }
  if (image.getAttribute("src") !== src) {
    image.setAttribute("src", src);
  }
}

function getMapImageForPhase(phase) {
  return mapSceneAssets[phase] || mapSceneAssets.day;
}

function syncCloudPhase(phase) {
  resetSceneClasses();
  if (phase === "sunset") {
    document.body.classList.add("scene-sunset");
    return;
  }
  if (phase === "night") {
    document.body.classList.add("scene-sunset", "scene-night");
  }
}

function applySceneImmediately(phase, options = {}) {
  const { reveal = true } = options;
  const targetSrc = getMapImageForPhase(phase);

  if (mapStage) {
    mapStage.classList.remove("is-transitioning");
  }
  syncCloudPhase(phase);
  setMapImageSource(activeMapImage, targetSrc);
  activeMapImage.classList.add("is-visible");
  setMapImageSource(inactiveMapImage, "");
  inactiveMapImage.classList.remove("is-visible");
  currentScenePhase = phase;

  if (reveal) {
    markSceneReady();
  }
}

function transitionScene(phase) {
  const targetSrc = getMapImageForPhase(phase);

  if (!activeMapImage || !inactiveMapImage || currentScenePhase === phase) {
    applySceneImmediately(phase, { reveal: false });
    return;
  }

  syncCloudPhase(phase);
  setMapImageSource(inactiveMapImage, targetSrc);

  if (mapStage) {
    mapStage.classList.add("is-transitioning");
  }

  inactiveMapImage.classList.add("is-visible");

  window.requestAnimationFrame(() => {
    activeMapImage.classList.remove("is-visible");
  });

  const previousActive = activeMapImage;
  activeMapImage = inactiveMapImage;
  inactiveMapImage = previousActive;
  currentScenePhase = phase;

  window.setTimeout(() => {
    if (mapStage) {
      mapStage.classList.remove("is-transitioning");
    }
    inactiveMapImage.classList.remove("is-visible");
    setMapImageSource(inactiveMapImage, "");
  }, 10100);
}

function scheduleSceneRefresh(nextTransitionAt) {
  window.clearTimeout(sceneRefreshTimer);

  const delay = getNextRefreshDelay(nextTransitionAt);

  if (typeof delay !== "number") {
    return;
  }

  sceneRefreshTimer = window.setTimeout(() => {
    applyJejuSceneTiming({ initial: false });
  }, delay);
}

async function applyJejuSceneTiming(options = {}) {
  const { initial = false } = options;
  if (initial) {
    setLoadingProgress(0.35);
  }

  const cachedSceneState = getCachedJejuSceneState();

  try {
    const sceneState = await getJejuSceneState();
    if (!hasRenderableSceneState(sceneState)) {
      throw new Error("Missing required scene state");
    }

    if (initial) {
      setLoadingProgress(0.7);
      await preloadStartupAssets();
      setLoadingProgress(0.92);
      applySceneImmediately(sceneState.phase, { reveal: true });
    } else {
      transitionScene(sceneState.phase);
    }

    scheduleSceneRefresh(sceneState.nextTransitionAt);
  } catch {
    if (initial) {
      setLoadingProgress(0.92);
    }
    if (hasRenderableSceneState(cachedSceneState)) {
      if (initial) {
        await preloadStartupAssets();
        applySceneImmediately(cachedSceneState.phase, { reveal: true });
      } else {
        transitionScene(cachedSceneState.phase);
      }
      scheduleSceneRefresh(cachedSceneState.nextTransitionAt);
      return;
    }
  }
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

function init() {
  mapStage = document.getElementById("mapStage");
  mapImagePrimary = document.getElementById("mapImagePrimary");
  mapImageSecondary = document.getElementById("mapImageSecondary");
  activeMapImage = mapImagePrimary;
  inactiveMapImage = mapImageSecondary;
  cloudLayer = document.getElementById("cloudLayer");
  bottomCloudLayer = document.getElementById("bottomCloudLayer");
  backgroundAudio = document.getElementById("mapBackgroundAudio");
  loadingScreen = document.getElementById("loadingScreen");
  loadingBarFill = document.getElementById("loadingBarFill");

  setLoadingProgress(0.12);
  registerPwaShell();
  registerAudioStart();
  createClouds();
  setLoadingProgress(0.28);
  applyJejuSceneTiming({ initial: true });
  registerServiceWorker();

  window.addEventListener("resize", () => {
    if (cloudResizeFrame) {
      window.clearTimeout(cloudResizeFrame);
    }
    cloudResizeFrame = window.setTimeout(createClouds, 180);
  });
}

init();
