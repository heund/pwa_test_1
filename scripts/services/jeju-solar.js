const JEJU_LOCATION = {
  latitude: 33.50914,
  longitude: 126.522426,
  timezone: "Asia/Seoul"
};

const SOLAR_API_URL = "https://api.sunrise-sunset.org/json";
const CACHE_PREFIX = "jeju-solar-v2";
const MINUTE_IN_MS = 60 * 1000;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const SUNSET_BLEND_START_OFFSET_MS = 44 * MINUTE_IN_MS;

function getJejuDateString(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: JEJU_LOCATION.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);
}

function shiftJejuDate(dateString, days) {
  const base = new Date(`${dateString}T00:00:00+09:00`);
  base.setUTCDate(base.getUTCDate() + days);
  return getJejuDateString(base);
}

function getCacheKey(dateString) {
  return `${CACHE_PREFIX}:${dateString}`;
}

function readCachedSolar(dateString) {
  try {
    const raw = window.localStorage.getItem(getCacheKey(dateString));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCachedSolar(dateString, payload) {
  try {
    window.localStorage.setItem(getCacheKey(dateString), JSON.stringify(payload));
  } catch {
    // Ignore storage failures.
  }
}

function toDate(value) {
  return value ? new Date(value) : null;
}

function clamp01(value) {
  return Math.max(0, Math.min(value, 1));
}

function smoothstep(value) {
  const amount = clamp01(value);
  return amount * amount * (3 - 2 * amount);
}

function progressBetween(now, start, end) {
  const duration = end.getTime() - start.getTime();
  if (duration <= 0) {
    return now >= end ? 1 : 0;
  }

  return clamp01((now.getTime() - start.getTime()) / duration);
}

function buildVisualState(now, civilTwilightBegin, sunrise, sunset, civilTwilightEnd) {
  const sunsetStart = new Date(sunset.getTime() - SUNSET_BLEND_START_OFFSET_MS);
  const sunsetProgress = smoothstep(progressBetween(now, sunsetStart, sunset));
  const duskNightProgress = smoothstep(progressBetween(now, sunset, civilTwilightEnd));
  const dawnNightProgress = 1 - smoothstep(progressBetween(now, civilTwilightBegin, sunrise));
  const nightProgress = now < sunrise ? dawnNightProgress : duskNightProgress;
  const isDawnTransition = now >= civilTwilightBegin && now < sunrise;
  const isDuskTransition = sunsetProgress > 0 && duskNightProgress < 1;

  return {
    sunsetOpacity: now < sunrise ? 0 : sunsetProgress,
    nightOpacity: nightProgress,
    dayStartAt: sunrise.toISOString(),
    dawnStartAt: civilTwilightBegin.toISOString(),
    sunsetStartAt: sunsetStart.toISOString(),
    sunsetFullAt: sunset.toISOString(),
    nightFullAt: civilTwilightEnd.toISOString(),
    isTransitioning: isDawnTransition || isDuskTransition
  };
}

function buildSceneState(now, today, tomorrow = null) {
  const sunrise = toDate(today.sunrise);
  const civilTwilightBegin = toDate(today.civilTwilightBegin);
  const sunset = toDate(today.sunset);
  const civilTwilightEnd = toDate(today.civilTwilightEnd);

  if (!sunrise || !civilTwilightBegin || !sunset || !civilTwilightEnd) {
    return null;
  }

  const sunsetStart = new Date(sunset.getTime() - SUNSET_BLEND_START_OFFSET_MS);
  const visual = buildVisualState(now, civilTwilightBegin, sunrise, sunset, civilTwilightEnd);

  if (now < civilTwilightBegin) {
    return {
      phase: "night",
      nextTransitionAt: today.civilTwilightBegin,
      visual: {
        ...visual,
        isTransitioning: false
      },
      solar: { today }
    };
  }

  if (now < sunrise) {
    return {
      phase: "night",
      nextTransitionAt: today.sunrise,
      visual,
      solar: { today }
    };
  }

  if (now < sunsetStart) {
    return {
      phase: "day",
      nextTransitionAt: visual.sunsetStartAt,
      visual: {
        ...visual,
        sunsetOpacity: 0,
        nightOpacity: 0,
        isTransitioning: false
      },
      solar: { today }
    };
  }

  if (now < sunset) {
    return {
      phase: "day",
      nextTransitionAt: today.sunset,
      visual,
      solar: { today }
    };
  }

  if (now < civilTwilightEnd) {
    return {
      phase: "sunset",
      nextTransitionAt: today.civilTwilightEnd,
      visual,
      solar: { today }
    };
  }

  if (!tomorrow?.sunrise) {
    return {
      phase: "night",
      nextTransitionAt: null,
      visual: {
        ...visual,
        sunsetOpacity: 1,
        nightOpacity: 1,
        isTransitioning: false
      },
      solar: { today }
    };
  }

  return {
    phase: "night",
    nextTransitionAt: tomorrow.sunrise,
    visual: {
      ...visual,
      sunsetOpacity: 1,
      nightOpacity: 1,
      isTransitioning: false
    },
    solar: { today, tomorrow }
  };
}

async function fetchSolarForDate(dateString) {
  const url = new URL(SOLAR_API_URL);
  url.searchParams.set("lat", String(JEJU_LOCATION.latitude));
  url.searchParams.set("lng", String(JEJU_LOCATION.longitude));
  url.searchParams.set("formatted", "0");
  url.searchParams.set("tzid", JEJU_LOCATION.timezone);
  url.searchParams.set("date", dateString);

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Solar API request failed with ${response.status}`);
  }

  const payload = await response.json();
  if (!payload || payload.status !== "OK" || !payload.results) {
    throw new Error("Solar API returned an invalid payload");
  }

  const solar = {
    date: dateString,
    timezone: JEJU_LOCATION.timezone,
    latitude: JEJU_LOCATION.latitude,
    longitude: JEJU_LOCATION.longitude,
    sunrise: payload.results.sunrise,
    sunset: payload.results.sunset,
    civilTwilightBegin: payload.results.civil_twilight_begin,
    civilTwilightEnd: payload.results.civil_twilight_end,
    nauticalTwilightBegin: payload.results.nautical_twilight_begin,
    nauticalTwilightEnd: payload.results.nautical_twilight_end
  };

  writeCachedSolar(dateString, solar);
  return solar;
}

async function getSolarForDate(dateString) {
  const cached = readCachedSolar(dateString);
  if (cached) {
    return cached;
  }

  return fetchSolarForDate(dateString);
}

export function getCachedJejuSceneState(now = new Date()) {
  const todayKey = getJejuDateString(now);
  const today = readCachedSolar(todayKey);

  if (!today) {
    return null;
  }

  const baseSceneState = buildSceneState(now, today);
  if (!baseSceneState) {
    return null;
  }

  if (baseSceneState.nextTransitionAt !== null || baseSceneState.phase !== "night") {
    return baseSceneState;
  }

  const tomorrowKey = shiftJejuDate(todayKey, 1);
  const tomorrow = readCachedSolar(tomorrowKey);
  return buildSceneState(now, today, tomorrow);
}

export async function getJejuSceneState(now = new Date()) {
  const todayKey = getJejuDateString(now);
  const today = await getSolarForDate(todayKey);
  const baseSceneState = buildSceneState(now, today);
  if (!baseSceneState) {
    throw new Error("Missing required solar timing data");
  }

  if (baseSceneState.nextTransitionAt !== null || baseSceneState.phase !== "night") {
    return baseSceneState;
  }

  const tomorrowKey = shiftJejuDate(todayKey, 1);
  const tomorrow = await getSolarForDate(tomorrowKey);
  const sceneState = buildSceneState(now, today, tomorrow);
  if (!sceneState?.nextTransitionAt) {
    throw new Error("Missing next sunrise timing data");
  }

  return sceneState;
}

export function getNextRefreshDelay(nextTransitionAt, now = new Date()) {
  if (!nextTransitionAt) {
    return null;
  }

  return Math.max(new Date(nextTransitionAt).getTime() - now.getTime(), 0) + 150;
}

export function getJejuDateAfter(now = new Date(), days = 1) {
  return getJejuDateString(new Date(now.getTime() + days * DAY_IN_MS));
}
