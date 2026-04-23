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

const TEST_SCENE_STATES = {
  day: {
    phase: "day",
    label: "DAY",
    simulatedNow: "2026-04-23T14:00:00+09:00"
  },
  night: {
    phase: "night",
    label: "NIGHT",
    simulatedNow: "2026-04-23T22:00:00+09:00"
  }
};

const AUDIO_ENABLED = false;

let mapStage;
let mapImageDay;
let mapImageSunset;
let mapImageNight;
let cloudLayer;
let bottomCloudLayer;
let backgroundAudio;
let loadingScreen;
let loadingBarFill;
let cloudTimers = [];
let bottomCloudTimers = [];
let cloudResizeFrame = 0;
let sceneRefreshTimer = 0;
let sceneVisualTimer = 0;
let lifecycleSyncTimer = 0;
let isAudioStarting = false;
let hasStartedAudio = false;
let loadingProgress = 0;
let loadingTargetProgress = 0;
let loadingProgressFrame = 0;
let loadingProgressLastTick = 0;
let loadingCompletionWaiters = [];
let loadingTrickleTimer = 0;
let loadingTrickleCap = 0;
let currentScenePhase = null;
let mapStateSyncPromise = null;
const preloadedAssetPromises = new Map();
let testModePanel;
let testModePhaseValue;
let testModeTimeValue;
let testModeBrowserTimeValue;
let testModeNextTimeValue;
let testModeCountdownValue;
let testModeLogList;
let testModeClockTimer = 0;
let lastTestSceneState = null;
let testScenePhase = "day";

const cloudLanes = [0.02, 0.07, 0.11, 0.15];
const bottomCloudLanes = [0.78, 0.84, 0.9, 0.95];
const cloudMinGap = 110;
const bottomCloudMinGap = 90;

function isTestMode() {
  return document.body?.dataset.sceneMode === "test-cycle";
}

function logSceneDebug(message, details) {
  if (details === undefined) {
    console.log(`[jeju-map] ${message}`);
    return;
  }

  console.log(`[jeju-map] ${message}`, details);
}

function isStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

async function startBackgroundAudio() {
  if (!AUDIO_ENABLED) return;
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
  if (!AUDIO_ENABLED) {
    if (backgroundAudio) {
      backgroundAudio.pause();
      backgroundAudio.currentTime = 0;
      backgroundAudio.muted = true;
    }
    return;
  }

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

function clearSceneRefreshTimer() {
  if (!sceneRefreshTimer) return;
  window.clearTimeout(sceneRefreshTimer);
  sceneRefreshTimer = 0;
}

function clearSceneVisualTimer() {
  if (!sceneVisualTimer) return;
  window.clearTimeout(sceneVisualTimer);
  sceneVisualTimer = 0;
}

function flushLoadingWaiters() {
  const remainingWaiters = [];

  loadingCompletionWaiters.forEach(({ minProgress, resolve }) => {
    if (loadingProgress >= minProgress) {
      resolve();
      return;
    }

    remainingWaiters.push({ minProgress, resolve });
  });

  loadingCompletionWaiters = remainingWaiters;
}

function clearLoadingTrickle() {
  if (!loadingTrickleTimer) return;
  window.clearTimeout(loadingTrickleTimer);
  loadingTrickleTimer = 0;
}

function renderLoadingProgress() {
  if (loadingBarFill) {
    loadingBarFill.style.transform = `scaleX(${loadingProgress})`;
  }
  flushLoadingWaiters();
}

function tickLoadingProgress(timestamp) {
  if (!loadingProgressLastTick) {
    loadingProgressLastTick = timestamp;
  }

  const deltaMs = Math.max(timestamp - loadingProgressLastTick, 16);
  loadingProgressLastTick = timestamp;

  const isCompleting = loadingTargetProgress >= 1;
  const speedPerMs = isCompleting ? 0.0022 : 0.00023;
  const nextStep = deltaMs * speedPerMs;
  const remaining = loadingTargetProgress - loadingProgress;

  if (Math.abs(remaining) <= nextStep) {
    loadingProgress = loadingTargetProgress;
    loadingProgressFrame = 0;
    loadingProgressLastTick = 0;
    renderLoadingProgress();
    return;
  }

  loadingProgress += Math.sign(remaining) * nextStep;
  renderLoadingProgress();
  loadingProgressFrame = window.requestAnimationFrame(tickLoadingProgress);
}

function waitForLoadingProgress(minProgress = 1) {
  if (loadingProgress >= minProgress) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    loadingCompletionWaiters.push({ minProgress, resolve });
  });
}

