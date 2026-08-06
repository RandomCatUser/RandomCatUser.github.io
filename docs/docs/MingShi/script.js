/* MingShi - Cute Design Studio Engine */

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const canvasArea = document.getElementById('canvas-area');
const emptyState = document.getElementById('empty-state');

// ===== STATE =====
let pages = [{ id: 'page_1', name: 'Page 1', objects: [] }];
let currentPageId = 'page_1';
let selectedIds = [];
let currentTool = 'move';
let isInteracting = false;
let interactionMode = null; 
let startPos = { x: 0, y: 0 };
let tempShape = null;
let activeHandle = null;
let panStart = { x: 0, y: 0 };
let camera = { x: 0, y: 0, zoom: 1 };
let isSpaceDown = false;
let clipboard = [];
let styleClipboard = null;
let snapLines = [];

// For Aspect Ratio Resize
let resizeStartBounds = null;

// HISTORY (UNDO/REDO)
let history = [];
let historyIndex = -1;

let currentProjectName = "Untitled";
const imageCache = {}; 

function getObjects() {
  const page = pages.find(p => p.id === currentPageId);
  return page ? page.objects : [];
}

function setObjects(newObjs) {
  const page = pages.find(p => p.id === currentPageId);
  if (page) page.objects = newObjs;
}

// ===== CUTE LOADING SCREEN =====
window.addEventListener('load', () => {
  setTimeout(() => {
    const splash = document.getElementById('splash');
    splash.style.opacity = '0';
    setTimeout(() => splash.style.display = 'none', 600);
  }, 1500);
});

// ===== THEME TOGGLE =====
function initTheme() {
  const savedTheme = localStorage.getItem('mingshi_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function updateThemeIcon(theme) {
  const icon = document.querySelector('#btn-theme i');
  if (theme === 'dark') icon.className = 'fa-solid fa-sun';
  else icon.className = 'fa-solid fa-moon';
}

document.getElementById('btn-theme').addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('mingshi_theme', newTheme);
  updateThemeIcon(newTheme);
  render(); 
});

// ===== CANVAS SETUP =====
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvasArea.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  render();
}

// ===== COORDINATE HELPERS =====
function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function screenToCanvas(pos) {
  return {
    x: (pos.x - camera.x) / camera.zoom,
    y: (pos.y - camera.y) / camera.zoom
  };
}

// ===== HISTORY MANAGEMENT =====
function saveHistory() {
  history = history.slice(0, historyIndex + 1);
  history.push(JSON.parse(JSON.stringify(pages)));
  historyIndex++;
  if (history.length > 50) {
    history.shift();
    historyIndex--;
  }
  updateHistoryButtons();
}

function undo() {
  if (historyIndex <= 0) return;
  historyIndex--;
  pages = JSON.parse(JSON.stringify(history[historyIndex]));
  selectedIds = [];
  updateHistoryButtons();
  updateUI();
  render();
}

function redo() {
  if (historyIndex >= history.length - 1) return;
  historyIndex++;
  pages = JSON.parse(JSON.stringify(history[historyIndex]));
  selectedIds = [];
  updateHistoryButtons();
  updateUI();
  render();
}

function updateHistoryButtons() {
  document.getElementById('btn-undo').disabled = historyIndex <= 0;
  document.getElementById('btn-redo').disabled = historyIndex >= history.length - 1;
  document.getElementById('btn-undo').style.opacity = historyIndex <= 0 ? 0.4 : 1;
  document.getElementById('btn-redo').style.opacity = historyIndex >= history.length - 1 ? 0.4 : 1;
}

// ===== RENDERING =====
function render() {
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);
  
  // Check empty state
  if (getObjects().length === 0) emptyState.classList.remove('hidden');
  else emptyState.classList.add('hidden');
  
  // Grid dots (theme aware)
  const styles = getComputedStyle(document.documentElement);
  const gridColor = styles.getPropertyValue('--bg-grid').trim();
  ctx.fillStyle = gridColor;
  
  const gridSize = 50 * camera.zoom;
  const offsetX = camera.x % gridSize;
  const offsetY = camera.y % gridSize;
  for (let x = offsetX; x < rect.width; x += gridSize) {
    for (let y = offsetY; y < rect.height; y += gridSize) {
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);
  
  const objs = getObjects();
  objs.forEach(obj => {
    if (obj.visible !== false) drawShape(obj);
  });
  
  if (tempShape) drawShape(tempShape, true);
  
  // Draw selection
  if (selectedIds.length === 1) {
    const obj = objs.find(o => o.id === selectedIds[0]);
    if (obj && obj.visible !== false) drawSelection(obj);
  } else if (selectedIds.length > 1) {
    drawMultiSelection();
  }
  
  // Draw Smart Guides
  if (snapLines.length > 0) {
    ctx.strokeStyle = '#EF4F6B'; // Cute pink for guides
    ctx.lineWidth = 1 / camera.zoom;
    snapLines.forEach(line => {
      ctx.beginPath();
      ctx.moveTo(line.x1, line.y1);
      ctx.lineTo(line.x2, line.y2);
      ctx.stroke();
    });
  }
  
  ctx.restore();
}

function drawShape(obj, isPreview = false) {
  ctx.save();
  
  let x = obj.w < 0 ? obj.x + obj.w : obj.x;
  let y = obj.h < 0 ? obj.y + obj.h : obj.y;
  let w = Math.abs(obj.w);
  let h = Math.abs(obj.h);
  
  ctx.translate(x + w/2, y + h/2);
  if (obj.rotation) ctx.rotate(obj.rotation * Math.PI / 180);
  if (obj.flipH) ctx.scale(-1, 1);
  if (obj.flipV) ctx.scale(1, -1);
  ctx.translate(-(x + w/2), -(y + h/2));
  
  if (isPreview) ctx.globalAlpha = 0.6;
  if (obj.opacity !== undefined) ctx.globalAlpha = obj.opacity;
  
  if (obj.shadow && obj.shadow.enabled) {
    ctx.shadowColor = hexToRgba(obj.shadow.color, obj.shadow.opacity / 100);
    ctx.shadowBlur = obj.shadow.blur;
    ctx.shadowOffsetX = obj.shadow.x;
    ctx.shadowOffsetY = obj.shadow.y;
  }
  
  if (obj.fillType === 'gradient') {
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, obj.gradColor1 || '#FF6B81');
    grad.addColorStop(1, obj.gradColor2 || '#7C6FF0');
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = obj.fill;
  }
  
  ctx.strokeStyle = obj.stroke;
  ctx.lineWidth = obj.strokeWidth;
  ctx.lineCap = obj.strokeCap || 'round'; // Default round is cuter
  ctx.lineJoin = 'round';
  
  if (obj.type === 'rect' || obj.type === 'frame') {
    if (obj.radius && obj.radius > 0) {
      const r = Math.min(obj.radius, w/2, h/2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      ctx.fill();
      if (obj.strokeWidth > 0) ctx.stroke();
    } else {
      ctx.fillRect(x, y, w, h);
      if (obj.strokeWidth > 0) ctx.strokeRect(x, y, w, h);
    }
  } else if (obj.type === 'ellipse') {
    ctx.beginPath();
    ctx.ellipse(x + w/2, y + h/2, w/2, h/2, 0, 0, Math.PI * 2);
    ctx.fill();
    if (obj.strokeWidth > 0) ctx.stroke();
  } else if (obj.type === 'line') {
    ctx.beginPath();
    ctx.moveTo(obj.x, obj.y);
    ctx.lineTo(obj.x + obj.w, obj.y + obj.h);
    ctx.stroke();
  } else if (obj.type === 'polygon' || obj.type === 'star') {
    drawPolygon(obj, x, y, w, h);
    if (obj.strokeWidth > 0) ctx.stroke();
  } else if (obj.type === 'text') {
    ctx.font = `${obj.fontWeight || 400} ${obj.fontSize}px Inter, sans-serif`;
    ctx.textBaseline = 'top';
    ctx.textAlign = obj.textAlign || 'left';
    ctx.fillText(obj.text, obj.x, obj.y);
    const metrics = ctx.measureText(obj.text);
    obj.w = metrics.width;
    obj.h = obj.fontSize * 1.2;
  } else if (obj.type === 'image') {
    if (imageCache[obj.id]) {
      ctx.drawImage(imageCache[obj.id], x, y, w, h);
    } else {
      ctx.fillStyle = '#F4F5F9';
      ctx.fillRect(x, y, w, h);
    }
  }
  
  ctx.restore();
}

