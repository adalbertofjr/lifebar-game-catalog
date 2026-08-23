const I18N = {
  invalidJson: IS_EN
    ? 'Invalid JSON. Check the selected file.'
    : 'JSON inválido. Verifique o arquivo selecionado.',
  invalidFormat: IS_EN
    ? 'Invalid format: expected an object in the played.json format.'
    : 'Formato inválido: esperado um objeto no formato de played.json.',
  noFileSelected: IS_EN
    ? 'Select a file first.'
    : 'Selecione um arquivo primeiro.',
  importSuccess: IS_EN
    ? 'Markings imported successfully.'
    : 'Marcações importadas com sucesso.',
  genreLabel: IS_EN ? 'Genre' : 'Gênero',
  tectoyBadge: 'TecToy',
  tectoyTitle: IS_EN ? 'Released by TecToy in Brazil' : 'Lançado pela TecToy no Brasil',
  favoriteLabel: IS_EN ? 'Favorite' : 'Favorito',
  statusUnplayed: IS_EN ? 'Not played' : 'Não jogado',
  statusPlayed: IS_EN ? 'Played' : 'Jogado',
  statusFinished: IS_EN ? 'Finished' : 'Finalizado',
};

const STATUS_LABELS = {
  unplayed: I18N.statusUnplayed,
  played: I18N.statusPlayed,
  finished: I18N.statusFinished,
};

let games = [];
let basePlayed = {};
let boxarts = {};
let details = {};
let tectoy = {};
let overrides = loadOverrides();
let favorites = loadFavorites();
let selectedGenres = new Set();

const els = {
  list: document.getElementById('game-list'),
  search: document.getElementById('search'),
  filterStatus: document.getElementById('filter-status'),
  filterFavorite: document.getElementById('filter-favorite'),
  sortBy: document.getElementById('sort-by'),
  statPlayed: document.getElementById('stat-played'),
  statTotal: document.getElementById('stat-total'),
  progressFill: document.getElementById('progress-fill'),
  emptyState: document.getElementById('empty-state'),
  exportBtn: document.getElementById('export-btn'),
  importBtn: document.getElementById('import-btn'),
  importPanel: document.getElementById('import-panel'),
  importFile: document.getElementById('import-file'),
  applyImport: document.getElementById('apply-import'),
  closeImport: document.getElementById('close-import'),
  importMessage: document.getElementById('import-message'),
  randomBtn: document.getElementById('random-btn'),
  randomPanel: document.getElementById('random-panel'),
  randomEmpty: document.getElementById('random-empty'),
  randomResult: document.getElementById('random-result'),
  randomBoxart: document.getElementById('random-boxart'),
  randomTitle: document.getElementById('random-title'),
  randomDevPub: document.getElementById('random-devpub'),
  randomGenre: document.getElementById('random-genre'),
  randomSummary: document.getElementById('random-summary'),
  randomAgain: document.getElementById('random-again'),
  closeRandom: document.getElementById('close-random'),
  genreFilterBtn: document.getElementById('genre-filter-btn'),
  genreFilterMenu: document.getElementById('genre-filter-menu'),
};

function handleCycleStatus(id) {
  cycleStatus(id, overrides, basePlayed);
  render();
}

function playedButtonHtml(id, state) {
  return `<button type="button" class="played-btn is-${state}" data-id="${id}" title="${STATUS_LABELS[state]}" aria-label="${STATUS_LABELS[state]}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle class="ring" cx="12" cy="12" r="9"/><path class="check-1" d="M7.5 12.5l3 3 6-6.5"/><path class="check-2" d="M11.5 12.5l3 3 6-6.5"/></svg></button>`;
}

function favoriteButtonHtml(id, favorite) {
  return `<button type="button" class="favorite-btn${favorite ? ' is-favorite' : ''}" aria-pressed="${favorite}" data-id="${id}" title="${I18N.favoriteLabel}" aria-label="${I18N.favoriteLabel}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg></button>`;
}

function handleToggleFavorite(id) {
  toggleFavorite(id, favorites);
  render();
}

