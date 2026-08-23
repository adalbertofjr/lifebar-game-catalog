// Shared between app.js (listing) and game.js (detail page): storage key,
// boxart CDN fallback chain, played-state helpers, and the localStorage
// read/write helpers.
const IS_EN = document.documentElement.lang === 'en';
const STORAGE_KEY = 'md-played-overrides';
// favoritos de infância (item 2 do ROADMAP): só localStorage, sem arquivo base
// data/favorites.json (ao contrário de "jogado") - mas incluído no mesmo
// mecanismo de exportar/importar de app.js (campo "favorite" por jogo)
const FAVORITE_STORAGE_KEY = 'md-favorite-overrides';
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

function loadJsonMap(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch {
    return {};
  }
}

function saveJsonMap(key, map) {
  localStorage.setItem(key, JSON.stringify(map));
}

function loadOverrides() {
  return loadJsonMap(STORAGE_KEY);
}

function saveOverrides(overrides) {
  saveJsonMap(STORAGE_KEY, overrides);
}

const STATUS_CYCLE = ['unplayed', 'played', 'finished'];

// tolera o formato antigo (booleano `played`) de overrides salvos no localStorage
// de visitas anteriores, ou de um played.json colado no import - `played: true`
// só tinha um significado antes ("considero concluído"), então vira "finished"
function readStatus(entry) {
  if (!entry) return 'unplayed';
  if (entry.status === 'played' || entry.status === 'finished') return entry.status;
  if (entry.played === true) return 'finished';
  return 'unplayed';
}

function getStatus(id, overrides, basePlayed) {
  return readStatus(Object.prototype.hasOwnProperty.call(overrides, id) ? overrides[id] : basePlayed[id]);
}

function isPlayed(id, overrides, basePlayed) {
  return getStatus(id, overrides, basePlayed) !== 'unplayed';
}

// mutates `overrides` in place and persists it; caller re-renders/refreshes its own UI afterward
function cycleStatus(id, overrides, basePlayed) {
  const current = getStatus(id, overrides, basePlayed);
  const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length];
  overrides[id] = { status: next, dateAdded: new Date().toISOString().slice(0, 10) };
  saveOverrides(overrides);
}

function loadFavorites() {
  return loadJsonMap(FAVORITE_STORAGE_KEY);
}

function saveFavorites(favorites) {
  saveJsonMap(FAVORITE_STORAGE_KEY, favorites);
}

function isFavorite(id, favorites) {
  return !!favorites[id];
}

// mutates `favorites` in place and persists it; caller re-renders/refreshes its own UI afterward
function toggleFavorite(id, favorites) {
  if (favorites[id]) delete favorites[id];
  else favorites[id] = true;
  saveFavorites(favorites);
}

// item 9 do ROADMAP: registra o service worker (sw.js, sempre na raiz do site)
// pra permitir uso offline sem servidor local depois da primeira visita.
// file:// não suporta service worker, então isso só tem efeito servido via
// http(s)/localhost.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${BASE_PATH}sw.js`).catch(() => {});
  });
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