function drawPolygon(obj, x, y, w, h) {
  const sides = obj.type === 'star' ? 10 : 6;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const radOut = Math.min(w, h) / 2;
  const radIn = radOut * (obj.type === 'star' ? 0.4 : 1);

  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const r = i % 2 === 0 ? radOut : radIn;
    const px = cx + r * Math.cos(angle);
    const py = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function getBounds(obj) {
  return {
    x: obj.w < 0 ? obj.x + obj.w : obj.x,
    y: obj.h < 0 ? obj.y + obj.h : obj.y,
    w: Math.abs(obj.w),
    h: Math.abs(obj.h)
  };
}

function drawSelection(obj) {
  const b = getBounds(obj);
  ctx.save();
  ctx.strokeStyle = '#7C6FF0'; // Cute Purple
  ctx.lineWidth = 1.5 / camera.zoom;
  ctx.setLineDash([4 / camera.zoom, 3 / camera.zoom]);
  ctx.strokeRect(b.x - (2/camera.zoom), b.y - (2/camera.zoom), b.w + (4/camera.zoom), b.h + (4/camera.zoom));
  ctx.setLineDash([]);
  
  const handles = getHandles(b.x, b.y, b.w, b.h);
  ctx.fillStyle = 'white';
  ctx.strokeStyle = '#7C6FF0';
  ctx.lineWidth = 1.5 / camera.zoom;
  Object.values(handles).forEach(h => {
    ctx.beginPath();
    ctx.arc(h.x, h.y, 5 / camera.zoom, 0, Math.PI * 2); // Circle handles are cuter
    ctx.fill();
    ctx.stroke();
  });
  ctx.restore();
}

function drawMultiSelection() {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  selectedIds.forEach(id => {
    const obj = getObjects().find(o => o.id === id);
    if (obj) {
      const b = getBounds(obj);
      minX = Math.min(minX, b.x);
      minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.w);
      maxY = Math.max(maxY, b.y + b.h);
    }
  });
  
  ctx.save();
  ctx.strokeStyle = '#7C6FF0';
  ctx.lineWidth = 1.5 / camera.zoom;
  ctx.setLineDash([4 / camera.zoom, 3 / camera.zoom]);
  ctx.strokeRect(minX - (2/camera.zoom), minY - (2/camera.zoom), (maxX - minX) + (4/camera.zoom), (maxY - minY) + (4/camera.zoom));
  ctx.setLineDash([]);
  ctx.restore();
}

function getHandles(x, y, w, h) {
  return {
    nw: { x: x, y: y },
    n:  { x: x + w/2, y: y },
    ne: { x: x + w, y: y },
    e:  { x: x + w, y: y + h/2 },
    se: { x: x + w, y: y + h },
    s:  { x: x + w/2, y: y + h },
    sw: { x: x, y: y + h },
    w:  { x: x, y: y + h/2 }
  };
}

// ===== HIT TESTING =====
function hitTest(x, y) {
  if (selectedIds.length === 1) {
    const obj = getObjects().find(o => o.id === selectedIds[0]);
    if (obj && obj.visible !== false && !obj.locked) {
      const b = getBounds(obj);
      const handles = getHandles(b.x, b.y, b.w, b.h);
      const tolerance = 8 / camera.zoom;
      for (const [key, h] of Object.entries(handles)) {
        if (Math.abs(x - h.x) < tolerance && Math.abs(y - h.y) < tolerance) {
          return { type: 'handle', handle: key, obj };
        }
      }
    }
  }
  
  const objs = getObjects();
  for (let i = objs.length - 1; i >= 0; i--) {
    const obj = objs[i];
    if (obj.visible === false || obj.locked) continue;
    const b = getBounds(obj);
    
    if (obj.type === 'line') {
      const dist = distPointToSegment(x, y, obj.x, obj.y, obj.x + obj.w, obj.y + obj.h);
      if (dist < 5 + obj.strokeWidth) return { type: 'object', obj };
    } else {
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return { type: 'object', obj };
    }
  }
  return null;
}

function distPointToSegment(px, py, x1, y1, x2, y2) {
  const A = px - x1, B = py - y1, C = x2 - x1, D = y2 - y1;
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  if (lenSq !== 0) param = dot / lenSq;
  let xx, yy;
  if (param < 0) { xx = x1; yy = y1; } 
  else if (param > 1) { xx = x2; yy = y2; } 
  else { xx = x1 + param * C; yy = y1 + param * D; }
  return Math.sqrt((px - xx) ** 2 + (py - yy) ** 2);
}

// ===== SHAPE CREATION =====
let idCounter = 0;
function createShape(type, x, y, w, h) {
  const isText = type === 'text';
  const isLine = type === 'line';
  return {
    id: `obj_${++idCounter}`,
    type, x, y, w, h,
    rotation: 0,
    flipH: false,
    flipV: false,
    fill: isText || isLine ? '#1F2333' : '#FFD3E1', // Default cute pink
    fillType: 'solid',
    gradColor1: '#FF6B81',
    gradColor2: '#7C6FF0',
    stroke: '#7C6FF0',
    strokeWidth: isLine ? 2 : 0,
    strokeCap: 'round',
    opacity: 1,
    visible: true,
    locked: false,
    radius: type === 'rect' ? 12 : 0, // Cute rounded corners by default
    name: isText ? 'Text' : `${type.charAt(0).toUpperCase() + type.slice(1)} ${idCounter}`,
    text: isText ? 'Text' : null,
    fontSize: 16,
    fontWeight: 600,
    textAlign: 'left',
    shadow: { enabled: false, x: 0, y: 4, blur: 12, opacity: 30, color: '#7C6FF0' }
  };
}

function resizeObject(obj, handle, pos, shiftKey) {
  const b = getBounds(obj);
  let x = b.x, y = b.y, w = b.w, h = b.h;
  
  if (handle.includes('e')) w = pos.x - x;
  if (handle.includes('s')) h = pos.y - y;
  if (handle.includes('w')) { w += x - pos.x; x = pos.x; }
  if (handle.includes('n')) { h += y - pos.y; y = pos.y; }
  
  // Lock Aspect Ratio
  if (shiftKey && resizeStartBounds) {
    const ratio = resizeStartBounds.w / resizeStartBounds.h;
    if (Math.abs(w / resizeStartBounds.w) > Math.abs(h / resizeStartBounds.h)) {
      const newH = w / ratio;
      if (handle.includes('n')) y = resizeStartBounds.y + resizeStartBounds.h - newH;
      h = newH;
    } else {
      const newW = h * ratio;
      if (handle.includes('w')) x = resizeStartBounds.x + resizeStartBounds.w - newW;
      w = newW;
    }
  }
  
  obj.x = x; obj.y = y; obj.w = w; obj.h = h;
}

function getCursorForHandle(handle) {
  const cursors = {
    'nw': 'nwse-resize', 'se': 'nwse-resize',
    'ne': 'nesw-resize', 'sw': 'nesw-resize',
    'n': 'ns-resize', 's': 'ns-resize',
    'e': 'ew-resize', 'w': 'ew-resize'
  };
  return cursors[handle] || 'default';
}

