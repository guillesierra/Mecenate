const pages = [...document.querySelectorAll('.page')];
let works = [];
let rooms = [];

function showPage(id) {
  pages.forEach(page => { page.hidden = page.id !== id; });
  document.querySelectorAll('.site-header nav a').forEach(link => {
    link.classList.toggle('active', link.dataset.page === id);
  });
  window.scrollTo(0, 0);
}

function asset(path) {
  return new URL(path, document.baseURI).href;
}

function route() {
  const hash = decodeURIComponent(location.hash.slice(1));
  if (hash.startsWith('obra/')) {
    renderDetail(hash.slice(5));
    return;
  }
  showPage(['obras', 'contacto'].includes(hash) ? hash : 'inicio');
}

function renderGrid() {
  document.getElementById('works-grid').innerHTML = works.map((work, index) => `
    <a class="work-card" href="#obra/${encodeURIComponent(work.id)}" aria-label="Ver ${work.title}">
      <span class="work-image"><img loading="lazy" src="${asset(work.images[0])}" alt="${work.title}, obra original de Guille Sierra"></span>
      <span class="work-card-meta"><strong>${work.title}</strong><span>${work.year || 'Obra original'}</span></span>
      <p class="work-subtitle">${work.material || 'Pintura original'}</p>
    </a>`).join('');
}

function renderRoom(room, work) {
  const artwork = asset(work.images[0]);
  const dimensions = String(work.dimensions || '').match(/(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)/i);
  const artworkWidthCm = dimensions ? Number(dimensions[1]) : 40;
  const artworkHeightCm = dimensions ? Number(dimensions[2]) : 30;
  return `<figure class="mockup-card">
    <div class="mockup-scene" style="--scene:url('${asset(room.image)}');--x:${room.position.x * 100}%;--y:${room.position.y * 100}%">
      <div class="mockup-frame" style="--art-width:${artworkWidthCm};--art-height:${artworkHeightCm}"><img src="${artwork}" alt="${work.title} en ${room.label.toLowerCase()}" loading="lazy"></div>
    </div>
    <figcaption>${room.label}</figcaption>
  </figure>`;
}

function renderDetail(id) {
  const work = works.find(item => item.id === id);
  if (!work) { showPage('obras'); return; }

  document.getElementById('detail-title').textContent = work.title;
  document.getElementById('detail-number').textContent = `OBRA ${String(works.indexOf(work) + 1).padStart(2, '0')} / ${String(works.length).padStart(2, '0')}`;
  document.getElementById('detail-meta').textContent = [work.year, work.material].filter(Boolean).join(' · ') || 'Pintura original';
  document.getElementById('detail-description').textContent = work.description;
  document.getElementById('detail-specs').innerHTML = [
    work.dimensions && `<div>MEDIDAS&nbsp;&nbsp; ${work.dimensions}</div>`,
    work.availability && `<div>DISPONIBILIDAD&nbsp;&nbsp; ${work.availability}</div>`
  ].filter(Boolean).join('');

  document.getElementById('detail-gallery').innerHTML = work.images.map((image, index) =>
    `<img src="${asset(image)}" alt="${work.title}, imagen ${index + 1} de ${work.images.length}">`
  ).join('');

  document.getElementById('detail-mockups').innerHTML = rooms.map(room => renderRoom(room, work)).join('');
  showPage('detalle');
}

async function init() {
  try {
    const manifestResponse = await fetch('data/works.json');
    const manifest = await manifestResponse.json();
    const loadedWorks = await Promise.all(manifest.works.map(async file => {
      const response = await fetch(`data/${encodeURIComponent(file)}`);
      return response.json();
    }));
    const mockupsResponse = await fetch('data/mockups.json?v=5');
    const mockups = await mockupsResponse.json();
    works = loadedWorks;
    rooms = mockups.rooms;
    renderGrid();
    route();
  } catch (error) {
    document.getElementById('works-grid').textContent = 'No se pudieron cargar las obras.';
    console.error('Error al cargar el portfolio:', error);
  }
}

document.getElementById('back-to-works').addEventListener('click', () => { location.hash = 'obras'; });
document.getElementById('hero-image-link').href = '#obra/' + encodeURIComponent('penas-de-viguera-e-islallana');
window.addEventListener('hashchange', route);
init();
