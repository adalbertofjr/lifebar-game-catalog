const I18N = {
  invalidJson: IS_EN
    ? 'Invalid JSON. Check the pasted content or the selected file.'
    : 'JSON inválido. Verifique o conteúdo colado ou o arquivo selecionado.',
  invalidFormat: IS_EN
    ? 'Invalid format: expected an object in the played.json format.'
    : 'Formato inválido: esperado um objeto no formato de played.json.',
  importSuccess: IS_EN
    ? 'Markings imported successfully.'
    : 'Marcações importadas com sucesso.',
  genreLabel: IS_EN ? 'Genre' : 'Gênero',
};

let games = [];
let basePlayed = {};
let boxarts = {};
let details = {};
let overrides = loadOverrides();
let selectedGenres = new Set();

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
  importBtn: document.getElementById('import-btn'),
  importPanel: document.getElementById('import-panel'),
  importText: document.getElementById('import-text'),
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

function handleTogglePlayed(id) {
  togglePlayed(id, overrides, basePlayed);
  render();
}

async function init() {
  const [gamesRes, playedRes, boxartsRes, detailsRes] = await Promise.all([
    fetch(`${BASE_PATH}data/games.json`),
    fetch(`${BASE_PATH}data/played.json`),
    fetch(`${BASE_PATH}data/boxarts.json`),
    fetch(`${BASE_PATH}data/details.json`),
  ]);
  games = await gamesRes.json();
  basePlayed = await playedRes.json();
  boxarts = await boxartsRes.json();
  details = await detailsRes.json();

  els.search.addEventListener('input', render);
  els.filterStatus.addEventListener('change', render);
  els.sortBy.addEventListener('change', render);
  els.exportBtn.addEventListener('click', showExport);
  els.closeExport.addEventListener('click', () => els.exportPanel.classList.add('hidden'));
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
  const status = els.filterStatus.value;
  const sortBy = els.sortBy.value;

  let filtered = games.filter((g) => {
    const played = isPlayed(g.id, overrides, basePlayed);
    if (status === 'played' && !played) return false;
    if (status === 'unplayed' && played) return false;
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
    const played = isPlayed(g.id, overrides, basePlayed);
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
    setBoxartImage(img, wrap, boxarts[g.id]);

    const titleText = document.createElement('a');
    titleText.className = 'title-link';
    titleText.href = `game.html?id=${encodeURIComponent(g.id)}`;
    titleText.textContent = g.title;

    wrap.append(img, titleText);
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

    tr.append(tdPlayed, tdTitle, tdDev, tdPub, tdGenre, tdYear);
    els.list.appendChild(tr);
  });

  els.list.querySelectorAll('.played-checkbox').forEach((cb) => {
    cb.addEventListener('change', (e) => handleTogglePlayed(e.target.dataset.id));
  });

  els.emptyState.classList.toggle('hidden', filtered.length > 0);

  const totalPlayed = games.filter((g) => isPlayed(g.id, overrides, basePlayed)).length;
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

function showImport() {
  els.importMessage.classList.add('hidden');
  els.importPanel.classList.remove('hidden');
}

function handleImportFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    els.importText.value = reader.result;
  };
  reader.readAsText(file);
}

function showImportMessage(text, isError) {
  els.importMessage.textContent = text;
  els.importMessage.classList.remove('hidden', 'success', 'error');
  els.importMessage.classList.add(isError ? 'error' : 'success');
}

function applyImportedData() {
  let data;
  try {
    data = JSON.parse(els.importText.value);
  } catch {
    showImportMessage(I18N.invalidJson, true);
    return;
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    showImportMessage(I18N.invalidFormat, true);
    return;
  }

  const newOverrides = {};
  games.forEach((g) => {
    const id = g.id;
    const importedPlayed = !!(data[id] && data[id].played);
    const basePlayedFlag = !!(basePlayed[id] && basePlayed[id].played);
    if (importedPlayed !== basePlayedFlag) {
      newOverrides[id] = {
        played: importedPlayed,
        dateAdded: (data[id] && data[id].dateAdded) || (overrides[id] && overrides[id].dateAdded) || new Date().toISOString().slice(0, 10),
      };
    }
  });

  overrides = newOverrides;
  saveOverrides(overrides);
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
