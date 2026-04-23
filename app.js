const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const pieceList = document.getElementById('pieceList');
const skySelect = document.getElementById('skySelect');
const weatherSelect = document.getElementById('weatherSelect');
const clearBtn = document.getElementById('clearBtn');

const skies = [
  { name: 'Morning Blue', color: '#d8ecff' },
  { name: 'Sunset Peach', color: '#ffd9c2' },
  { name: 'Cloudy Gray', color: '#dfe5ea' },
  { name: 'Night Navy', color: '#152238' },
];

const weatherOptions = [
  { name: 'Clear', overlay: null },
  { name: 'Light Clouds', overlay: 'clouds' },
  { name: 'Rain', overlay: 'rain' },
  { name: 'Snow', overlay: 'snow' },
];

const pieceCatalog = [
  { id: 'foundation', label: '', kind: 'foundation', w: 540, h: 54, color: '#ba9b78' },
  { id: 'base', label: '', kind: 'base', w: 480, h: 132, color: '#e6d2bd' },
  { id: 'brick', label: '', kind: 'brick', w: 420, h: 112, color: '#b96f5f' },
  { id: 'truss', label: '', kind: 'truss', w: 500, h: 100, color: '#d9be8a' },
  { id: 'window1', label: '', kind: 'window', w: 72, h: 96, color: '#cfefff' },
  { id: 'window2', label: '', kind: 'window', w: 96, h: 116, color: '#cfe3ff' },
  { id: 'door', label: '', kind: 'door', w: 90, h: 138, color: '#8d664e' },
  { id: 'roof', label: '', kind: 'roof', w: 620, h: 132, color: '#8f6b4d' },
  { id: 'chimney', label: '', kind: 'chimney', w: 52, h: 132, color: '#c47b68' },
  { id: 'plant', label: '', kind: 'plant', w: 84, h: 114, color: '#6aa66f' },
];

const state = {
  sky: skies[0].color,
  weather: weatherOptions[0].overlay,
  pieces: [],
  draggingId: null,
  dragOffsetX: 0,
  dragOffsetY: 0,
  rotateId: null,
  placing: null,
};

const textures = {};

function createTexture(label, color, kind) {
  const texCanvas = document.createElement('canvas');
  texCanvas.width = 256;
  texCanvas.height = 256;
  const t = texCanvas.getContext('2d');
  t.fillStyle = color;
  t.fillRect(0, 0, texCanvas.width, texCanvas.height);
  t.strokeStyle = 'rgba(255,255,255,.35)';
  t.lineWidth = 8;
  t.strokeRect(8, 8, 240, 240);
  t.fillStyle = 'rgba(255,255,255,.5)';
  t.filter = 'blur(1px)';
  t.font = 'bold 34px sans-serif';
  t.textAlign = 'center';
  t.textBaseline = 'middle';
  if (label) t.fillText(label, 128, 128);
  t.filter = 'none';
  if (kind === 'window') {
    t.fillStyle = 'rgba(197, 236, 255, .6)';
    t.fillRect(54, 52, 148, 152);
    t.fillStyle = 'rgba(255,255,255,.45)';
    t.fillRect(66, 64, 124, 128);
    t.strokeStyle = 'rgba(69, 92, 112, .8)';
    t.lineWidth = 10;
    t.strokeRect(54, 52, 148, 152);
    t.beginPath();
    t.moveTo(128, 56);
    t.lineTo(128, 202);
    t.moveTo(60, 128);
    t.lineTo(196, 128);
    t.stroke();
  }
  if (kind === 'roof') {
    t.fillStyle = 'rgba(92, 62, 42, .95)';
    t.beginPath();
    t.moveTo(30, 170);
    t.lineTo(128, 54);
    t.lineTo(226, 170);
    t.closePath();
    t.fill();
  }
  if (kind === 'door') {
    t.fillStyle = 'rgba(107, 72, 48, .9)';
    t.fillRect(72, 56, 112, 150);
    t.fillStyle = 'rgba(255,255,255,.3)';
    t.fillRect(84, 70, 88, 122);
    t.strokeStyle = 'rgba(43,31,20,.9)';
    t.lineWidth = 8;
    t.strokeRect(72, 56, 112, 150);
  }
  if (kind === 'plant') {
    t.fillStyle = 'rgba(71, 146, 86, .95)';
    t.beginPath();
    t.arc(128, 160, 36, 0, Math.PI * 2);
    t.fill();
    t.fillStyle = 'rgba(255,255,255,.45)';
    t.beginPath();
    t.arc(92, 110, 28, 0, Math.PI * 2);
    t.arc(160, 104, 32, 0, Math.PI * 2);
    t.fill();
  }
  return texCanvas;
}

pieceCatalog.forEach((piece) => {
  textures[piece.id] = createTexture(piece.label, piece.color, piece.kind);
});

function populateSelect(select, options) {
  select.innerHTML = '';
  options.forEach((opt, index) => {
    const el = document.createElement('option');
    el.value = String(index);
    el.textContent = opt.name;
    select.appendChild(el);
  });
}

populateSelect(skySelect, skies);
populateSelect(weatherSelect, weatherOptions);
skySelect.value = '0';
weatherSelect.value = '0';

pieceCatalog.forEach((piece, index) => {
  const item = document.createElement('div');
  item.className = 'piece';
  item.draggable = true;
  item.dataset.id = piece.id;
  item.innerHTML = `<img alt="${piece.id}" src="${textures[piece.id].toDataURL()}" />`;
  item.addEventListener('dragstart', () => {
    state.placing = piece.id;
  });
  pieceList.appendChild(item);
});