// ===== SMART GUIDES / SNAPPING =====
function checkSnapping(movedObjs, dx, dy) {
  snapLines = [];
  let snapX = null, snapY = null;
  const threshold = 5 / camera.zoom;
  const staticObjs = getObjects().filter(o => !movedObjs.includes(o) && o.visible !== false);

  movedObjs.forEach(mObj => {
    const mB = getBounds(mObj);
    mB.x += dx; mB.y += dy;

    staticObjs.forEach(sObj => {
      const sB = getBounds(sObj);
      
      if (Math.abs((mB.x + mB.w/2) - (sB.x + sB.w/2)) < threshold) {
        snapX = sB.x + sB.w/2 - (mB.w/2) - (mB.x - dx);
        snapLines.push({ x1: sB.x + sB.w/2, y1: sB.y, x2: sB.x + sB.w/2, y2: sB.y + sB.h });
      }
      if (Math.abs(mB.x - sB.x) < threshold) {
        snapX = sB.x - (mB.x - dx);
        snapLines.push({ x1: sB.x, y1: sB.y, x2: sB.x, y2: sB.y + sB.h });
      }
      if (Math.abs((mB.y + mB.h/2) - (sB.y + sB.h/2)) < threshold) {
        snapY = sB.y + sB.h/2 - (mB.h/2) - (mB.y - dy);
        snapLines.push({ x1: sB.x, y1: sB.y + sB.h/2, x2: sB.x + sB.w, y2: sB.y + sB.h/2 });
      }
    });
  });

  return { dx: snapX !== null ? snapX : dx, dy: snapY !== null ? snapY : dy };
}

// ===== INTERACTION =====
canvas.addEventListener('mousedown', (e) => {
  const mousePos = getMousePos(e);
  const canvasPos = screenToCanvas(mousePos);
  startPos = canvasPos;
  isInteracting = true;
  
  if (e.button === 2) return;
  
  if (e.button === 1 || isSpaceDown || currentTool === 'hand') {
    interactionMode = 'pan';
    panStart = { x: mousePos.x - camera.x, y: mousePos.y - camera.y };
    canvas.style.cursor = 'grabbing';
    return;
  }
  
  const hit = hitTest(canvasPos.x, canvasPos.y);
  
  if (hit && hit.type === 'handle') {
    interactionMode = 'resize';
    activeHandle = hit.handle;
    resizeStartBounds = getBounds(hit.obj);
  } else if (hit && hit.type === 'object') {
    if (hit.obj.type === 'text' && e.detail === 2) {
      isInteracting = false; 
      editText(hit.obj);
      return;
    }
    
    if (!selectedIds.includes(hit.obj.id)) {
      if (!e.shiftKey) selectedIds = [];
      selectedIds.push(hit.obj.id);
    } else if (e.shiftKey) {
      selectedIds = selectedIds.filter(id => id !== hit.obj.id);
    }
    interactionMode = 'move';
    updateUI();
    render();
  } else {
    if (!e.shiftKey) selectedIds = [];
    if (currentTool === 'move') {
      interactionMode = null;
      updateUI();
      render();
    } else {
      interactionMode = 'draw';
      if (currentTool === 'text') {
        const newText = createShape('text', canvasPos.x, canvasPos.y, 0, 0);
        getObjects().push(newText);
        selectedIds = [newText.id];
        updateUI();
        render();
        isInteracting = false; 
        editText(newText);
        return;
      }
      tempShape = createShape(currentTool, canvasPos.x, canvasPos.y, 0, 0);
    }
  }
});

canvas.addEventListener('mousemove', (e) => {
  const mousePos = getMousePos(e);
  const canvasPos = screenToCanvas(mousePos);
  document.getElementById('cursor-coords').textContent = `${Math.round(canvasPos.x)}, ${Math.round(canvasPos.y)}`;
  
  if (!isInteracting) {
    if (currentTool === 'move') {
      const hit = hitTest(canvasPos.x, canvasPos.y);
      if (hit && hit.type === 'handle') canvas.style.cursor = getCursorForHandle(hit.handle);
      else if (hit) canvas.style.cursor = 'move';
      else canvas.style.cursor = 'default';
    }
    return;
  }
  
  if (interactionMode === 'pan') {
    camera.x = mousePos.x - panStart.x;
    camera.y = mousePos.y - panStart.y;
    render();
  } else if (interactionMode === 'draw' && tempShape) {
    tempShape.w = canvasPos.x - startPos.x;
    tempShape.h = canvasPos.y - startPos.y;
    if (tempShape.type !== 'line' && e.shiftKey) {
      const size = Math.max(Math.abs(tempShape.w), Math.abs(tempShape.h));
      tempShape.w = Math.sign(tempShape.w) * size;
      tempShape.h = Math.sign(tempShape.h) * size;
    }
    render();
  } else if (interactionMode === 'move') {
    let dx = canvasPos.x - startPos.x;
    let dy = canvasPos.y - startPos.y;
    
    const movedObjs = selectedIds.map(id => getObjects().find(o => o.id === id)).filter(Boolean);
    const snapRes = checkSnapping(movedObjs, dx, dy);
    dx = snapRes.dx;
    dy = snapRes.dy;
    
    movedObjs.forEach(obj => {
      if (!obj.locked) {
        obj.x += dx;
        obj.y += dy;
      }
    });
    startPos = { x: startPos.x + dx, y: startPos.y + dy };
    updateUI();
    render();
  } else if (interactionMode === 'resize' && selectedIds.length === 1) {
    const obj = getObjects().find(o => o.id === selectedIds[0]);
    if (obj && !obj.locked) {
      resizeObject(obj, activeHandle, canvasPos, e.shiftKey);
      updateUI();
      render();
    }
  }
});

canvas.addEventListener('mouseup', (e) => {
  if (interactionMode === 'draw' && tempShape) {
    if (Math.abs(tempShape.w) > 2 || Math.abs(tempShape.h) > 2) {
      getObjects().push(tempShape);
      selectedIds = [tempShape.id];
      markUnsaved();
      saveHistory();
    }
    tempShape = null;
    setTool('move');
  } else if (interactionMode === 'move' || interactionMode === 'resize') {
    markUnsaved();
    saveHistory();
  }
  
  snapLines = [];
  resizeStartBounds = null;
  isInteracting = false;
  interactionMode = null;
  activeHandle = null;
  canvas.style.cursor = currentTool === 'move' ? 'default' : 'crosshair';
  updateUI();
  render();
});

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const mousePos = getMousePos(e);
  
  if (e.ctrlKey || e.metaKey) {
    const delta = -e.deltaY * 0.01;
    const newZoom = Math.max(0.05, Math.min(10, camera.zoom * (1 + delta)));
    const before = screenToCanvas(mousePos);
    camera.zoom = newZoom;
    const after = screenToCanvas(mousePos);
    camera.x += (after.x - before.x) * camera.zoom;
    camera.y += (after.y - before.y) * camera.zoom;
  } else {
    camera.x -= e.deltaX;
    camera.y -= e.deltaY;
  }
  updateZoomDisplay();
  render();
}, { passive: false });

// ===== CONTEXT MENU =====
const contextMenu = document.getElementById('context-menu');
canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  const mousePos = getMousePos(e);
  const canvasPos = screenToCanvas(mousePos);
  const hit = hitTest(canvasPos.x, canvasPos.y);
  
  if (hit && hit.type === 'object') {
    if (!selectedIds.includes(hit.obj.id)) {
      selectedIds = [hit.obj.id];
      updateUI();
      render();
    }
    contextMenu.style.left = e.clientX + 'px';
    contextMenu.style.top = e.clientY + 'px';
    contextMenu.classList.add('active');
  }
});

window.addEventListener('click', () => contextMenu.classList.remove('active'));

