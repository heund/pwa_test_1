const JEJU_LOCATION = {
  latitude: 33.50914,
  longitude: 126.522426,
  timezone: "Asia/Seoul"
};

const SOLAR_API_URL = "https://api.sunrise-sunset.org/json";
const CACHE_PREFIX = "jeju-solar-v2";
const DAY_IN_MS = 24 * 60 * 60 * 1000;

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

  const sunrise = toDate(today.sunrise);
  const sunset = toDate(today.sunset);
  const civilTwilightEnd = toDate(today.civilTwilightEnd);

  if (!sunrise || !sunset || !civilTwilightEnd) {
    return null;
  }

  if (now < sunrise) {
    return {
      phase: "night",
      nextTransitionAt: today.sunrise,
      solar: { today }
    };
  }

  if (now < sunset) {
    return {
      phase: "day",
      nextTransitionAt: today.sunset,
      solar: { today }
    };
  }

  if (now < civilTwilightEnd) {
    return {
      phase: "sunset",
      nextTransitionAt: today.civilTwilightEnd,
      solar: { today }
    };
  }

  const tomorrowKey = shiftJejuDate(todayKey, 1);
  const tomorrow = readCachedSolar(tomorrowKey);

  if (!tomorrow?.sunrise) {
    return {
      phase: "night",
      nextTransitionAt: null,
      solar: { today }
    };
  }

  return {
    phase: "night",
    nextTransitionAt: tomorrow.sunrise,
    solar: { today, tomorrow }
  };
}

export async function getJejuSceneState(now = new Date()) {
  const todayKey = getJejuDateString(now);
  const today = await getSolarForDate(todayKey);
  const sunrise = toDate(today.sunrise);
  const sunset = toDate(today.sunset);
  const civilTwilightEnd = toDate(today.civilTwilightEnd);

  if (!sunrise || !sunset || !civilTwilightEnd) {
    throw new Error("Missing required solar timing data");
  }

  if (now < sunrise) {
    return {
      phase: "night",
      nextTransitionAt: today.sunrise,
      solar: { today }
    };
  }

  if (now < sunset) {
    return {
      phase: "day",
      nextTransitionAt: today.sunset,
      solar: { today }
    };
  }

  if (now < civilTwilightEnd) {
    return {
      phase: "sunset",
      nextTransitionAt: today.civilTwilightEnd,
      solar: { today }
    };
  }

  const tomorrowKey = shiftJejuDate(todayKey, 1);
  const tomorrow = await getSolarForDate(tomorrowKey);

  if (!tomorrow?.sunrise) {
    throw new Error("Missing next sunrise timing data");
  }

  return {
    phase: "night",
    nextTransitionAt: tomorrow.sunrise,
    solar: { today, tomorrow }
  };
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
