// Shared between app.js (listing) and game.js (detail page): storage key,
// boxart CDN fallback chain, played-state helpers, and the localStorage
// read/write helpers.
const IS_EN = document.documentElement.lang === 'en';
const STORAGE_KEY = 'md-played-overrides';
// set by localized pages (e.g. en/index.html, en/game.html) to reach data/ and assets/ at the site root
const BASE_PATH = window.BASE_PATH || '';
// jsdelivr mirrors the libretro-thumbnails GitHub repo through a real CDN (fast once warm,
// meant for hotlinking); thumbnails.libretro.com is the official host, used as fallback
// if jsdelivr ever fails to resolve a file.
const BOXART_SOURCES = [
  'https://cdn.jsdelivr.net/gh/libretro-thumbnails/Sega_-_Mega_Drive_-_Genesis@master/Named_Boxarts/',
  'https://thumbnails.libretro.com/Sega%20-%20Mega%20Drive%20-%20Genesis/Named_Boxarts/',
];
// generic cartridge icon, used when a title has no boxart mapping or the mapped image fails to load
const BOXART_PLACEHOLDER = `${BASE_PATH}assets/boxart-placeholder.svg`;

function loadOverrides() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveOverrides(overrides) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

function isPlayed(id, overrides, basePlayed) {
  if (Object.prototype.hasOwnProperty.call(overrides, id)) {
    return !!overrides[id].played;
  }
  return !!(basePlayed[id] && basePlayed[id].played);
}

// mutates `overrides` in place and persists it; caller re-renders/refreshes its own UI afterward
function togglePlayed(id, overrides, basePlayed) {
  const current = isPlayed(id, overrides, basePlayed);
  overrides[id] = { played: !current, dateAdded: new Date().toISOString().slice(0, 10) };
  saveOverrides(overrides);
}

function setBoxartImage(img, wrap, boxartFile) {
  if (!boxartFile) {
    img.src = BOXART_PLACEHOLDER;
    wrap.classList.add('no-boxart');
    return;
  }
  let sourceIndex = 0;
  img.src = BOXART_SOURCES[sourceIndex] + encodeURIComponent(boxartFile);
  img.addEventListener('error', () => {
    sourceIndex += 1;
    if (sourceIndex < BOXART_SOURCES.length) {
      img.src = BOXART_SOURCES[sourceIndex] + encodeURIComponent(boxartFile);
    } else {
      img.src = BOXART_PLACEHOLDER;
      wrap.classList.add('no-boxart');
    }
  });
}