contextMenu.addEventListener('click', (e) => {
  const action = e.target.closest('button')?.dataset.action;
  if (!action) return;
  
  if (action === 'duplicate') duplicateSelected();
  if (action === 'copy') copySelected();
  if (action === 'paste') pasteClipboard();
  if (action === 'paste-style') pasteStyle();
  if (action === 'group') groupSelected();
  if (action === 'ungroup') ungroupSelected();
  if (action === 'front') bringToFront();
  if (action === 'back') sendToBack();
  if (action === 'delete') deleteSelected();
});

// ===== TEXT EDITING =====
const textEditor = document.getElementById('text-editor');
textEditor.addEventListener('mousedown', (e) => e.stopPropagation());
textEditor.addEventListener('keydown', (e) => e.stopPropagation());

function editText(obj) {
  const rect = canvas.getBoundingClientRect();
  const screenX = rect.left + camera.x + (obj.x * camera.zoom);
  const screenY = rect.top + camera.y + (obj.y * camera.zoom);
  
  textEditor.style.left = screenX + 'px';
  textEditor.style.top = screenY + 'px';
  textEditor.style.fontSize = (obj.fontSize * camera.zoom) + 'px';
  textEditor.style.fontWeight = obj.fontWeight;
  textEditor.style.color = obj.fill;
  textEditor.style.display = 'block';
  textEditor.textContent = obj.text;
  textEditor.focus();
  
  const range = document.createRange();
  range.selectNodeContents(textEditor);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  
  const finishEdit = () => {
    obj.text = textEditor.textContent || 'Text';
    obj.name = obj.text; 
    textEditor.style.display = 'none';
    textEditor.onblur = null;
    textEditor.onkeydown = null;
    markUnsaved();
    saveHistory();
    updateUI();
    render();
  };
  
  textEditor.onblur = finishEdit;
  textEditor.onkeydown = (e) => {
    e.stopPropagation(); 
    if (e.key === 'Escape') { e.preventDefault(); finishEdit(); }
  };
}

// ===== GROUPING =====
function groupSelected() {
  if (selectedIds.length < 2) return;
  const groupId = `g_${Date.now()}`;
  getObjects().forEach(obj => {
    if (selectedIds.includes(obj.id)) obj.groupId = groupId;
  });
  markUnsaved();
  saveHistory();
  showToast('Grouped!');
}

function ungroupSelected() {
  getObjects().forEach(obj => {
    if (selectedIds.includes(obj.id)) obj.groupId = null;
  });
  markUnsaved();
  saveHistory();
  showToast('Ungrouped!');
}

// ===== IMAGE UPLOADING =====
document.getElementById('btn-add-image').addEventListener('click', () => {
  document.getElementById('image-upload').click();
});

document.getElementById('image-upload').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) handleImageFile(file, 0, 0);
  e.target.value = '';
});

canvasArea.addEventListener('dragover', (e) => e.preventDefault());
canvasArea.addEventListener('drop', (e) => {
  e.preventDefault();
  const files = e.dataTransfer.files;
  if (files.length > 0 && files[0].type.startsWith('image/')) {
    const pos = screenToCanvas(getMousePos(e));
    handleImageFile(files[0], pos.x, pos.y);
  }
});

window.addEventListener('paste', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.isContentEditable) return;
  const items = e.clipboardData.items;
  for (let item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      const pos = screenToCanvas(getMousePos(e));
      handleImageFile(file, pos.x, pos.y);
    }
  }
});

function handleImageFile(file, x, y) {
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height;
      const maxW = 400;
      if (w > maxW) { h = (h / w) * maxW; w = maxW; }
      
      const obj = createShape('image', x, y, w, h);
      obj.src = event.target.result;
      obj.name = file.name.substring(0, 20);
      
      imageCache[obj.id] = img;
      getObjects().push(obj);
      selectedIds = [obj.id];
      markUnsaved();
      saveHistory();
      updateUI();
      render();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

// ===== UI UPDATES =====
function updateUI() {
  const objs = getObjects();
  const isSingle = selectedIds.length === 1;
  const isMulti = selectedIds.length > 0;
  const obj = isSingle ? objs.find(o => o.id === selectedIds[0]) : null;
  
  ['prop-x', 'prop-y', 'prop-w', 'prop-h', 'prop-r', 'prop-opacity', 'fill-hex', 'stroke-hex', 'stroke-width', 'prop-radius', 'fill-type', 'grad-hex-1', 'grad-hex-2', 'stroke-cap', 'text-content', 'text-size', 'text-weight'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = !isSingle;
  });
  document.querySelectorAll('.align-btn').forEach(btn => btn.disabled = !isMulti);
  
  document.getElementById('section-text').style.display = (obj && obj.type === 'text') ? 'block' : 'none';
  document.getElementById('section-radius').style.display = (obj && (obj.type === 'rect' || obj.type === 'frame')) ? 'block' : 'none';
  
  if (obj) {
    const b = getBounds(obj);
    document.getElementById('prop-x').value = Math.round(b.x);
    document.getElementById('prop-y').value = Math.round(b.y);
    document.getElementById('prop-w').value = Math.round(b.w);
    document.getElementById('prop-h').value = Math.round(b.h);
    document.getElementById('prop-r').value = Math.round(obj.rotation || 0);
    document.getElementById('prop-opacity').value = Math.round((obj.opacity || 1) * 100);
    
    document.getElementById('fill-type').value = obj.fillType || 'solid';
    toggleFillControls();
    
    document.getElementById('fill-swatch').style.background = obj.fill;
    document.getElementById('fill-input').value = obj.fill;
    document.getElementById('fill-hex').value = obj.fill;
    
    document.getElementById('grad-swatch-1').style.background = obj.gradColor1 || '#FF6B81';
    document.getElementById('grad-input-1').value = obj.gradColor1 || '#FF6B81';
    document.getElementById('grad-hex-1').value = (obj.gradColor1 || '#FF6B81').toUpperCase();
    
    document.getElementById('grad-swatch-2').style.background = obj.gradColor2 || '#7C6FF0';
    document.getElementById('grad-input-2').value = obj.gradColor2 || '#7C6FF0';
    document.getElementById('grad-hex-2').value = (obj.gradColor2 || '#7C6FF0').toUpperCase();
    
    document.getElementById('stroke-swatch').style.background = obj.stroke;
    document.getElementById('stroke-input').value = obj.stroke;
    document.getElementById('stroke-hex').value = obj.stroke;
    document.getElementById('stroke-width').value = obj.strokeWidth;
    document.getElementById('stroke-cap').value = obj.strokeCap || 'round';
    
    document.getElementById('prop-radius').value = obj.radius || 0;
    
    document.getElementById('shadow-controls').style.display = obj.shadow && obj.shadow.enabled ? 'block' : 'none';
    if (obj.shadow) {
      document.getElementById('shadow-input').value = obj.shadow.color;
      document.getElementById('shadow-hex').value = obj.shadow.color;
      document.getElementById('shadow-swatch').style.background = obj.shadow.color;
      document.getElementById('shadow-x').value = obj.shadow.x;
      document.getElementById('shadow-y').value = obj.shadow.y;
      document.getElementById('shadow-blur').value = obj.shadow.blur;
      document.getElementById('shadow-opacity').value = obj.shadow.opacity;
    }
    
    if (obj.type === 'text') {
      document.getElementById('text-content').value = obj.text;
      document.getElementById('text-size').value = obj.fontSize;
      document.getElementById('text-weight').value = obj.fontWeight;
    }
  } else {
    document.getElementById('shadow-controls').style.display = 'none';
  }
  
  renderLayers();
  renderPages();
}

function toggleFillControls() {
  const type = document.getElementById('fill-type').value;
  document.getElementById('solid-fill-controls').style.display = type === 'solid' ? 'flex' : 'none';
  document.getElementById('gradient-fill-controls').style.display = type === 'gradient' ? 'block' : 'none';
}