function resize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function sceneToCanvas(x, y) {
  const rect = canvas.getBoundingClientRect();
  return { x: x - rect.left, y: y - rect.top };
}

function drawSprite(tex, x, y, w, h, rotation = 0, alpha = 1) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(rotation);
  ctx.globalAlpha = alpha;
  ctx.filter = 'blur(2px) saturate(1.08)';
  ctx.drawImage(tex, -w / 2, -h / 2, w, h);
  ctx.filter = 'none';
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = 'rgba(255,255,255,.38)';
  ctx.lineWidth = 3;
  ctx.strokeRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6);
  ctx.restore();
}

function drawWeather() {
  const overlay = state.weather;
  if (overlay === 'clouds') {
    ctx.fillStyle = 'rgba(255,255,255,.48)';
    for (let i = 0; i < 4; i++) {
      const x = 120 + i * 260;
      ctx.beginPath();
      ctx.ellipse(x, 100 + (i % 2) * 34, 72, 28, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (overlay === 'rain') {
    ctx.strokeStyle = 'rgba(120,160,220,.45)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 70; i++) {
      const x = (i * 74) % canvas.getBoundingClientRect().width;
      const y = (i * 97) % 380;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 12, y + 22);
      ctx.stroke();
    }
  } else if (overlay === 'snow') {
    ctx.fillStyle = 'rgba(255,255,255,.8)';
    for (let i = 0; i < 90; i++) {
      const x = (i * 63) % canvas.getBoundingClientRect().width;
      const y = (i * 101) % canvas.getBoundingClientRect().height;
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawScene() {
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  const gradient = ctx.createLinearGradient(0, 0, 0, rect.height);
  gradient.addColorStop(0, state.sky);
  gradient.addColorStop(1, '#f7f1e8');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, rect.width, rect.height);

  ctx.fillStyle = 'rgba(255,255,255,.18)';
  ctx.fillRect(0, rect.height * 0.56, rect.width, rect.height * 0.44);

  drawWeather();

  state.pieces.forEach((piece) => {
    const tex = textures[piece.templateId];
    drawSprite(tex, piece.x, piece.y, piece.w, piece.h, piece.rotation, 0.95);
  });

  if (state.placing) {
    const preview = pieceCatalog.find((p) => p.id === state.placing);
    if (preview) {
      const tex = textures[preview.id];
      drawSprite(tex, state.previewX ?? 40, state.previewY ?? 40, preview.w, preview.h, 0, 0.82);
    }
  }
}

function hitTest(x, y) {
  for (let i = state.pieces.length - 1; i >= 0; i--) {
    const piece = state.pieces[i];
    const cx = piece.x + piece.w / 2;
    const cy = piece.y + piece.h / 2;
    const dx = x - cx;
    const dy = y - cy;
    const cos = Math.cos(-piece.rotation);
    const sin = Math.sin(-piece.rotation);
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;
    if (Math.abs(rx) <= piece.w / 2 && Math.abs(ry) <= piece.h / 2) return piece;
  }
  return null;
}

canvas.addEventListener('dragover', (e) => e.preventDefault());
canvas.addEventListener('drop', (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const piece = pieceCatalog.find((p) => p.id === state.placing);
  if (!piece) return;
  state.pieces.push({
    id: crypto.randomUUID(),
    templateId: piece.id,
    x: x - piece.w / 2,
    y: y - piece.h / 2,
    w: piece.w,
    h: piece.h,
    rotation: 0,
  });
  state.placing = null;
});

canvas.addEventListener('pointerdown', (e) => {
  const x = e.offsetX;
  const y = e.offsetY;
  const piece = hitTest(x, y);
  if (piece) {
    state.draggingId = piece.id;
    state.dragOffsetX = x - piece.x;
    state.dragOffsetY = y - piece.y;
    return;
  }
  const template = pieceCatalog.find((p) => p.id === state.placing);
  if (template) {
    state.pieces.push({
      id: crypto.randomUUID(),
      templateId: template.id,
      x: x - template.w / 2,
      y: y - template.h / 2,
      w: template.w,
      h: template.h,
      rotation: 0,
    });
    state.placing = null;
  }
});

canvas.addEventListener('pointermove', (e) => {
  state.previewX = e.offsetX;
  state.previewY = e.offsetY;
  if (!state.draggingId) return;
  const piece = state.pieces.find((p) => p.id === state.draggingId);
  if (!piece) return;
  piece.x = e.offsetX - state.dragOffsetX;
  piece.y = e.offsetY - state.dragOffsetY;
});

window.addEventListener('pointerup', () => {
  state.draggingId = null;
});

canvas.addEventListener('dblclick', (e) => {
  const piece = hitTest(e.offsetX, e.offsetY);
  if (piece) piece.rotation += Math.PI / 6;
});

skySelect.addEventListener('change', () => {
  state.sky = skies[Number(skySelect.value)].color;
});
weatherSelect.addEventListener('change', () => {
  state.weather = weatherOptions[Number(weatherSelect.value)].overlay;
});
clearBtn.addEventListener('click', () => {
  state.pieces = [];
});

window.addEventListener('resize', resize);
resize();

function loop() {
  drawScene();
  requestAnimationFrame(loop);
}
loop();
