const I18N = {
  developer: IS_EN ? 'Developer' : 'Desenvolvedora',
  publisher: IS_EN ? 'Publisher' : 'Publicadora',
  genre: IS_EN ? 'Genre' : 'Gênero',
  franchise: IS_EN ? 'Franchise' : 'Franquia',
  players: IS_EN ? 'Players' : 'Jogadores',
  esrbRating: IS_EN ? 'ESRB rating' : 'Classificação ESRB',
  serial: IS_EN ? 'Serial' : 'Serial',
  year: IS_EN ? 'Year' : 'Ano',
  releaseJapan: IS_EN ? 'Japan release' : 'Lançamento no Japão',
  releaseNA: IS_EN ? 'North America release' : 'Lançamento na América do Norte',
  releasePAL: IS_EN ? 'Europe release' : 'Lançamento na Europa',
  releaseOther: IS_EN ? 'Other release' : 'Outro lançamento',
  summaryUnavailable: IS_EN
    ? 'No summary available yet for this game.'
    : 'Ainda não há sinopse disponível para este jogo.',
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

let overrides = loadOverrides();
let favorites = loadFavorites();

const els = {
  detail: document.getElementById('game-detail'),
  notFound: document.getElementById('detail-not-found'),
  boxart: document.getElementById('detail-boxart'),
  title: document.getElementById('detail-title'),
  playedBtn: document.getElementById('detail-played-btn'),
  favoriteBtn: document.getElementById('detail-favorite-btn'),
  meta: document.getElementById('detail-meta'),
  summary: document.getElementById('detail-summary'),
  langToggle: document.getElementById('lang-toggle'),
  pageTitle: document.getElementById('page-title'),
};

function addMetaRow(container, label, value, monospace) {
  if (value === undefined || value === null || value === '') return;
  const dt = document.createElement('dt');
  dt.textContent = label;
  const dd = document.createElement('dd');
  if (monospace) {
    const code = document.createElement('code');
    code.textContent = value;
    dd.appendChild(code);
  } else {
    dd.textContent = value;
  }
  container.append(dt, dd);
}

async function init() {
  const id = new URLSearchParams(window.location.search).get('id');
  els.langToggle.href = `${els.langToggle.getAttribute('href')}?id=${encodeURIComponent(id)}`;

  const [games, basePlayed, boxarts, details, tectoy] = await Promise.all([
    fetch(`${BASE_PATH}data/games.json`).then((r) => r.json()),
    fetch(`${BASE_PATH}data/played.json`).then((r) => r.json()),
    fetch(`${BASE_PATH}data/boxarts.json`).then((r) => r.json()),
    fetch(`${BASE_PATH}data/details.json`).then((r) => r.json()),
    fetch(`${BASE_PATH}data/tectoy.json`).then((r) => r.json()),
  ]);

  const game = games.find((g) => g.id === id);
  if (!game) {
    els.notFound.classList.remove('hidden');
    return;
  }

  els.pageTitle.textContent = `${game.title} — LifeBar`;
  els.title.textContent = game.title;

  if (tectoy[id] && tectoy[id].lancado) {
    const badge = document.createElement('span');
    badge.className = 'tectoy-badge';
    badge.title = I18N.tectoyTitle;
    badge.textContent = I18N.tectoyBadge;
    els.title.appendChild(badge);
  }

  els.boxart.alt = game.title;
  setBoxartImage(els.boxart, els.boxart.parentElement, boxarts[id]);

  const detail = details[id] || {};

  function refreshPlayedControl() {
    const state = getStatus(id, overrides, basePlayed);
    els.playedBtn.className = `played-btn detail-played-btn is-${state}`;
    els.playedBtn.title = STATUS_LABELS[state];
    els.playedBtn.setAttribute('aria-label', STATUS_LABELS[state]);
  }
  refreshPlayedControl();
  els.playedBtn.addEventListener('click', () => {
    cycleStatus(id, overrides, basePlayed);
    refreshPlayedControl();
  });

  els.favoriteBtn.title = I18N.favoriteLabel;
  els.favoriteBtn.setAttribute('aria-label', I18N.favoriteLabel);
  function refreshFavoriteBtn() {
    const favorite = isFavorite(id, favorites);
    els.favoriteBtn.classList.toggle('is-favorite', favorite);
    els.favoriteBtn.setAttribute('aria-pressed', favorite);
  }
  refreshFavoriteBtn();
  els.favoriteBtn.addEventListener('click', () => {
    toggleFavorite(id, favorites);
    refreshFavoriteBtn();
  });

  addMetaRow(els.meta, I18N.developer, game.developer);
  addMetaRow(els.meta, I18N.publisher, game.publisher);
  addMetaRow(els.meta, I18N.genre, detail.genre);
  addMetaRow(els.meta, I18N.franchise, detail.franchise);
  addMetaRow(els.meta, I18N.players, detail.users);
  addMetaRow(els.meta, I18N.esrbRating, detail.esrb_rating);
  addMetaRow(els.meta, I18N.year, game.year);
  addMetaRow(els.meta, I18N.releaseJapan, game.release_jp);
  addMetaRow(els.meta, I18N.releaseNA, game.release_na);
  addMetaRow(els.meta, I18N.releasePAL, game.release_pal);
  addMetaRow(els.meta, I18N.releaseOther, game.release_other);
  addMetaRow(els.meta, I18N.serial, detail.serial, true);

  els.summary.textContent = detail.summary || I18N.summaryUnavailable;

  els.detail.classList.remove('hidden');
}

init();