document.getElementById('fill-type').addEventListener('change', () => {
  toggleFillControls();
  if (selectedIds.length !== 1) return;
  const obj = getObjects().find(o => o.id === selectedIds[0]);
  if (obj) {
    obj.fillType = document.getElementById('fill-type').value;
    render();
    markUnsaved();
    saveHistory();
  }
});

function renderLayers() {
  const list = document.getElementById('layers-list');
  list.innerHTML = '';
  
  [...getObjects()].reverse().forEach(obj => {
    const item = document.createElement('div');
    item.className = 'layer-item' + (selectedIds.includes(obj.id) ? ' selected' : '') + (obj.visible === false ? ' hidden' : '');
    
    let icon = 'fa-square';
    if (obj.type === 'ellipse') icon = 'fa-circle';
    if (obj.type === 'line') icon = 'fa-minus';
    if (obj.type === 'text') icon = 'fa-font';
    if (obj.type === 'frame') icon = 'fa-vector-square';
    if (obj.type === 'image') icon = 'fa-image';
    if (obj.type === 'star') icon = 'fa-star';
    if (obj.type === 'polygon') icon = 'fa-draw-polygon';
    if (obj.groupId) icon = 'fa-cube'; // Indicate group
    
    item.innerHTML = `
      <i class="fa-solid ${obj.locked ? 'fa-lock' : 'fa-lock-open'} action-icon" data-act="lock"></i>
      <i class="fa-solid ${icon} icon-type"></i>
      <span class="name-text">${obj.name}</span>
      <input type="text" class="layer-name" value="${obj.name}">
      <i class="fa-solid ${obj.visible !== false ? 'fa-eye' : 'fa-eye-slash'} action-icon" data-act="hide"></i>
    `;
    
    item.addEventListener('click', (e) => {
      if (e.target.dataset.act) return;
      if (e.shiftKey) {
        if (selectedIds.includes(obj.id)) selectedIds = selectedIds.filter(id => id !== obj.id);
        else selectedIds.push(obj.id);
      } else {
        selectedIds = [obj.id];
      }
      updateUI();
      render();
    });
    
    item.querySelector('.name-text').addEventListener('dblclick', () => {
      item.querySelector('.name-text').style.display = 'none';
      const input = item.querySelector('.layer-name');
      input.style.display = 'block';
      input.focus();
      input.select();
    });
    
    item.querySelector('.layer-name').addEventListener('blur', (e) => {
      let newName = e.target.value || 'Unnamed';
      obj.name = newName;
      if (obj.type === 'text') obj.text = newName; // Sync text content
      
      item.querySelector('.name-text').textContent = newName;
      e.target.style.display = 'none';
      item.querySelector('.name-text').style.display = 'block';
      markUnsaved();
      saveHistory();
      render();
    });
    
    item.querySelector('.layer-name').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') e.target.blur();
    });
    
    item.querySelector('[data-act="lock"]').addEventListener('click', (e) => {
      e.stopPropagation();
      obj.locked = !obj.locked;
      updateUI();
      render();
      markUnsaved();
      saveHistory();
    });
    
    item.querySelector('[data-act="hide"]').addEventListener('click', (e) => {
      e.stopPropagation();
      obj.visible = !obj.visible;
      updateUI();
      render();
      markUnsaved();
      saveHistory();
    });
    
    list.appendChild(item);
  });
}

function renderPages() {
  const list = document.getElementById('pages-list');
  list.innerHTML = '';
  
  pages.forEach(p => {
    const item = document.createElement('div');
    item.className = 'page-item' + (p.id === currentPageId ? ' active' : '');
    item.innerHTML = `<i class="fa-regular fa-file"></i><span>${p.name}</span>`;
    item.addEventListener('click', () => {
      currentPageId = p.id;
      selectedIds = [];
      updateUI();
      render();
    });
    list.appendChild(item);
  });
}

document.getElementById('add-page').addEventListener('click', () => {
  const newId = 'page_' + Date.now();
  const pageNum = pages.length + 1;
  pages.push({ id: newId, name: `Page ${pageNum}`, objects: [] });
  currentPageId = newId;
  selectedIds = [];
  updateUI();
  render();
  markUnsaved();
  saveHistory();
});

function updateZoomDisplay() {
  document.getElementById('zoom-reset').textContent = Math.round(camera.zoom * 100) + '%';
}

// ===== TOOL SELECTION =====
function setTool(tool) {
  currentTool = tool;
  document.querySelectorAll('.tb-tool[data-tool]').forEach(t => t.classList.remove('active'));
  const btn = document.querySelector(`[data-tool="${tool}"]`);
  if (btn) btn.classList.add('active');
  
  canvas.className = '';
  if (tool !== 'move' && tool !== 'hand') canvas.classList.add('drawing');
  if (tool === 'hand') canvas.classList.add('hand');
  
  if (tool !== 'move') selectedIds = [];
  updateUI();
  render();
}

document.querySelectorAll('.tb-tool[data-tool]').forEach(btn => {
  btn.addEventListener('click', () => setTool(btn.dataset.tool));
});

document.getElementById('btn-undo').addEventListener('click', undo);
document.getElementById('btn-redo').addEventListener('click', redo);

// ===== HELP MODAL =====
const helpModal = document.getElementById('help-modal');
document.getElementById('btn-help').addEventListener('click', () => helpModal.classList.add('active'));
document.getElementById('help-close').addEventListener('click', () => helpModal.classList.remove('active'));
helpModal.addEventListener('click', (e) => { if (e.target.id === 'help-modal') helpModal.classList.remove('active'); });

// ===== Z-ORDER =====
function bringToFront() {
  let objs = getObjects();
  selectedIds.forEach(id => {
    const idx = objs.findIndex(o => o.id === id);
    if (idx !== -1) {
      const [obj] = objs.splice(idx, 1);
      objs.push(obj);
    }
  });
  updateUI(); render(); markUnsaved(); saveHistory();
}
function sendToBack() {
  let objs = getObjects();
  selectedIds.forEach(id => {
    const idx = objs.findIndex(o => o.id === id);
    if (idx !== -1) {
      const [obj] = objs.splice(idx, 1);
      objs.unshift(obj);
    }
  });
  updateUI(); render(); markUnsaved(); saveHistory();
}

document.getElementById('layer-front').addEventListener('click', bringToFront);
document.getElementById('layer-back').addEventListener('click', sendToBack);

// ===== PROPERTY LISTENERS =====
function bindPropInput(id, prop, isInt = true) {
  const el = document.getElementById(id);
  if (!el) return;
  
  el.addEventListener('change', (e) => {
    if (selectedIds.length !== 1) return;
    const obj = getObjects().find(o => o.id === selectedIds[0]);
    if (obj) {
      let val = isInt ? parseInt(e.target.value) : parseFloat(e.target.value);
      if (isNaN(val)) val = 0;
      
      if (prop === 'x') obj.x = obj.w < 0 ? val - obj.w : val;
      else if (prop === 'y') obj.y = obj.h < 0 ? val - obj.h : val;
      else if (prop === 'w') obj.w = obj.w < 0 ? -val : val;
      else if (prop === 'h') obj.h = obj.h < 0 ? -val : val;
      else if (prop === 'opacity') obj.opacity = val / 100;
      else obj[prop] = val;
      
      render();
      markUnsaved();
      saveHistory();
    }
  });
  
  el.addEventListener('input', (e) => {
    if (selectedIds.length !== 1) return;
    const obj = getObjects().find(o => o.id === selectedIds[0]);
    if (obj) {
      let val = isInt ? parseInt(e.target.value) : parseFloat(e.target.value);
      if (isNaN(val)) val = 0;
      
      if (prop === 'x') obj.x = obj.w < 0 ? val - obj.w : val;
      else if (prop === 'y') obj.y = obj.h < 0 ? val - obj.h : val;
      else if (prop === 'w') obj.w = obj.w < 0 ? -val : val;
      else if (prop === 'h') obj.h = obj.h < 0 ? -val : val;
      else if (prop === 'opacity') obj.opacity = val / 100;
      else obj[prop] = val;
      
      render();
      markUnsaved();
    }
  });
}

