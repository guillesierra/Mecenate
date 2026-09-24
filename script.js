const pages = [...document.querySelectorAll('.page')];
let works = [];
let rooms = [];
const imageViewer = document.createElement('div');
imageViewer.className = 'image-viewer';
imageViewer.hidden = true;
imageViewer.setAttribute('role', 'dialog');
imageViewer.setAttribute('aria-modal', 'true');
imageViewer.setAttribute('aria-label', 'Vista ampliada de la obra');
imageViewer.tabIndex = -1;
document.body.append(imageViewer);
let viewerReturnTarget = null;

function closeImageViewer() {
  imageViewer.hidden = true;
  imageViewer.replaceChildren();
  document.body.style.overflow = '';
  if (viewerReturnTarget?.isConnected) viewerReturnTarget.focus();
  viewerReturnTarget = null;
}

function openImageViewer(target, isMockup = false) {
  viewerReturnTarget = target;
  imageViewer.replaceChildren();
  const enlarged = target.cloneNode(true);

  if (isMockup) {
    const bounds = target.getBoundingClientRect();
    const scale = Math.min((window.innerWidth * 0.94) / bounds.width, (window.innerHeight * 0.92) / bounds.height);
    enlarged.style.width = `${bounds.width}px`;
    enlarged.style.height = `${bounds.height}px`;
    enlarged.style.transform = `scale(${scale})`;
    enlarged.style.transformOrigin = 'center';
    enlarged.querySelector('img').loading = 'eager';
  } else {
    enlarged.loading = 'eager';
    enlarged.alt = `${target.alt} — vista ampliada`;
  }

  imageViewer.append(enlarged);
  imageViewer.hidden = false;
  document.body.style.overflow = 'hidden';
  imageViewer.focus();
}

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
    <div class="mockup-scene" role="button" tabindex="0" aria-label="Ampliar mockup: ${room.label}" style="--scene:url('${asset(room.image)}');--x:${room.position.x * 100}%;--y:${room.position.y * 100}%">
      <div class="mockup-frame" style="--art-width:${artworkWidthCm};--art-height:${artworkHeightCm}"><div class="mockup-mat"><img src="${artwork}" alt="${work.title} en ${room.label.toLowerCase()}" loading="lazy"></div></div>
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
  document.getElementById('availability-link').hidden = work.availability === 'No disponible';
  document.getElementById('detail-specs').innerHTML = [
    work.dimensions && `<div>MEDIDAS&nbsp;&nbsp; ${work.dimensions}</div>`,
    work.availability && `<div>DISPONIBILIDAD&nbsp;&nbsp; ${work.availability}</div>`
  ].filter(Boolean).join('');

  document.getElementById('detail-gallery').innerHTML = work.images.map((image, index) =>
    `<img src="${asset(image)}" alt="${work.title}, imagen ${index + 1} de ${work.images.length}" tabindex="0" role="button" aria-label="Ampliar ${work.title}">`
  ).join('');

  document.getElementById('detail-mockups').innerHTML = rooms.map(room => renderRoom(room, work)).join('');
  showPage('detalle');
}

async function init() {
  try {
    const manifestResponse = await fetch('data/works.json');
    const manifest = await manifestResponse.json();
    const loadedWorks = await Promise.all(manifest.works.map(async file => {
      const response = await fetch(`data/${encodeURIComponent(file)}?v=8`, { cache: 'no-store' });
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
document.getElementById('detalle').addEventListener('click', event => {
  if (eventViewerTarget(event)) return;
  if (event.target === imageViewer) closeImageViewer();
});
document.getElementById('detalle').addEventListener('keydown', event => {
  if (!['Enter', ' '].includes(event.key)) return;
  if (eventViewerTarget(event)) event.preventDefault();
});
function eventViewerTarget(event) {
  const mockup = event.target.closest('.mockup-scene');
  const artwork = event.target.closest('.detail-gallery img');
  const target = mockup || artwork;
  if (!target) return false;
  if (event.type === 'click' || (event.type === 'keydown' && ['Enter', ' '].includes(event.key))) {
    openImageViewer(target, Boolean(mockup));
  }
  return true;
}
imageViewer.addEventListener('click', closeImageViewer);
window.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !imageViewer.hidden) closeImageViewer();
});
document.getElementById('hero-image-link').href = '#obra/' + encodeURIComponent('penas-de-viguera-e-islallana');
window.addEventListener('hashchange', route);
init();
