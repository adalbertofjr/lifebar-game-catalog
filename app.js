const STORAGE_KEY = 'md-played-overrides';
// set by localized pages (e.g. en/index.html) to reach data/ and assets/ at the site root
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

let games = [];
let basePlayed = {};
let boxarts = {};
let overrides = loadOverrides();

const els = {
  list: document.getElementById('game-list'),
  search: document.getElementById('search'),
  filterStatus: document.getElementById('filter-status'),
  sortBy: document.getElementById('sort-by'),
  statPlayed: document.getElementById('stat-played'),
  statTotal: document.getElementById('stat-total'),
  progressFill: document.getElementById('progress-fill'),
  emptyState: document.getElementById('empty-state'),
  exportBtn: document.getElementById('export-btn'),
  exportPanel: document.getElementById('export-panel'),
  exportText: document.getElementById('export-text'),
  closeExport: document.getElementById('close-export'),
};

function loadOverrides() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveOverrides() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

function isPlayed(id) {
  if (Object.prototype.hasOwnProperty.call(overrides, id)) {
    return !!overrides[id].played;
  }
  return !!(basePlayed[id] && basePlayed[id].played);
}

function togglePlayed(id) {
  const current = isPlayed(id);
  overrides[id] = { played: !current, dateAdded: new Date().toISOString().slice(0, 10) };
  saveOverrides();
  render();
}

async function init() {
  const [gamesRes, playedRes, boxartsRes] = await Promise.all([
    fetch(`${BASE_PATH}data/games.json`),
    fetch(`${BASE_PATH}data/played.json`),
    fetch(`${BASE_PATH}data/boxarts.json`),
  ]);
  games = await gamesRes.json();
  basePlayed = await playedRes.json();
  boxarts = await boxartsRes.json();

  els.search.addEventListener('input', render);
  els.filterStatus.addEventListener('change', render);
  els.sortBy.addEventListener('change', render);
  els.exportBtn.addEventListener('click', showExport);
  els.closeExport.addEventListener('click', () => els.exportPanel.classList.add('hidden'));

  render();
}

function render() {
  const query = els.search.value.trim().toLowerCase();
  const status = els.filterStatus.value;
  const sortBy = els.sortBy.value;

  let filtered = games.filter((g) => {
    const played = isPlayed(g.id);
    if (status === 'played' && !played) return false;
    if (status === 'unplayed' && played) return false;
    if (query) {
      const haystack = `${g.title} ${g.developer} ${g.publisher}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  filtered.sort((a, b) => {
    if (sortBy === 'year') return (a.year || 0) - (b.year || 0) || a.title.localeCompare(b.title);
    if (sortBy === 'developer') return a.developer.localeCompare(b.developer) || a.title.localeCompare(b.title);
    return a.title.localeCompare(b.title);
  });

  els.list.innerHTML = '';
  filtered.forEach((g) => {
    const played = isPlayed(g.id);
    const tr = document.createElement('tr');
    tr.className = played ? 'is-played' : '';

    const tdPlayed = document.createElement('td');
    tdPlayed.className = 'col-played';
    tdPlayed.innerHTML = `<input type="checkbox" class="played-checkbox" ${played ? 'checked' : ''} data-id="${g.id}">`;

    const tdTitle = document.createElement('td');
    tdTitle.className = 'col-title';
    const wrap = document.createElement('div');
    wrap.className = 'title-cell';

    const img = document.createElement('img');
    img.className = 'boxart';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.fetchPriority = 'low';
    img.width = 32;
    img.height = 44;
    img.alt = '';
    const boxartFile = boxarts[g.id];
    if (boxartFile) {
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
    } else {
      img.src = BOXART_PLACEHOLDER;
      wrap.classList.add('no-boxart');
    }

    const titleText = document.createElement('span');
    titleText.textContent = g.title;

    wrap.append(img, titleText);
    tdTitle.appendChild(wrap);

    const tdDev = document.createElement('td');
    tdDev.className = 'col-dev';
    tdDev.textContent = g.developer;

    const tdPub = document.createElement('td');
    tdPub.className = 'col-pub';
    tdPub.textContent = g.publisher;

    const tdYear = document.createElement('td');
    tdYear.className = 'col-year';
    tdYear.textContent = g.year || '—';

    tr.append(tdPlayed, tdTitle, tdDev, tdPub, tdYear);
    els.list.appendChild(tr);
  });

  els.list.querySelectorAll('.played-checkbox').forEach((cb) => {
    cb.addEventListener('change', (e) => togglePlayed(e.target.dataset.id));
  });

  els.emptyState.classList.toggle('hidden', filtered.length > 0);

  const totalPlayed = games.filter((g) => isPlayed(g.id)).length;
  els.statPlayed.textContent = totalPlayed;
  els.statTotal.textContent = games.length;
  els.progressFill.style.width = `${games.length ? (totalPlayed / games.length) * 100 : 0}%`;
}

function showExport() {
  const merged = { ...basePlayed };
  for (const [id, val] of Object.entries(overrides)) {
    if (val.played) {
      merged[id] = { played: true, dateAdded: val.dateAdded || (merged[id] && merged[id].dateAdded) || '' };
    } else {
      delete merged[id];
    }
  }
  const ordered = Object.fromEntries(Object.keys(merged).sort().map((k) => [k, merged[k]]));
  els.exportText.value = JSON.stringify(ordered, null, 2);
  els.exportPanel.classList.remove('hidden');
}

init();