function scheduleLoadingTrickle() {
  clearLoadingTrickle();

  if (!loadingTrickleCap || loadingProgress >= loadingTrickleCap) {
    return;
  }

  const remaining = loadingTrickleCap - loadingProgress;
  const nextIncrement = Math.max(0.006, Math.min(0.022, remaining * 0.18));
  const nextTarget = Math.min(loadingTrickleCap, loadingProgress + nextIncrement);

  loadingTrickleTimer = window.setTimeout(() => {
    loadingTrickleTimer = 0;
    setLoadingProgress(nextTarget);
    scheduleLoadingTrickle();
  }, 220 + Math.random() * 180);
}

function startLoadingTrickle(cap = 0.84) {
  loadingTrickleCap = Math.max(loadingProgress, Math.min(cap, 0.94));
  scheduleLoadingTrickle();
}

function formatClockTime(value, timeZone = "Asia/Seoul") {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(value);
}

function pushTestModeLog(message) {
  if (!isTestMode()) return;

  ensureTestModePanel();

  const timestamp = formatClockTime(new Date(), "Asia/Seoul");
  const entry = `[${timestamp}] ${message}`;
  console.log(`[map-test] ${entry}`);

  if (!testModeLogList) return;

  const item = document.createElement("li");
  item.textContent = entry;
  testModeLogList.prepend(item);

  while (testModeLogList.children.length > 8) {
    testModeLogList.removeChild(testModeLogList.lastElementChild);
  }
}

function logTestImageState(label, image) {
  if (!isTestMode() || !image) return;

  const src = image.getAttribute("src") || "(none)";
  const currentSrc = image.currentSrc || "(empty)";
  const complete = image.complete ? "complete" : "pending";
  const size = `${image.naturalWidth || 0}x${image.naturalHeight || 0}`;
  pushTestModeLog(`${label}: src=${src} current=${currentSrc} ${complete} ${size}`);
}

function updateTestModeClock() {
  if (!isTestMode() || !lastTestSceneState) return;

  ensureTestModePanel();

  if (testModeBrowserTimeValue) {
    testModeBrowserTimeValue.textContent = formatClockTime(new Date(), "Asia/Seoul");
  }

  if (testModeTimeValue) {
    const simulatedNow = lastTestSceneState?.testMode?.simulatedNow;
    testModeTimeValue.textContent = simulatedNow ? formatClockTime(new Date(simulatedNow), "Asia/Seoul") : "-";
  }

  if (testModeNextTimeValue) {
    const nextTransitionAt = lastTestSceneState?.nextTransitionAt;
    testModeNextTimeValue.textContent = nextTransitionAt ? formatClockTime(new Date(nextTransitionAt), "Asia/Seoul") : "manual";
  }

  if (testModeCountdownValue) {
    testModeCountdownValue.textContent = lastTestSceneState?.nextTransitionAt ? "active" : "paused";
  }
}

function startTestModeClock() {
  if (!isTestMode() || testModeClockTimer) return;

  const tick = () => {
    updateTestModeClock();
    testModeClockTimer = window.setTimeout(tick, 1000);
  };

  updateTestModeClock();
  testModeClockTimer = window.setTimeout(tick, 1000);
}

function getTestSceneState() {
  const scene = TEST_SCENE_STATES[testScenePhase] || TEST_SCENE_STATES.day;
  const visual = scene.phase === "night"
    ? { sunsetOpacity: 1, nightOpacity: 1, isTransitioning: false }
    : { sunsetOpacity: 0, nightOpacity: 0, isTransitioning: false };

  return {
    phase: scene.phase,
    nextTransitionAt: null,
    visual,
    testMode: {
      label: scene.label,
      simulatedNow: scene.simulatedNow
    }
  };
}

function setTestScenePhase(phase) {
  if (!TEST_SCENE_STATES[phase]) {
    return;
  }

  testScenePhase = phase;
}

function triggerTestScenePhase(phase) {
  setTestScenePhase(phase);
  pushTestModeLog(`Manual scene request: ${phase}`);
  syncMapState();
}

