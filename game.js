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
};

let overrides = loadOverrides();

const els = {
  detail: document.getElementById('game-detail'),
  notFound: document.getElementById('detail-not-found'),
  boxart: document.getElementById('detail-boxart'),
  title: document.getElementById('detail-title'),
  playedCheckbox: document.getElementById('detail-played-checkbox'),
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

  const [games, basePlayed, boxarts, details] = await Promise.all([
    fetch(`${BASE_PATH}data/games.json`).then((r) => r.json()),
    fetch(`${BASE_PATH}data/played.json`).then((r) => r.json()),
    fetch(`${BASE_PATH}data/boxarts.json`).then((r) => r.json()),
    fetch(`${BASE_PATH}data/details.json`).then((r) => r.json()),
  ]);

  const game = games.find((g) => g.id === id);
  if (!game) {
    els.notFound.classList.remove('hidden');
    return;
  }

  els.pageTitle.textContent = `${game.title} — LifeBar`;
  els.title.textContent = game.title;

  els.boxart.alt = game.title;
  setBoxartImage(els.boxart, els.boxart.parentElement, boxarts[id]);

  const detail = details[id] || {};

  function refreshPlayedCheckbox() {
    els.playedCheckbox.checked = isPlayed(id, overrides, basePlayed);
  }
  refreshPlayedCheckbox();
  els.playedCheckbox.addEventListener('change', () => {
    togglePlayed(id, overrides, basePlayed);
    refreshPlayedCheckbox();
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