bindPropInput('prop-x', 'x');
bindPropInput('prop-y', 'y');
bindPropInput('prop-w', 'w');
bindPropInput('prop-h', 'h');
bindPropInput('prop-r', 'rotation');
bindPropInput('prop-opacity', 'opacity');
bindPropInput('stroke-width', 'strokeWidth');
bindPropInput('prop-radius', 'radius');
bindPropInput('text-size', 'fontSize');

document.getElementById('text-content').addEventListener('input', (e) => {
  if (selectedIds.length !== 1) return;
  const obj = getObjects().find(o => o.id === selectedIds[0]);
  if (obj && obj.type === 'text') {
    obj.text = e.target.value;
    obj.name = e.target.value;
    renderLayers(); // Update layer name live
    render();
    markUnsaved();
  }
});
document.getElementById('text-content').addEventListener('change', () => saveHistory());

document.getElementById('text-weight').addEventListener('change', (e) => {
  if (selectedIds.length !== 1) return;
  const obj = getObjects().find(o => o.id === selectedIds[0]);
  if (obj) { obj.fontWeight = parseInt(e.target.value); render(); markUnsaved(); saveHistory(); }
});

document.getElementById('stroke-cap').addEventListener('change', (e) => {
  if (selectedIds.length !== 1) return;
  const obj = getObjects().find(o => o.id === selectedIds[0]);
  if (obj) { obj.strokeCap = e.target.value; render(); markUnsaved(); saveHistory(); }
});

document.querySelectorAll('.text-align-group .align-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (selectedIds.length !== 1) return;
    const obj = getObjects().find(o => o.id === selectedIds[0]);
    if (obj && obj.type === 'text') {
      obj.textAlign = btn.id.replace('text-align-', '');
      render();
      markUnsaved();
      saveHistory();
    }
  });
});

document.getElementById('flip-h').addEventListener('click', () => {
  if (selectedIds.length !== 1) return;
  const obj = getObjects().find(o => o.id === selectedIds[0]);
  if (obj) { obj.flipH = !obj.flipH; render(); markUnsaved(); saveHistory(); }
});
document.getElementById('flip-v').addEventListener('click', () => {
  if (selectedIds.length !== 1) return;
  const obj = getObjects().find(o => o.id === selectedIds[0]);
  if (obj) { obj.flipV = !obj.flipV; render(); markUnsaved(); saveHistory(); }
});

function bindColorInput(inputId, hexId, swatchId, prop) {
  document.getElementById(inputId).addEventListener('input', (e) => {
    if (selectedIds.length !== 1) return;
    const obj = getObjects().find(o => o.id === selectedIds[0]);
    if (obj) {
      obj[prop] = e.target.value;
      document.getElementById(hexId).value = e.target.value.toUpperCase();
      document.getElementById(swatchId).style.background = e.target.value;
      render();
      markUnsaved();
    }
  });
  document.getElementById(inputId).addEventListener('change', () => saveHistory());
}

bindColorInput('fill-input', 'fill-hex', 'fill-swatch', 'fill');
bindColorInput('grad-input-1', 'grad-hex-1', 'grad-swatch-1', 'gradColor1');
bindColorInput('grad-input-2', 'grad-hex-2', 'grad-swatch-2', 'gradColor2');
bindColorInput('stroke-input', 'stroke-hex', 'stroke-swatch', 'stroke');

document.getElementById('add-shadow').addEventListener('click', () => {
  if (selectedIds.length !== 1) return;
  const obj = getObjects().find(o => o.id === selectedIds[0]);
  if (obj) {
    obj.shadow.enabled = true;
    updateUI();
    render();
    markUnsaved();
    saveHistory();
  }
});

function bindShadowInput(id, prop, isInt = true) {
  document.getElementById(id).addEventListener('input', (e) => {
    if (selectedIds.length !== 1) return;
    const obj = getObjects().find(o => o.id === selectedIds[0]);
    if (obj && obj.shadow) {
      let val = isInt ? parseInt(e.target.value) : parseFloat(e.target.value);
      if (isNaN(val)) val = 0;
      obj.shadow[prop] = val;
      render();
      markUnsaved();
    }
  });
  document.getElementById(id).addEventListener('change', () => saveHistory());
}
bindShadowInput('shadow-x', 'x');
bindShadowInput('shadow-y', 'y');
bindShadowInput('shadow-blur', 'blur');
bindShadowInput('shadow-opacity', 'opacity');

document.getElementById('shadow-input').addEventListener('input', (e) => {
  if (selectedIds.length !== 1) return;
  const obj = getObjects().find(o => o.id === selectedIds[0]);
  if (obj && obj.shadow) {
    obj.shadow.color = e.target.value;
    document.getElementById('shadow-hex').value = e.target.value.toUpperCase();
    document.getElementById('shadow-swatch').style.background = e.target.value;
    render();
    markUnsaved();
  }
});
document.getElementById('shadow-input').addEventListener('change', () => saveHistory());

// ===== ALIGNMENT =====
document.querySelectorAll('.align-grid .align-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (selectedIds.length === 0) return;
    const align = btn.dataset.align;
    const ab = { w: 1000, h: 1000 }; 
    
    selectedIds.forEach(id => {
      const obj = getObjects().find(o => o.id === id);
      if (obj) {
        const b = getBounds(obj);
        if (align === 'left') obj.x = 0;
        if (align === 'right') obj.x = ab.w - b.w;
        if (align === 'h-center') obj.x = (ab.w - b.w) / 2;
        if (align === 'top') obj.y = 0;
        if (align === 'bottom') obj.y = ab.h - b.h;
        if (align === 'v-center') obj.y = (ab.h - b.h) / 2;
      }
    });
    updateUI();
    render();
    markUnsaved();
    saveHistory();
  });
});

// ===== ZOOM CONTROLS =====
document.getElementById('zoom-in').addEventListener('click', () => {
  camera.zoom = Math.min(10, camera.zoom * 1.2);
  updateZoomDisplay();
  render();
});
document.getElementById('zoom-out').addEventListener('click', () => {
  camera.zoom = Math.max(0.05, camera.zoom / 1.2);
  updateZoomDisplay();
  render();
});
document.getElementById('zoom-reset').addEventListener('click', () => {
  camera.zoom = 1; camera.x = 0; camera.y = 0;
  updateZoomDisplay();
  render();
});
document.getElementById('zoom-fit').addEventListener('click', () => {
  const objs = getObjects();
  if (objs.length === 0) return;
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  objs.forEach(o => {
    const b = getBounds(o);
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.w);
    maxY = Math.max(maxY, b.y + b.h);
  });
  
  const w = maxX - minX, h = maxY - minY;
  const rect = canvasArea.getBoundingClientRect();
  const zoomX = rect.width / w;
  const zoomY = rect.height / h;
  camera.zoom = Math.min(zoomX, zoomY) * 0.8;
  camera.x = (rect.width - w * camera.zoom) / 2 - minX * camera.zoom;
  camera.y = (rect.height - h * camera.zoom) / 2 - minY * camera.zoom;
  
  updateZoomDisplay();
  render();
});