function showTestSceneImmediately(phase) {
  if (!TEST_SCENE_STATES[phase]) {
    return;
  }

  setTestScenePhase(phase);
  const sceneState = getTestSceneState();
  pushTestModeLog(`Immediate scene apply: ${phase}`);
  applySceneImmediately(sceneState.phase, { reveal: false });
  updateTestModePanel(sceneState);
}

function ensureTestModePanel() {
  if (!isTestMode() || testModePanel) return;

  testModePanel = document.createElement("aside");
  testModePanel.className = "test-mode-panel";
  testModePanel.setAttribute("aria-live", "polite");
  testModePanel.innerHTML = `
    <strong class="test-mode-panel__title">Scene Test</strong>
    <span class="test-mode-panel__row">Phase <b id="testModePhaseValue">-</b></span>
    <span class="test-mode-panel__row">Browser time <b id="testModeBrowserTimeValue">-</b></span>
    <span class="test-mode-panel__row">Jeju time <b id="testModeTimeValue">-</b></span>
    <span class="test-mode-panel__row">Next change <b id="testModeNextTimeValue">-</b></span>
    <span class="test-mode-panel__row">Countdown <b id="testModeCountdownValue">-</b></span>
    <div class="test-mode-panel__actions">
      <button class="test-mode-panel__button" id="testModeRunNightButton" type="button">Run Day to Night</button>
      <button class="test-mode-panel__button" id="testModeRunDayButton" type="button">Run Night to Day</button>
      <button class="test-mode-panel__button test-mode-panel__button--secondary" id="testModeShowNightButton" type="button">Show Night Direct</button>
      <button class="test-mode-panel__button test-mode-panel__button--secondary" id="testModeShowDayButton" type="button">Show Day Direct</button>
      <button class="test-mode-panel__button test-mode-panel__button--secondary" id="testModeResetDayButton" type="button">Reset to Day</button>
    </div>
    <span class="test-mode-panel__hint">Automatic test transitions paused</span>
    <ul class="test-mode-panel__log" id="testModeLogList"></ul>
  `;

  document.body.append(testModePanel);
  testModePhaseValue = document.getElementById("testModePhaseValue");
  testModeBrowserTimeValue = document.getElementById("testModeBrowserTimeValue");
  testModeTimeValue = document.getElementById("testModeTimeValue");
  testModeNextTimeValue = document.getElementById("testModeNextTimeValue");
  testModeCountdownValue = document.getElementById("testModeCountdownValue");
  testModeLogList = document.getElementById("testModeLogList");
  document.getElementById("testModeRunNightButton")?.addEventListener("click", () => {
    triggerTestScenePhase("night");
  });
  document.getElementById("testModeRunDayButton")?.addEventListener("click", () => {
    triggerTestScenePhase("day");
  });
  document.getElementById("testModeShowNightButton")?.addEventListener("click", () => {
    showTestSceneImmediately("night");
  });
  document.getElementById("testModeShowDayButton")?.addEventListener("click", () => {
    showTestSceneImmediately("day");
  });
  document.getElementById("testModeResetDayButton")?.addEventListener("click", () => {
    showTestSceneImmediately("day");
  });
}

function updateTestModePanel(sceneState) {
  if (!isTestMode()) return;

  ensureTestModePanel();
  lastTestSceneState = sceneState;

  if (testModePhaseValue) {
    testModePhaseValue.textContent = sceneState?.testMode?.label || sceneState?.phase || "-";
  }

  updateTestModeClock();
  startTestModeClock();
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
  loadingTargetProgress = Math.max(loadingProgress, Math.min(value, 1));

  if (loadingProgressFrame) {
    return;
  }

  loadingProgressFrame = window.requestAnimationFrame(tickLoadingProgress);
}

