/* ========================
   MOONBIEVE - script.js
   ======================== */

// ── LOADING SCREEN ───────────────────────────────────────────
window.addEventListener('load', function () {
  setTimeout(function () {
    const s = document.getElementById('loading-screen');
    s.classList.add('hide');
    setTimeout(() => s.remove(), 700);
  }, 1800);
});

// ── STATIC DECORATIONS (no animation) ───────────────────────
(function () {
  const wrap = document.getElementById('bgDecorations');

  const bfPalette = [
    ['#c9b8ff','#9d88e0'], ['#ff9de2','#e06ab5'],
    ['#7ee8fa','#4dbddb'], ['#ffe066','#e0b830'],
    ['#ffb3d1','#e87aaa'],
  ];
  const ribColors = ['#c9b8ff','#ff9de2','#7ee8fa','#ffe066','#ffb3d1','#b8ffc9'];

  // Fixed butterfly positions & tilts — NO animation
  const butterflies = [
    {l:3,  t:12, r:-18, s:24},
    {l:88, t:8,  r: 14, s:20},
    {l:15, t:72, r: -8, s:28},
    {l:78, t:68, r: 20, s:22},
    {l:48, t:5,  r:-24, s:18},
    {l:62, t:80, r:  8, s:26},
    {l:30, t:40, r:-12, s:20},
    {l:92, t:45, r: 16, s:22},
  ];

  butterflies.forEach((b, i) => {
    const [c1, c2] = bfPalette[i % bfPalette.length];
    const el = document.createElement('div');
    el.className = 'bg-deco';
    el.style.cssText = `left:${b.l}%;top:${b.t}%;opacity:0.18;transform:rotate(${b.r}deg)`;
    el.innerHTML = `<svg width="${b.s}" height="${Math.round(b.s*.75)}" viewBox="0 0 40 30" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="14" cy="10" rx="13" ry="9"  fill="${c1}" opacity=".9"/>
      <ellipse cx="13" cy="22" rx="10" ry="7"  fill="${c2}" opacity=".8"/>
      <ellipse cx="26" cy="10" rx="13" ry="9"  fill="${c1}" opacity=".9"/>
      <ellipse cx="27" cy="22" rx="10" ry="7"  fill="${c2}" opacity=".8"/>
      <ellipse cx="20" cy="16" rx="2.2" ry="8" fill="#1a0a2e" opacity=".9"/>
      <line x1="20" y1="8" x2="14" y2="2" stroke="#1a0a2e" stroke-width=".8"/>
      <line x1="20" y1="8" x2="26" y2="2" stroke="#1a0a2e" stroke-width=".8"/>
      <circle cx="14" cy="2" r="1.2" fill="${c1}"/>
      <circle cx="26" cy="2" r="1.2" fill="${c1}"/>
      <circle cx="16" cy="9" r="1.8" fill="rgba(255,255,255,.3)"/>
      <circle cx="24" cy="9" r="1.8" fill="rgba(255,255,255,.3)"/>
    </svg>`;
    wrap.appendChild(el);
  });

  // Fixed ribbon positions — NO animation
  const ribbons = [
    {l: 5, t:15, r:-20}, {l:18, t:60, r: 15},
    {l:28, t:25, r:-10}, {l:40, t:80, r: 25},
    {l:52, t:10, r:-30}, {l:63, t:55, r: 10},
    {l:72, t:30, r:-15}, {l:83, t:75, r: 20},
    {l:91, t:20, r:-25}, {l:10, t:85, r:  5},
    {l:46, t:45, r: -5}, {l:97, t:60, r: 30},
  ];

  ribbons.forEach((rb, i) => {
    const col = ribColors[i % ribColors.length];
    const w = 7 + (i % 4) * 2;
    const h = 28 + (i % 5) * 6;
    const cx = w / 2;
    const el = document.createElement('div');
    el.className = 'bg-deco';
    el.style.cssText = `left:${rb.l}%;top:${rb.t}%;opacity:0.16;transform:rotate(${rb.r}deg)`;
    el.innerHTML = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
      <path d="M${cx},0 Q${w},${h*.15} ${cx},${h*.3} Q0,${h*.45} ${cx},${h*.6} Q${w},${h*.75} ${cx},${h*.9} Q${cx*.5},${h} ${cx},${h}"
            stroke="${col}" stroke-width="${w*.55}" stroke-linecap="round" fill="none"/>
    </svg>`;
    wrap.appendChild(el);
  });
})();

// ── STATE ────────────────────────────────────────────────────
let mode            = 'text';
let penColor        = '#e8e0ff';
let highlightColor  = '#c9b8ff60';
let brushSize       = 4;
let isDrawing       = false;
let lastX = 0, lastY = 0;
let selectedSticker       = null;
let selectedCustomSticker = null;
let customStickers        = [];
let history   = [];
let historyHL = [];

// ── DATE ─────────────────────────────────────────────────────
const d = new Date();
document.getElementById('noteDate').textContent =
  d.toLocaleDateString('id-ID', {weekday:'long', year:'numeric', month:'long', day:'numeric'});

// ── CANVAS SETUP ─────────────────────────────────────────────
const dc        = document.getElementById('drawCanvas');
const hc        = document.getElementById('highlightCanvas');
const ctx       = dc.getContext('2d');
const hctx      = hc.getContext('2d');
const container = document.getElementById('canvasContainer');

function resizeCanvas() {
  const r = container.getBoundingClientRect();
  const w = Math.max(r.width  || 800, 1);
  const h = Math.max(r.height || 480, 1);
  let i1=null, i2=null;
  try { if (dc.width>0&&dc.height>0) i1=ctx.getImageData(0,0,dc.width,dc.height); } catch(e){}
  try { if (hc.width>0&&hc.height>0) i2=hctx.getImageData(0,0,hc.width,hc.height); } catch(e){}
  dc.width=w; dc.height=h; dc.style.width=w+'px'; dc.style.height=h+'px';
  hc.width=w; hc.height=h; hc.style.width=w+'px'; hc.style.height=h+'px';
  try { if(i1) ctx.putImageData(i1,0,0);  } catch(e){}
  try { if(i2) hctx.putImageData(i2,0,0); } catch(e){}
}
setTimeout(resizeCanvas, 150);
window.addEventListener('resize', ()=>setTimeout(resizeCanvas, 100));

// ── EMOJI STICKERS ───────────────────────────────────────────
const stickers = [
  '🌙','⭐','🌟','💫','✨','🌌','🌠','🔮',
  '🌸','🌺','🌻','🦄','🌈','💝','🍓','🐣',
  '🫶','🧁','🎵','🌴','🍀','🌊','🎀','🎗️',
  '🦋','🐝','🌿','🎆','💎','🧿','🌃','🪐'
];
const stickerGrid = document.getElementById('stickerGrid');
stickers.forEach(s => {
  const el = document.createElement('div');
  el.className   = 'sticker-item';
  el.textContent = s;
  // Use addEventListener, not onclick, so stopPropagation works cleanly
  el.addEventListener('click', function(ev) {
    ev.stopPropagation();
    document.querySelectorAll('.sticker-item').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.custom-sticker-item').forEach(x=>x.classList.remove('active'));
    el.classList.add('active');
    selectedSticker       = s;
    selectedCustomSticker = null;
    setMode('sticker', null);
    document.getElementById('stickerActive').textContent = 'Stiker "'+s+'" dipilih! Klik di catatan.';
  });
  stickerGrid.appendChild(el);
});

// ── CUSTOM IMAGE STICKERS ────────────────────────────────────
function uploadCustomSticker(input) {
  if (!input.files||!input.files.length) return;
  Array.from(input.files).forEach(file => {
    const fr = new FileReader();
    fr.onload = function(e) {
      customStickers.push({id:'cs_'+Date.now()+'_'+Math.random().toString(36).slice(2), dataUrl:e.target.result, name:file.name});
      renderCustomStickerGrid();
    };
    fr.readAsDataURL(file);
  });
  input.value='';
}

function renderCustomStickerGrid() {
  const gridEl  = document.getElementById('customStickerGrid');
  const emptyEl = document.getElementById('customStickerEmpty');
  gridEl.innerHTML = '';
  if (!customStickers.length) { emptyEl.style.display=''; return; }
  emptyEl.style.display = 'none';
  customStickers.forEach(sc => {
    const wrap = document.createElement('div');
    wrap.className  = 'custom-sticker-item';
    const img = document.createElement('img');
    img.src=sc.dataUrl; img.title=sc.name;
    const del = document.createElement('div');
    del.className='custom-sticker-del'; del.textContent='×';
    del.addEventListener('click', function(ev) {
      ev.stopPropagation();
      customStickers = customStickers.filter(x=>x.id!==sc.id);
      if (selectedCustomSticker===sc.dataUrl) { selectedCustomSticker=null; document.getElementById('stickerActive').textContent='Klik stiker lalu klik di catatan'; }
      renderCustomStickerGrid();
    });
    wrap.appendChild(img); wrap.appendChild(del);
    wrap.addEventListener('click', function(ev) {
      ev.stopPropagation();
      document.querySelectorAll('.sticker-item').forEach(x=>x.classList.remove('active'));
      document.querySelectorAll('.custom-sticker-item').forEach(x=>x.classList.remove('active'));
      wrap.classList.add('active');
      selectedCustomSticker=sc.dataUrl; selectedSticker=null;
      setMode('sticker', null);
      document.getElementById('stickerActive').textContent='📸 "'+sc.name.slice(0,14)+'" dipilih!';
    });
    gridEl.appendChild(wrap);
  });
}

// ── MODE ─────────────────────────────────────────────────────
function setMode(m, btn) {
  mode = m;
  document.querySelectorAll('.tool-btn[id^="mode"]').forEach(b=>b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const labels = {text:'✏️ Mode Teks', draw:'🖊 Mode Gambar', highlight:'🖍 Mode Stabilo', erase:'🧹 Mode Hapus', sticker:'🌙 Mode Stiker'};
  document.getElementById('modeLabel').textContent = labels[m]||'Mode';
  const ta = document.getElementById('noteText');
  // interactLayer ALWAYS pointer-events:none — items inside manage their own events
  // textarea goes to z-index:6 only in text mode so it sits above everything
  if (m==='text') {
    ta.classList.add('active');
    container.style.cursor='text';
  } else {
    ta.classList.remove('active');
    container.style.cursor = m==='sticker' ? 'cell' : 'crosshair';
  }
}

// ── COLOR ─────────────────────────────────────────────────────
function setPenColor(c, el) {
  penColor=c;
  document.querySelectorAll('.palette-dot').forEach(x=>x.classList.remove('active'));
  if(el) el.classList.add('active');
}
function setPenColorCustom(inp) { penColor=inp.value; }
function setHighlight(c, el) {
  highlightColor=c;
  document.querySelectorAll('.hcol').forEach(x=>x.classList.remove('active'));
  if(el) el.classList.add('active');
}

// ── DRAW ─────────────────────────────────────────────────────
function getPos(e) {
  const r=dc.getBoundingClientRect(), src=e.touches?e.touches[0]:e;
  return [src.clientX-r.left, src.clientY-r.top];
}
function startDraw(e) {
  if (mode==='text'||mode==='sticker') return;
  isDrawing=true; [lastX,lastY]=getPos(e);
  if (mode==='draw'||mode==='erase') { try{history.push(ctx.getImageData(0,0,dc.width,dc.height)); if(history.length>30)history.shift();}catch(err){} }
  if (mode==='highlight')             { try{historyHL.push(hctx.getImageData(0,0,hc.width,hc.height)); if(historyHL.length>30)historyHL.shift();}catch(err){} }
  e.preventDefault();
}
function draw(e) {
  if (!isDrawing) return;
  const [x,y]=getPos(e);
  if (mode==='draw') {
    ctx.beginPath(); ctx.moveTo(lastX,lastY); ctx.lineTo(x,y);
    ctx.strokeStyle=penColor; ctx.lineWidth=brushSize; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.stroke();
  } else if (mode==='erase') {
    ctx.clearRect(x-brushSize*2,y-brushSize*2,brushSize*4,brushSize*4);
    hctx.clearRect(x-brushSize*2,y-brushSize*2,brushSize*4,brushSize*4);
  } else if (mode==='highlight') {
    hctx.globalAlpha=0.4;
    hctx.beginPath(); hctx.moveTo(lastX,lastY); hctx.lineTo(x,y);
    hctx.strokeStyle=highlightColor.length>7?highlightColor.slice(0,7):highlightColor;
    hctx.lineWidth=Math.max(brushSize*4,16); hctx.lineCap='round'; hctx.lineJoin='round'; hctx.stroke();
    hctx.globalAlpha=1;
  }
  [lastX,lastY]=[x,y]; e.preventDefault();
}
function stopDraw() { isDrawing=false; }

container.addEventListener('mousedown',  startDraw);
container.addEventListener('mousemove',  draw);
container.addEventListener('mouseup',    stopDraw);
container.addEventListener('mouseleave', stopDraw);
container.addEventListener('touchstart', startDraw, {passive:false});
container.addEventListener('touchmove',  draw,      {passive:false});
container.addEventListener('touchend',   stopDraw);

// ── STICKER PLACE ─────────────────────────────────────────────
// Root cause of double-sticker bug:
// The old code used il.classList.add('interactive') which set pointer-events:all
// on #interactLayer. When the user clicked, the event fired on interactLayer
// AND bubbled up to container — triggering placeSticker TWICE.
//
// Fix: interactLayer NEVER gets pointer-events. The container listener checks
// e.target to reject clicks that originated FROM an existing sticker/photo
// (those are already-placed items that handle drag themselves).
container.addEventListener('click', function(e) {
  if (mode !== 'sticker') return;
  if (!selectedSticker && !selectedCustomSticker) return;

  // Reject if the click came from an already-placed sticker or photo
  // (user is clicking on an existing item, not placing a new one)
  if (e.target.closest('.sticker-placed, .sticker-placed-img, .photo-zone')) return;

  const r = container.getBoundingClientRect();
  const x = e.clientX - r.left;
  const y = e.clientY - r.top;

  if (selectedCustomSticker) {
    placeImageSticker(selectedCustomSticker, x, y);
  } else {
    placeSticker(selectedSticker, x, y);
  }
});

function placeSticker(emoji, x, y) {
  const sz = +document.getElementById('stickerSize').value;
  const el = document.createElement('div');
  el.className    = 'sticker-placed';
  el.style.fontSize = sz+'px';
  el.style.left   = (x-sz/2)+'px';
  el.style.top    = (y-sz/2)+'px';
  el.textContent  = emoji;
  const del = document.createElement('div');
  del.className='delete-btn'; del.textContent='×';
  del.addEventListener('click', ev=>{ev.stopPropagation(); el.remove();});
  el.appendChild(del);
  makeDraggable(el);
  document.getElementById('interactLayer').appendChild(el);
}

function placeImageSticker(dataUrl, x, y) {
  const sz   = +document.getElementById('stickerSize').value;
  const wrap = document.createElement('div');
  wrap.className   = 'sticker-placed-img';
  wrap.style.width = sz+'px'; wrap.style.height=sz+'px';
  wrap.style.left  = (x-sz/2)+'px'; wrap.style.top=(y-sz/2)+'px';
  const img = document.createElement('img'); img.src=dataUrl;
  const del = document.createElement('div');
  del.className='delete-btn'; del.textContent='×';
  del.addEventListener('click', ev=>{ev.stopPropagation(); wrap.remove();});
  const rh = document.createElement('div'); rh.className='resize-handle';
  rh.addEventListener('mousedown', function(ev) {
    ev.stopPropagation();
    const startW=wrap.offsetWidth, startX=ev.clientX;
    function onM(e2){const ns=Math.max(20,startW+e2.clientX-startX); wrap.style.width=ns+'px'; wrap.style.height=ns+'px';}
    function onU(){document.removeEventListener('mousemove',onM); document.removeEventListener('mouseup',onU);}
    document.addEventListener('mousemove',onM); document.addEventListener('mouseup',onU);
  });
  wrap.appendChild(img); wrap.appendChild(del); wrap.appendChild(rh);
  makeDraggable(wrap);
  document.getElementById('interactLayer').appendChild(wrap);
}

// ── DRAGGABLE ─────────────────────────────────────────────────
function makeDraggable(el) {
  let ox, oy, startL, startT, hasMoved;
  el.addEventListener('mousedown', function(e) {
    if (e.target.classList.contains('delete-btn')||e.target.classList.contains('resize-handle')) return;
    e.stopPropagation(); // prevent container from seeing this mousedown
    ox=e.clientX; oy=e.clientY;
    startL=parseInt(el.style.left)||0; startT=parseInt(el.style.top)||0;
    hasMoved=false;
    function onMove(e2) {
      hasMoved=true;
      el.style.left=(startL+e2.clientX-ox)+'px';
      el.style.top =(startT+e2.clientY-oy)+'px';
    }
    function onUp() {
      document.removeEventListener('mousemove',onMove);
      document.removeEventListener('mouseup',onUp);
    }
    document.addEventListener('mousemove',onMove);
    document.addEventListener('mouseup',onUp);
  });
}

// ── PHOTO ─────────────────────────────────────────────────────
function insertPhoto(input) {
  if (!input.files||!input.files[0]) return;
  const fr=new FileReader();
  fr.onload=function(e){
    const wrap=document.createElement('div'); wrap.className='photo-zone'; wrap.style.cssText='left:40px;top:40px;width:200px';
    const img=document.createElement('img'); img.src=e.target.result; img.style.width='100%';
    const del=document.createElement('div'); del.className='delete-btn'; del.textContent='×';
    del.addEventListener('click',ev=>{ev.stopPropagation();wrap.remove();});
    const rh=document.createElement('div'); rh.className='resize-handle';
    rh.addEventListener('mousedown',function(ev){
      ev.stopPropagation();
      const startW=wrap.offsetWidth, startX=ev.clientX;
      function onM(e2){wrap.style.width=Math.max(60,startW+e2.clientX-startX)+'px';}
      function onU(){document.removeEventListener('mousemove',onM);document.removeEventListener('mouseup',onU);}
      document.addEventListener('mousemove',onM); document.addEventListener('mouseup',onU);
    });
    wrap.appendChild(img); wrap.appendChild(del); wrap.appendChild(rh);
    makeDraggable(wrap);
    document.getElementById('interactLayer').appendChild(wrap);
    input.value='';
  };
  fr.readAsDataURL(input.files[0]);
}

// ── UNDO & CLEAR ──────────────────────────────────────────────
function undoLast() {
  if (mode==='highlight'&&historyHL.length>0) hctx.putImageData(historyHL.pop(),0,0);
  else if (history.length>0) ctx.putImageData(history.pop(),0,0);
}
function clearCanvas() {
  if (!confirm('Bersihkan semua gambar & stiker?')) return;
  ctx.clearRect(0,0,dc.width,dc.height);
  hctx.clearRect(0,0,hc.width,hc.height);
  document.getElementById('interactLayer').innerHTML='';
  history=[]; historyHL=[];
}

// ── TAB SWITCH ────────────────────────────────────────────────
function switchTab(tab, btn) {
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('tab-tools').style.display   = tab==='tools'   ?'':'none';
  document.getElementById('tab-sticker').style.display = tab==='sticker' ?'':'none';
}

// ── NEW PAGE ──────────────────────────────────────────────────
function addNewPage() {
  if (!confirm('Buat halaman baru? Catatan saat ini akan direset.')) return;
  clearCanvas();
  document.getElementById('noteTitle').value='Catatan Baru 🌙';
  document.getElementById('noteText').value='';
}

// ── SAVE / LOAD ───────────────────────────────────────────────
const STORAGE_KEY='moonbieve_saves';
const getAllSaves=()=>{ try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');}catch(e){return[];} };
const putAllSaves=arr=>localStorage.setItem(STORAGE_KEY,JSON.stringify(arr));

function openSaveModal()  { document.getElementById('saveModal').classList.add('open'); }
function closeSaveModal() { document.getElementById('saveModal').classList.remove('open'); }
function openLoadModal()  { renderSaveList(); document.getElementById('loadModal').classList.add('open'); }
function closeLoadModal() { document.getElementById('loadModal').classList.remove('open'); }

function doSave() {
  const title=document.getElementById('noteTitle').value||'Catatan Tanpa Judul';
  const saves=getAllSaves();
  saves.unshift({id:'save_'+Date.now(), title, text:document.getElementById('noteText').value,
    drawImg:dc.toDataURL('image/png'), hlImg:hc.toDataURL('image/png'),
    date:new Date().toLocaleDateString('id-ID',{weekday:'long',year:'numeric',month:'long',day:'numeric'}), ts:Date.now()});
  if (saves.length>20) saves.pop();
  putAllSaves(saves); closeSaveModal();
  const btn=document.querySelector('.btn-save'); const orig=btn.textContent;
  btn.textContent='✅ Tersimpan!'; setTimeout(()=>btn.textContent=orig,1800);
}

function renderSaveList() {
  const list=document.getElementById('saveList'), saves=getAllSaves();
  list.innerHTML='';
  if (!saves.length) { list.innerHTML='<div class="save-empty">Belum ada catatan tersimpan 🌙<br>Simpan catatan terlebih dahulu!</div>'; return; }
  saves.forEach(s=>{
    const item=document.createElement('div'); item.className='save-item';
    item.innerHTML=`<div class="save-item-icon">🌙</div>
      <div class="save-item-info"><div class="save-item-title">${s.title}</div><div class="save-item-date">${s.date}</div></div>
      <div class="save-item-del" title="Hapus" onclick="deleteSave('${s.id}',event)">×</div>`;
    item.addEventListener('click',()=>loadSave(s));
    list.appendChild(item);
  });
}

function loadSave(s) {
  if (!confirm('Muat "'+s.title+'"? Catatan saat ini akan diganti.')) return;
  document.getElementById('noteTitle').value=s.title;
  document.getElementById('noteText').value=s.text;
  document.getElementById('noteDate').textContent=s.date;
  const i1=new Image(); i1.onload=()=>{ctx.clearRect(0,0,dc.width,dc.height); ctx.drawImage(i1,0,0);}; i1.src=s.drawImg;
  const i2=new Image(); i2.onload=()=>{hctx.clearRect(0,0,hc.width,hc.height); hctx.drawImage(i2,0,0);}; i2.src=s.hlImg;
  document.getElementById('interactLayer').innerHTML='';
  closeLoadModal();
}

function deleteSave(id,ev) {
  ev.stopPropagation();
  if (!confirm('Hapus catatan ini?')) return;
  putAllSaves(getAllSaves().filter(s=>s.id!==id));
  renderSaveList();
}

document.getElementById('saveModal').addEventListener('click',function(e){if(e.target===this)closeSaveModal();});
document.getElementById('loadModal').addEventListener('click',function(e){if(e.target===this)closeLoadModal();});

// ── EXPORT PNG ────────────────────────────────────────────────
async function exportToPNG() {
  const card=document.getElementById('noteCard'), btn=document.querySelector('.btn-export');
  btn.textContent='⏳ Menyiapkan...';
  try {
    const canvas=await html2canvas(card,{scale:2,useCORS:true,backgroundColor:'#16213e',logging:false,allowTaint:true});
    const link=document.createElement('a'); link.download='moonbieve-'+Date.now()+'.png'; link.href=canvas.toDataURL('image/png'); link.click();
    btn.textContent='✅ Tersimpan!'; setTimeout(()=>btn.textContent='⬇ Export PNG',2000);
  } catch(err) { btn.textContent='⬇ Export PNG'; alert('Export gagal: '+err.message); }
}