// ===== EXPORT =====
function exportSVG() {
  let svg = `<svg width="1000" height="1000" xmlns="http://www.w3.org/2000/svg" style="background:#F7F8FC;">`;
  getObjects().forEach(o => {
    const b = getBounds(o);
    let fill = o.fillType === 'gradient' ? 'url(#grad1)' : o.fill;
    let transform = `transform="translate(${b.x + b.w/2}, ${b.y + b.h/2}) rotate(${o.rotation||0}) scale(${o.flipH?-1:1}, ${o.flipV?-1:1}) translate(${-b.w/2}, ${-b.h/2})"`;
    
    if (o.type === 'rect' || o.type === 'frame') {
      svg += `<rect x="0" y="0" width="${b.w}" height="${b.h}" fill="${fill}" stroke="${o.stroke}" stroke-width="${o.strokeWidth}" rx="${o.radius || 0}" opacity="${o.opacity || 1}" ${transform}/>`;
    } else if (o.type === 'ellipse') {
      svg += `<ellipse cx="${b.w/2}" cy="${b.h/2}" rx="${b.w/2}" ry="${b.h/2}" fill="${fill}" stroke="${o.stroke}" stroke-width="${o.strokeWidth}" opacity="${o.opacity || 1}" ${transform}/>`;
    } else if (o.type === 'line') {
      svg += `<line x1="${o.x}" y1="${o.y}" x2="${o.x + o.w}" y2="${o.y + o.h}" stroke="${o.stroke}" stroke-width="${o.strokeWidth}" stroke-linecap="${o.strokeCap}" opacity="${o.opacity || 1}"/>`;
    } else if (o.type === 'text') {
      svg += `<text x="${o.x}" y="${o.y + o.fontSize}" font-family="Inter, sans-serif" font-size="${o.fontSize}" font-weight="${o.fontWeight}" fill="${o.fill}" opacity="${o.opacity || 1}">${o.text}</text>`;
    } else if (o.type === 'image' && o.src) {
      svg += `<image x="0" y="0" width="${b.w}" height="${b.h}" href="${o.src}" opacity="${o.opacity || 1}" ${transform}/>`;
    }
  });
  svg += `</svg>`;
  
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mingshi-export.svg';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Exported as SVG ✨');
}

function exportPNG() {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = 1000;
  tempCanvas.height = 1000;
  const tCtx = tempCanvas.getContext('2d');
  
  tCtx.fillStyle = '#F7F8FC';
  tCtx.fillRect(0, 0, 1000, 1000);
  
  getObjects().forEach(obj => {
    tCtx.save();
    const b = getBounds(obj);
    tCtx.translate(b.x + b.w/2, b.y + b.h/2);
    if (obj.rotation) tCtx.rotate(obj.rotation * Math.PI / 180);
    if (obj.flipH) tCtx.scale(-1, 1);
    if (obj.flipV) tCtx.scale(1, -1);
    tCtx.translate(-b.w/2, -b.h/2);
    
    tCtx.globalAlpha = obj.opacity || 1;
    tCtx.fillStyle = obj.fill;
    tCtx.strokeStyle = obj.stroke;
    tCtx.lineWidth = obj.strokeWidth;
    
    if (obj.type === 'rect' || obj.type === 'frame') {
      tCtx.fillRect(0, 0, b.w, b.h);
    } else if (obj.type === 'ellipse') {
      tCtx.beginPath();
      tCtx.ellipse(b.w/2, b.h/2, b.w/2, b.h/2, 0, 0, Math.PI * 2);
      tCtx.fill();
    } else if (obj.type === 'line') {
      tCtx.beginPath();
      tCtx.moveTo(obj.x, obj.y);
      tCtx.lineTo(obj.x + obj.w, obj.y + obj.h);
      tCtx.stroke();
    } else if (obj.type === 'text') {
      tCtx.font = `${obj.fontWeight} ${obj.fontSize}px Inter, sans-serif`;
      tCtx.fillText(obj.text, 0, obj.fontSize);
    } else if (obj.type === 'image' && imageCache[obj.id]) {
      tCtx.drawImage(imageCache[obj.id], 0, 0, b.w, b.h);
    }
    tCtx.restore();
  });
  
  const link = document.createElement('a');
  link.download = 'mingshi-export.png';
  link.href = tempCanvas.toDataURL('image/png');
  link.click();
  showToast('Exported as PNG 🎨');
}

document.getElementById('btn-export-svg').addEventListener('click', exportSVG);
document.getElementById('btn-export-png').addEventListener('click', exportPNG);

// ===== KEYBOARD SHORTCUTS =====
function copySelected() {
  clipboard = selectedIds.map(id => getObjects().find(o => o.id === id)).filter(Boolean);
  showToast('Copied 📋');
}

function pasteClipboard() {
  const newIds = [];
  clipboard.forEach(obj => {
    const clone = JSON.parse(JSON.stringify(obj));
    clone.id = `obj_${++idCounter}`;
    clone.x += 20; clone.y += 20;
    clone.name = `${obj.name} copy`;
    if (clone.type === 'image' && obj.id) imageCache[clone.id] = imageCache[obj.id];
    getObjects().push(clone);
    newIds.push(clone.id);
  });
  selectedIds = newIds;
  updateUI(); render(); markUnsaved(); saveHistory();
}

function pasteStyle() {
  if (!styleClipboard || selectedIds.length === 0) return;
  selectedIds.forEach(id => {
    const obj = getObjects().find(o => o.id === id);
    if (obj) {
      obj.fill = styleClipboard.fill;
      obj.fillType = styleClipboard.fillType;
      obj.gradColor1 = styleClipboard.gradColor1;
      obj.gradColor2 = styleClipboard.gradColor2;
      obj.stroke = styleClipboard.stroke;
      obj.strokeWidth = styleClipboard.strokeWidth;
      obj.opacity = styleClipboard.opacity;
      obj.radius = styleClipboard.radius;
    }
  });
  updateUI(); render(); markUnsaved(); saveHistory();
  showToast('Style pasted ✨');
}

function duplicateSelected() {
  const newIds = [];
  selectedIds.forEach(id => {
    const obj = getObjects().find(o => o.id === id);
    if (obj) {
      const clone = JSON.parse(JSON.stringify(obj));
      clone.id = `obj_${++idCounter}`;
      clone.x += 20; clone.y += 20;
      clone.name = `${obj.name} copy`;
      if (clone.type === 'image' && obj.id) imageCache[clone.id] = imageCache[obj.id];
      getObjects().push(clone);
      newIds.push(clone.id);
    }
  });
  selectedIds = newIds;
  updateUI(); render(); markUnsaved(); saveHistory();
}

function deleteSelected() {
  let objs = getObjects();
  selectedIds.forEach(id => { objs = objs.filter(o => o.id !== id); });
  setObjects(objs);
  selectedIds = [];
  updateUI(); render();
  markUnsaved();
  saveHistory();
}

window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.isContentEditable) return;
  
  if (e.code === 'Space') { isSpaceDown = true; canvas.style.cursor = 'grab'; }
  
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'c') {
      if (e.altKey) { // Copy Style
        e.preventDefault();
        if (selectedIds.length === 1) {
          const obj = getObjects().find(o => o.id === selectedIds[0]);
          styleClipboard = JSON.parse(JSON.stringify(obj));
          showToast('Style copied 🎨');
        }
      } else {
        copySelected();
      }
    } 
    else if (e.key === 'v') {
      if (e.altKey) { // Paste Style
        e.preventDefault();
        pasteStyle();
      } else {
        pasteClipboard();
      }
    }
    else if (e.key === 'd') { e.preventDefault(); duplicateSelected(); }
    else if (e.key === 'g' && !e.shiftKey) { e.preventDefault(); groupSelected(); }
    else if (e.key === 'g' && e.shiftKey) { e.preventDefault(); ungroupSelected(); }
    else if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) { e.preventDefault(); redo(); }
    else if (e.key === '/') { e.preventDefault(); helpModal.classList.add('active'); }
    return;
  }
  
  const key = e.key.toLowerCase();
  if (key === 'v') setTool('move');
  if (key === 'f') setTool('frame');
  if (key === 'r') setTool('rect');
  if (key === 'o') setTool('ellipse');
  if (key === 'g') setTool('polygon');
  if (key === 's') setTool('star');
  if (key === 'l') setTool('line');
  if (key === 't') setTool('text');
  if (key === 'h') setTool('hand');
  
  if (selectedIds.length > 0) {
    let dx = 0, dy = 0;
    if (e.key === 'ArrowLeft') dx = e.shiftKey ? -10 : -1;
    if (e.key === 'ArrowRight') dx = e.shiftKey ? 10 : 1;
    if (e.key === 'ArrowUp') dy = e.shiftKey ? -10 : -1;
    if (e.key === 'ArrowDown') dy = e.shiftKey ? 10 : 1;
    
    if (dx !== 0 || dy !== 0) {
      e.preventDefault();
      selectedIds.forEach(id => {
        const obj = getObjects().find(o => o.id === id);
        if (obj && !obj.locked) {
          obj.x += dx;
          obj.y += dy;
        }
      });
      updateUI();
      render();
      markUnsaved();
    }
  }
  
  if (key === 'delete' || key === 'backspace') deleteSelected();
  
  if (key === 'escape') {
    selectedIds = [];
    updateUI(); render();
    helpModal.classList.remove('active');
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'Space') { 
    isSpaceDown = false; 
    canvas.style.cursor = currentTool === 'move' ? 'default' : 'crosshair';
  }
  if (selectedIds.length > 0 && (e.key.startsWith('Arrow'))) {
    saveHistory();
  }
});