function markSceneReady() {
  clearLoadingTrickle();
  loadingTrickleCap = 0;
  setLoadingProgress(1);
  waitForLoadingProgress(0.995).then(() => {
    document.body.classList.remove("scene-loading");
    document.body.classList.add("scene-ready");
    window.setTimeout(() => {
      document.body.classList.add("scene-live");
    }, 0);
    if (loadingScreen) {
      window.setTimeout(() => {
        loadingScreen.classList.add("is-hidden");
      }, 120);
    }
  });
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

function setMapImageSource(image, src) {
  if (!image || !src) return;
  if (image.getAttribute("src") !== src) {
    image.setAttribute("src", src);
  }
}

function getMapImageElementForPhase(phase) {
  if (phase === "sunset") {
    return mapImageSunset;
  }
  if (phase === "night") {
    return mapImageNight;
  }
  return mapImageDay;
}

function getMapAssetLoadOrder(sceneState) {
  const visual = sceneState?.visual || getVisualStateForPhase(sceneState?.phase);
  const sunsetOpacity = Number(visual.sunsetOpacity || 0);
  const nightOpacity = Number(visual.nightOpacity || 0);

  if (nightOpacity >= 0.95) {
    return ["night", "day", "sunset"];
  }

  if (nightOpacity > 0 && sunsetOpacity > 0) {
    return ["night", "sunset", "day"];
  }

  if (nightOpacity > 0) {
    return ["night", "day", "sunset"];
  }

  if (sunsetOpacity > 0.5) {
    return ["sunset", "day", "night"];
  }

  return ["day", "sunset", "night"];
}

async function loadMapImagesInPriorityOrder(sceneState) {
  const orderedPhases = getMapAssetLoadOrder(sceneState);

  orderedPhases.forEach((phase) => {
    setMapImageSource(getMapImageElementForPhase(phase), mapSceneAssets[phase]);
  });

  const firstPhase = orderedPhases[0];
  await ensureAssetReady(mapSceneAssets[firstPhase]);
  await waitForImageElement(getMapImageElementForPhase(firstPhase));

  await Promise.all(
    orderedPhases.slice(1).map(async (phase) => {
      await ensureAssetReady(mapSceneAssets[phase]);
      await waitForImageElement(getMapImageElementForPhase(phase));
    })
  );
}

async function preloadStartupAssets(sceneState) {
  await loadMapImagesInPriorityOrder(sceneState);

  const cloudUrls = cloudAssets.flatMap((asset) => [asset.base, asset.sunset, asset.night]).filter(Boolean);
  const uniqueCloudUrls = Array.from(new Set(cloudUrls));

  const assetPromises = uniqueCloudUrls.map((src) => ensureAssetReady(src));

  await Promise.all(assetPromises);
}

function ensureAssetReady(src) {
  if (!src) {
    return Promise.resolve();
  }

  if (!preloadedAssetPromises.has(src)) {
    const image = new Image();
    image.decoding = "async";
    image.src = src;
    preloadedAssetPromises.set(src, waitForImageElement(image));
  }

  return preloadedAssetPromises.get(src);
}

function syncSceneClass(phase) {
  resetSceneClasses();
  if (phase === "sunset") {
    document.body.classList.add("scene-sunset");
    return;
  }
  if (phase === "night") {
    document.body.classList.add("scene-sunset", "scene-night");
  }
}

function getVisualStateForPhase(phase) {
  if (phase === "night") {
    return { sunsetOpacity: 1, nightOpacity: 1, isTransitioning: false };
  }
  if (phase === "sunset") {
    return { sunsetOpacity: 1, nightOpacity: 0, isTransitioning: false };
  }
  return { sunsetOpacity: 0, nightOpacity: 0, isTransitioning: false };
}

function applySceneVisualState(visual = {}) {
  const sunsetOpacity = Math.max(0, Math.min(Number(visual.sunsetOpacity || 0), 1));
  const nightOpacity = Math.max(0, Math.min(Number(visual.nightOpacity || 0), 1));
  const dayCloudOpacity = Math.max(0, 1 - Math.max(sunsetOpacity, nightOpacity));
  const sunsetCloudOpacity = Math.max(0, sunsetOpacity * (1 - nightOpacity));

  document.documentElement.style.setProperty("--sunset-opacity", sunsetOpacity.toFixed(4));
  document.documentElement.style.setProperty("--night-opacity", nightOpacity.toFixed(4));
  document.documentElement.style.setProperty("--day-cloud-opacity", dayCloudOpacity.toFixed(4));
  document.documentElement.style.setProperty("--sunset-cloud-opacity", sunsetCloudOpacity.toFixed(4));
}

function snapSceneVisualState(callback) {
  document.body.classList.add("scene-syncing");
  callback();
  window.requestAnimationFrame(() => {
    document.body.classList.remove("scene-syncing");
  });
}

function applySceneImmediately(phase, options = {}) {
  const { reveal = true, visual = null } = options;

  if (mapStage) {
    mapStage.classList.remove("is-transitioning");
  }
  syncSceneClass(phase);
  applySceneVisualState(visual || getVisualStateForPhase(phase));
  currentScenePhase = phase;

  if (reveal) {
    markSceneReady();
  }
}

function scheduleSceneRefresh(nextTransitionAt) {
  clearSceneRefreshTimer();
  if (isTestMode()) {
    pushTestModeLog("Automatic scheduling paused in manual test mode");
    return;
  }

  const delay = isTestMode()
    ? Math.max(new Date(nextTransitionAt).getTime() - Date.now(), 0)
    : getNextRefreshDelay(nextTransitionAt);

  if (typeof delay !== "number") {
    logSceneDebug("No next refresh scheduled", {
      nextTransitionAt: nextTransitionAt || null
    });
    return;
  }

  logSceneDebug("Scheduled next scene refresh", {
    nextTransitionAt,
    delayMs: delay
  });

  sceneRefreshTimer = window.setTimeout(() => {
    sceneRefreshTimer = 0;
    logSceneDebug("Scheduled scene refresh fired", {
      firedAt: new Date().toISOString()
    });
    syncMapState();
  }, delay);
}

function scheduleSceneVisualRefresh(sceneState) {
  clearSceneVisualTimer();
  if (isTestMode() || !sceneState?.visual?.isTransitioning) {
    return;
  }

  sceneVisualTimer = window.setTimeout(() => {
    sceneVisualTimer = 0;
    syncMapState();
  }, 30000);
}

async function getInitialSceneState() {
  if (isTestMode()) {
    return getTestSceneState();
  }

  const cachedSceneState = getCachedJejuSceneState();
  logSceneDebug("Initial scene sync started", {
    now: new Date().toISOString(),
    cachedPhase: cachedSceneState?.phase || null,
    cachedNextTransitionAt: cachedSceneState?.nextTransitionAt || null
  });

  try {
    const sceneState = await getJejuSceneState();
    if (!hasRenderableSceneState(sceneState)) {
      throw new Error("Missing required scene state");
    }
    logSceneDebug("Fetched Jeju solar scene state", sceneState);
    return sceneState;
  } catch {
    logSceneDebug("Initial solar fetch failed; falling back to cached scene if available", {
      cachedPhase: cachedSceneState?.phase || null,
      cachedNextTransitionAt: cachedSceneState?.nextTransitionAt || null
    });
    if (hasRenderableSceneState(cachedSceneState)) {
      return cachedSceneState;
    }
    throw new Error("Unable to resolve initial scene state");
  }
}

async function getRuntimeSceneState() {
  if (isTestMode()) {
    return getTestSceneState();
  }

  const cachedSceneState = getCachedJejuSceneState();
  logSceneDebug("Runtime scene sync started", {
    now: new Date().toISOString(),
    cachedPhase: cachedSceneState?.phase || null,
    cachedNextTransitionAt: cachedSceneState?.nextTransitionAt || null
  });

  if (
    hasRenderableSceneState(cachedSceneState) &&
    (cachedSceneState.nextTransitionAt || cachedSceneState.phase !== "night")
  ) {
    logSceneDebug("Using cached Jeju solar scene state", cachedSceneState);
    return cachedSceneState;
  }

  const sceneState = await getJejuSceneState();
  if (!hasRenderableSceneState(sceneState)) {
    throw new Error("Missing required runtime scene state");
  }

  logSceneDebug("Fetched fresh Jeju solar scene state", sceneState);
  return sceneState;
}

function applyRuntimeSceneState(sceneState, options = {}) {
  const { instant = false } = options;
  if (!hasRenderableSceneState(sceneState)) {
    return;
  }

  const applyState = () => {
    syncSceneClass(sceneState.phase);
    applySceneVisualState(sceneState.visual || getVisualStateForPhase(sceneState.phase));
    currentScenePhase = sceneState.phase;
  };

  if (currentScenePhase === null) {
    applySceneImmediately(sceneState.phase, { reveal: false, visual: sceneState.visual });
    return;
  }

  if (currentScenePhase !== sceneState.phase) {
    if (isTestMode()) {
      pushTestModeLog(`Applying scene transition: ${currentScenePhase || "none"} -> ${sceneState.phase}`);
    }
    logSceneDebug("Applying scene transition", {
      from: currentScenePhase,
      to: sceneState.phase
    });
    if (instant) {
      snapSceneVisualState(applyState);
    } else {
      applyState();
    }
    return;
  }

  if (isTestMode()) {
    pushTestModeLog(`Scene already correct: ${sceneState.phase}`);
  }
  logSceneDebug("Scene already correct", {
    phase: sceneState.phase
  });
  if (instant) {
    snapSceneVisualState(applyState);
  } else {
    applyState();
  }
}

function syncMapState(options = {}) {
  const { initial = false, instant = false } = options;

  if (mapStateSyncPromise) {
    return mapStateSyncPromise;
  }

  mapStateSyncPromise = (async () => {
    clearSceneRefreshTimer();
    clearSceneVisualTimer();

    if (initial) {
      setLoadingProgress(0.35);
      startLoadingTrickle(0.78);
    }

    try {
      const sceneState = initial
        ? await getInitialSceneState()
        : await getRuntimeSceneState();

      if (isTestMode()) {
        pushTestModeLog(`syncMapState resolved phase "${sceneState.phase}"`);
      }
      logSceneDebug("syncMapState resolved scene", {
        initial,
        phase: sceneState.phase,
        nextTransitionAt: sceneState.nextTransitionAt || null
      });

      if (initial) {
        setLoadingProgress(0.52);
        await preloadStartupAssets(sceneState);
        setLoadingProgress(0.76);
        startLoadingTrickle(0.88);
        applySceneImmediately(sceneState.phase, { reveal: true, visual: sceneState.visual });
      } else {
        applyRuntimeSceneState(sceneState, { instant });
      }

      updateTestModePanel(sceneState);
      scheduleSceneRefresh(sceneState.nextTransitionAt);
      scheduleSceneVisualRefresh(sceneState);
    } catch {
      if (initial) {
        clearLoadingTrickle();
        loadingTrickleCap = 0;
        setLoadingProgress(0.7);
      }
    }
  })().finally(() => {
    mapStateSyncPromise = null;
  });

  return mapStateSyncPromise;
}

function requestMapStateSync() {
  if (lifecycleSyncTimer) {
    return;
  }

  // Background tabs can throttle timers for long periods, so resync on resume.
  lifecycleSyncTimer = window.setTimeout(() => {
    lifecycleSyncTimer = 0;
    if (isTestMode()) {
      pushTestModeLog("Lifecycle resync requested");
    }
    logSceneDebug("Lifecycle resync requested", {
      at: new Date().toISOString()
    });
    syncMapState({ instant: true });
  }, 0);
}

function registerMapStateLifecycleSync() {
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      requestMapStateSync();
    }
  });

  window.addEventListener("pageshow", requestMapStateSync);
  window.addEventListener("focus", requestMapStateSync);
}