async function init() {
  const [gamesRes, playedRes, boxartsRes, detailsRes, tectoyRes] = await Promise.all([
    fetch(`${BASE_PATH}data/games.json`),
    fetch(`${BASE_PATH}data/played.json`),
    fetch(`${BASE_PATH}data/boxarts.json`),
    fetch(`${BASE_PATH}data/details.json`),
    fetch(`${BASE_PATH}data/tectoy.json`),
  ]);
  games = await gamesRes.json();
  basePlayed = await playedRes.json();
  boxarts = await boxartsRes.json();
  details = await detailsRes.json();
  tectoy = await tectoyRes.json();

  els.search.addEventListener('input', render);
  els.filterStatus.addEventListener('change', render);
  els.filterFavorite.addEventListener('change', render);
  els.sortBy.addEventListener('change', render);
  els.exportBtn.addEventListener('click', downloadExport);
  els.importBtn.addEventListener('click', showImport);
  els.closeImport.addEventListener('click', () => els.importPanel.classList.add('hidden'));
  els.importFile.addEventListener('change', handleImportFile);
  els.applyImport.addEventListener('click', applyImportedData);
  els.randomBtn.addEventListener('click', showRandom);
  els.randomAgain.addEventListener('click', drawRandom);
  els.closeRandom.addEventListener('click', () => els.randomPanel.classList.add('hidden'));

  els.genreFilterBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    els.genreFilterMenu.classList.toggle('hidden');
  });
  document.addEventListener('click', (e) => {
    if (!els.genreFilterMenu.classList.contains('hidden')
      && !els.genreFilterMenu.contains(e.target)
      && e.target !== els.genreFilterBtn) {
      els.genreFilterMenu.classList.add('hidden');
    }
  });

  renderGenreMenu();
  render();
}

function buildGenreOptions() {
  const set = new Set();
  games.forEach((g) => {
    const genre = details[g.id] && details[g.id].genre;
    if (genre) set.add(genre);
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function updateGenreButtonLabel() {
  els.genreFilterBtn.textContent = selectedGenres.size > 0
    ? `${I18N.genreLabel} (${selectedGenres.size})`
    : I18N.genreLabel;
}

function renderGenreMenu() {
  els.genreFilterMenu.innerHTML = '';
  buildGenreOptions().forEach((genre) => {
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = genre;
    checkbox.checked = selectedGenres.has(genre);
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) selectedGenres.add(genre);
      else selectedGenres.delete(genre);
      updateGenreButtonLabel();
      render();
    });
    label.append(checkbox, document.createTextNode(genre));
    els.genreFilterMenu.appendChild(label);
  });
  updateGenreButtonLabel();
}