// ===== LOCAL STORAGE =====
function getProjects() {
  return JSON.parse(localStorage.getItem('mingshi_projects') || '{}');
}

function saveProjects(projects) {
  try {
    localStorage.setItem('mingshi_projects', JSON.stringify(projects));
    return true;
  } catch (e) {
    showToast('Storage full! Try removing large images.');
    return false;
  }
}

function markUnsaved() {
  document.getElementById('save-status').textContent = "Unsaved changes";
  document.getElementById('save-status').style.color = "#EF4F6B"; // Cute danger
}

function markSaved() {
  document.getElementById('save-status').textContent = "Saved";
  document.getElementById('save-status').style.color = "var(--text-tertiary)";
}

document.getElementById('btn-save').addEventListener('click', () => {
  if (currentProjectName === 'Untitled') openProjectModal(true);
  else saveCurrentProject(currentProjectName);
});

document.getElementById('btn-open').addEventListener('click', () => openProjectModal(false));
document.getElementById('menu-btn').addEventListener('click', () => openProjectModal(false));

function saveCurrentProject(name) {
  const projects = getProjects();
  projects[name] = {
    pages: pages,
    currentPageId: currentPageId,
    timestamp: Date.now()
  };
  if (saveProjects(projects)) {
    currentProjectName = name;
    document.getElementById('file-name').textContent = name;
    markSaved();
    closeModal();
    showToast(`Saved as ${name} 💖`);
  }
}

function loadProject(name) {
  const projects = getProjects();
  if (projects[name]) {
    pages = projects[name].pages;
    currentPageId = projects[name].currentPageId;
    
    pages.forEach(page => {
      page.objects.forEach(obj => {
        if (obj.type === 'image' && obj.src) {
          const img = new Image();
          img.onload = () => render();
          img.src = obj.src;
          imageCache[obj.id] = img;
        }
      });
    });
    
    selectedIds = [];
    currentProjectName = name;
    document.getElementById('file-name').textContent = name;
    markSaved();
    
    history = [];
    historyIndex = -1;
    saveHistory();
    
    updateUI();
    render();
    closeModal();
  }
}

function deleteProject(name) {
  const projects = getProjects();
  delete projects[name];
  saveProjects(projects);
  openProjectModal(false);
}

function openProjectModal(saveMode) {
  const modal = document.getElementById('project-modal');
  const list = document.getElementById('project-list');
  
  list.innerHTML = '';
  const projects = getProjects();
  const keys = Object.keys(projects).sort((a, b) => projects[b].timestamp - projects[a].timestamp);
  
  if (keys.length === 0) {
    list.innerHTML = '<div style="color: var(--text-tertiary); text-align: center; padding: 20px;">No saved projects yet</div>';
  } else {
    keys.forEach(name => {
      const p = projects[name];
      const date = new Date(p.timestamp).toLocaleString();
      const div = document.createElement('div');
      div.className = 'project-item';
      div.innerHTML = `
        <div class="p-info">
          <span class="p-name">${name}</span>
          <span class="p-date">${date}</span>
        </div>
        <div class="p-actions">
          <button class="load"><i class="fa-solid fa-folder-open"></i> Open</button>
          <button class="del"><i class="fa-solid fa-trash"></i></button>
        </div>
      `;
      div.querySelector('.load').addEventListener('click', () => loadProject(name));
      div.querySelector('.del').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteProject(name);
        showToast(`Deleted ${name}`);
      });
      list.appendChild(div);
    });
  }
  
  modal.classList.add('active');
}

function closeModal() {
  document.getElementById('project-modal').classList.remove('active');
}

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('project-modal').addEventListener('click', (e) => {
  if (e.target.id === 'project-modal') closeModal();
});

document.getElementById('btn-save-new').addEventListener('click', () => {
  const name = document.getElementById('new-project-name').value.trim();
  if (name) {
    saveCurrentProject(name);
    document.getElementById('new-project-name').value = '';
  }
});

document.getElementById('new-project-name').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const name = e.target.value.trim();
    if (name) {
      saveCurrentProject(name);
      e.target.value = '';
    }
  }
});

// ===== TOAST =====
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

// ===== HELPERS =====
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ===== DESKTOP NOTICE =====
const deviceNotice = document.getElementById('device-notice');

function showDeviceNotice(isWarning = false) {
  if (isWarning) deviceNotice.querySelector('.modal').classList.add('warn');
  else deviceNotice.querySelector('.modal').classList.remove('warn');
  deviceNotice.classList.add('active');
}

function hideDeviceNotice() {
  deviceNotice.classList.remove('active');
}

document.getElementById('device-ok').addEventListener('click', () => {
  localStorage.setItem('mingshi_device_notice_seen', 'true');
  hideDeviceNotice();
});

document.getElementById('device-continue').addEventListener('click', () => {
  localStorage.setItem('mingshi_device_notice_seen', 'true');
  hideDeviceNotice();
});

deviceNotice.addEventListener('click', (e) => {
  if (e.target.id === 'device-notice') hideDeviceNotice();
});

function checkDevice() {
  const hasSeenNotice = localStorage.getItem('mingshi_device_notice_seen');
  const screenWidth = window.innerWidth;
  const isTouchOnly = ('ontouchstart' in window) && (navigator.maxTouchPoints > 0) && !window.matchMedia('(pointer: fine)').matches;
  const isSmallScreen = screenWidth < 1024;
  
  if (!hasSeenNotice || isSmallScreen || isTouchOnly) {
    const isWarning = isSmallScreen || isTouchOnly;
    setTimeout(() => showDeviceNotice(isWarning), 1800); // After splash screen
    
    if (isWarning) {
      setTimeout(() => showMiniBanner(), 4000);
    }
  }
}

function showMiniBanner() {
  if (window.innerWidth >= 1024) return;
  let banner = document.getElementById('device-mini-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'device-mini-banner';
    banner.className = 'device-mini-banner';
    banner.innerHTML = '<i class="fa-solid fa-circle-info"></i> For the best experience, use a computer <button id="mini-banner-close"><i class="fa-solid fa-xmark"></i></button>';
    document.body.appendChild(banner);
    
    document.getElementById('mini-banner-close').addEventListener('click', () => {
      banner.classList.remove('show');
    });
  }
  banner.classList.add('show');
}

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (window.innerWidth < 1024) {
      showMiniBanner();
    } else {
      const banner = document.getElementById('device-mini-banner');
      if (banner) banner.classList.remove('show');
    }
  }, 500);
});

// ===== INIT =====
initTheme();
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
saveHistory(); 
updateUI();
checkDevice();