async function disableServiceWorkersForPrototype() {
  if ("serviceWorker" in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    } catch {
      // Ignore service worker cleanup failures during prototype mode.
    }
  }

  if ("caches" in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
    } catch {
      // Ignore cache cleanup failures during prototype mode.
    }
  }
}

function init() {
  mapStage = document.getElementById("mapStage");
  mapImageDay = document.getElementById("mapImageDay");
  mapImageSunset = document.getElementById("mapImageSunset");
  mapImageNight = document.getElementById("mapImageNight");
  cloudLayer = document.getElementById("cloudLayer");
  bottomCloudLayer = document.getElementById("bottomCloudLayer");
  backgroundAudio = document.getElementById("mapBackgroundAudio");
  loadingScreen = document.getElementById("loadingScreen");
  loadingBarFill = document.getElementById("loadingBarFill");

  if (isTestMode()) {
    ensureTestModePanel();
    pushTestModeLog("Test mode initialized");
  }

  [mapImageDay, mapImageSunset, mapImageNight].forEach((image, index) => {
    if (!image) return;

    image.addEventListener("load", () => {
      logTestImageState(`img${index + 1} load`, image);
    });

    image.addEventListener("error", () => {
      logTestImageState(`img${index + 1} error`, image);
    });
  });

  setLoadingProgress(0.12);
  registerPwaShell();
  void disableServiceWorkersForPrototype();
  registerAudioStart();
  createClouds();
  setLoadingProgress(0.28);
  syncMapState({ initial: true });
  registerMapStateLifecycleSync();

  window.addEventListener("resize", () => {
    if (cloudResizeFrame) {
      window.clearTimeout(cloudResizeFrame);
    }
    cloudResizeFrame = window.setTimeout(createClouds, 180);
  });
}

init();