function render() {
  const query = els.search.value.trim().toLowerCase();
  const filterValue = els.filterStatus.value;
  const favoriteFilter = els.filterFavorite.value;
  const sortBy = els.sortBy.value;

  let filtered = games.filter((g) => {
    if (filterValue !== 'all' && getStatus(g.id, overrides, basePlayed) !== filterValue) return false;
    if (favoriteFilter === 'favorite' && !isFavorite(g.id, favorites)) return false;
    if (favoriteFilter === 'not-favorite' && isFavorite(g.id, favorites)) return false;
    if (query) {
      const haystack = `${g.title} ${g.developer} ${g.publisher}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (selectedGenres.size > 0) {
      const genre = details[g.id] && details[g.id].genre;
      if (!genre || !selectedGenres.has(genre)) return false;
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
    const playState = getStatus(g.id, overrides, basePlayed);
    const tr = document.createElement('tr');
    tr.className = playState !== 'unplayed' ? `is-${playState}` : '';

    const tdPlayed = document.createElement('td');
    tdPlayed.className = 'col-played';
    tdPlayed.innerHTML = playedButtonHtml(g.id, playState);

    const favorite = isFavorite(g.id, favorites);
    const tdFavorite = document.createElement('td');
    tdFavorite.className = 'col-favorite';
    tdFavorite.innerHTML = favoriteButtonHtml(g.id, favorite);

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
    setBoxartImage(img, wrap, boxarts[g.id]);

    const titleText = document.createElement('a');
    titleText.className = 'title-link';
    titleText.href = `game.html?id=${encodeURIComponent(g.id)}`;
    titleText.textContent = g.title;

    wrap.append(img, titleText);
    if (tectoy[g.id] && tectoy[g.id].lancado) {
      const badge = document.createElement('span');
      badge.className = 'tectoy-badge';
      badge.title = I18N.tectoyTitle;
      badge.textContent = I18N.tectoyBadge;
      wrap.appendChild(badge);
    }
    tdTitle.appendChild(wrap);

    const tdDev = document.createElement('td');
    tdDev.className = 'col-dev';
    tdDev.textContent = g.developer;

    const tdPub = document.createElement('td');
    tdPub.className = 'col-pub';
    tdPub.textContent = g.publisher;

    const tdGenre = document.createElement('td');
    tdGenre.className = 'col-genre';
    tdGenre.textContent = (details[g.id] && details[g.id].genre) || '—';

    const tdYear = document.createElement('td');
    tdYear.className = 'col-year';
    tdYear.textContent = g.year || '—';

    tr.append(tdPlayed, tdFavorite, tdTitle, tdDev, tdPub, tdGenre, tdYear);
    els.list.appendChild(tr);
  });

  els.list.querySelectorAll('.played-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => handleCycleStatus(e.currentTarget.dataset.id));
  });

  els.list.querySelectorAll('.favorite-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => handleToggleFavorite(e.currentTarget.dataset.id));
  });

  els.emptyState.classList.toggle('hidden', filtered.length > 0);

  const totalPlayed = games.filter((g) => isPlayed(g.id, overrides, basePlayed)).length;
  els.statPlayed.textContent = totalPlayed;
  els.statTotal.textContent = games.length;
  els.progressFill.style.width = `${games.length ? (totalPlayed / games.length) * 100 : 0}%`;
}

function downloadExport() {
  const merged = {};
  games.forEach((g) => {
    const status = getStatus(g.id, overrides, basePlayed);
    const favorite = isFavorite(g.id, favorites);
    if (status === 'unplayed' && !favorite) return;
    const entry = {};
    if (status !== 'unplayed') {
      entry.status = status;
      entry.dateAdded = (overrides[g.id] && overrides[g.id].dateAdded) || (basePlayed[g.id] && basePlayed[g.id].dateAdded) || '';
    }
    if (favorite) entry.favorite = true;
    merged[g.id] = entry;
  });
  const ordered = Object.fromEntries(Object.keys(merged).sort().map((k) => [k, merged[k]]));

  const blob = new Blob([JSON.stringify(ordered, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lifebar-marcacoes-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

let pendingImportText = '';

function showImport() {
  pendingImportText = '';
  els.importFile.value = '';
  els.importMessage.classList.add('hidden');
  els.importPanel.classList.remove('hidden');
}

function handleImportFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    pendingImportText = reader.result;
  };
  reader.readAsText(file);
}

function showImportMessage(text, isError) {
  els.importMessage.textContent = text;
  els.importMessage.classList.remove('hidden', 'success', 'error');
  els.importMessage.classList.add(isError ? 'error' : 'success');
}

function applyImportedData() {
  if (!pendingImportText) {
    showImportMessage(I18N.noFileSelected, true);
    return;
  }
  let data;
  try {
    data = JSON.parse(pendingImportText);
  } catch {
    showImportMessage(I18N.invalidJson, true);
    return;
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    showImportMessage(I18N.invalidFormat, true);
    return;
  }

  const newOverrides = {};
  const newFavorites = {};
  games.forEach((g) => {
    const id = g.id;
    const entry = data[id];
    const importedStatus = readStatus(entry);
    const baseStatus = readStatus(basePlayed[id]);
    if (importedStatus !== baseStatus) {
      newOverrides[id] = {
        status: importedStatus,
        dateAdded: (entry && entry.dateAdded) || (overrides[id] && overrides[id].dateAdded) || new Date().toISOString().slice(0, 10),
      };
    }
    if (entry && entry.favorite) {
      newFavorites[id] = true;
    }
  });

  overrides = newOverrides;
  favorites = newFavorites;
  saveOverrides(overrides);
  saveFavorites(favorites);
  render();
  showImportMessage(I18N.importSuccess, false);
}

function drawRandom() {
  const candidates = games.filter((g) => !isPlayed(g.id, overrides, basePlayed));

  if (candidates.length === 0) {
    els.randomEmpty.classList.remove('hidden');
    els.randomResult.classList.add('hidden');
    return;
  }

  const game = candidates[Math.floor(Math.random() * candidates.length)];
  const detail = details[game.id] || {};

  els.randomEmpty.classList.add('hidden');
  els.randomResult.classList.remove('hidden');

  els.randomBoxart.alt = game.title;
  els.randomBoxart.parentElement.classList.remove('no-boxart');
  setBoxartImage(els.randomBoxart, els.randomBoxart.parentElement, boxarts[game.id]);

  els.randomTitle.textContent = game.title;
  els.randomTitle.href = `game.html?id=${encodeURIComponent(game.id)}`;

  els.randomDevPub.textContent = [game.developer, game.publisher].filter(Boolean).join(' · ');

  els.randomGenre.textContent = detail.genre || '';
  els.randomGenre.classList.toggle('hidden', !detail.genre);

  els.randomSummary.textContent = detail.summary || '';
  els.randomSummary.classList.toggle('hidden', !detail.summary);
}

function showRandom() {
  drawRandom();
  els.randomPanel.classList.remove('hidden');
}

init();
