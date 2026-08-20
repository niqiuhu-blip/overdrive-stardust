/* ---------------- 对象池 ---------------- */
const MAX_PARTICLES = 850, MAX_TEXTS = 48, MAX_BULLETS = 140, MAX_MOTES = 200, MAX_ENEMIES = 46, MAX_NODES = 700;
const particles = Array.from({length:MAX_PARTICLES}, () => ({active:false}));
const texts = Array.from({length:MAX_TEXTS}, () => ({active:false}));
const bullets = Array.from({length:MAX_BULLETS}, () => ({active:false}));
const motes = Array.from({length:MAX_MOTES}, () => ({active:false}));
const enemies = Array.from({length:MAX_ENEMIES}, () => ({active:false}));
const nodes = Array.from({length:MAX_NODES}, () => ({active:false}));
let pCursor = 0, tCursor = 0, bCursor = 0, mCursor = 0, eCursor = 0, nCursor = 0;

function spawnParticle(x,y,vx,vy,life,size,color,drag,kind){
  const p = particles[pCursor]; pCursor = (pCursor+1)%MAX_PARTICLES;
  p.active = true; p.kind = kind||0; p.x=x; p.y=y; p.vx=vx; p.vy=vy;
  p.life = life; p.maxLife = life; p.size = size; p.color = color;
  p.drag = drag === undefined ? 3 : drag; p.grav = 0;
  return p;
}
function burst(x,y,color,n,spd,life,size,kind){
  for(let i=0;i<n;i++){
    const a = rand(TAU), v = rand(spd*0.3,spd);
    spawnParticle(x,y,Math.cos(a)*v,Math.sin(a)*v,rand(life*0.6,life),rand(size*0.6,size*1.4),color,3,kind||0);
  }
}
function spawnText(x,y,str,color,size,life){
  const t = texts[tCursor]; tCursor = (tCursor+1)%MAX_TEXTS;
  t.active=true; t.x=x; t.y=y; t.str=str; t.color=color; t.size=size||17; t.life=life||0.9; t.maxLife=t.life; t.vy=-46;
  return t;
}
function getInactive(arr,cursorObj,key){
  for(let i=0;i<arr.length;i++){
    const idx = (cursorObj.i + i) % arr.length;
    if(!arr[idx].active){ cursorObj.i = (idx+1)%arr.length; return arr[idx]; }
  }
  const o = arr[0]; return o;
}
function spawnBullet(x,y,vx,vy,life){
  const b = getInactive(bullets,{i:bCursor},'x'); bCursor = (bCursor+1)%MAX_BULLETS;
  b.active=true; b.x=x; b.y=y; b.vx=vx; b.vy=vy; b.life=life||7; b.maxLife=b.life; b.radius=4.6; b.hitByNova=false; b.lastGraze=-9;
  return b;
}
function spawnMote(x,y,value,kind,biasTowardPlayer){
  const m = getInactive(motes,{i:mCursor},'x'); mCursor = (mCursor+1)%MAX_MOTES;
  const base = biasTowardPlayer ? Math.atan2(player.y-y, player.x-x) : rand(TAU);
  const a = base + rand(-0.5,0.5), sp = rand(45,130);
  m.active=true; m.x=x; m.y=y; m.vx=Math.cos(a)*sp; m.vy=Math.sin(a)*sp;
  m.value = value || 25; m.kind = kind || 'energy'; m.life = 8; m.maxLife = 8; m.r = m.kind==='heal' ? 7 : 5;
  return m;
}
function spawnNode(x,y,px,py,life){
  const n = getInactive(nodes,{i:nCursor},'x'); nCursor = (nCursor+1)%MAX_NODES;
  n.active=true; n.x=x; n.y=y; n.px=px; n.py=py; n.life=life||4; n.maxLife=n.life; n.hitByNova=false;
  return n;
}

/* ---------------- 玩家 ---------------- */
const player = {
  x:WORLD_W/2, y:WORLD_H/2, r:12, vx:0, vy:0,
  facing:0, inputX:0, inputY:0, moveActive:false,
  lives:3, energy:0, charges:2, maxCharges:3,
  dashActive:false, dashTime:0, dashDur:0.17, dashSpeed:980, dashDirX:1, dashDirY:0,
  dashCooldown:0, dashBuffer:0, dashId:0, dashKillCount:0, dashFlowMult:1,
  iFrames:2.2, invulnSpawn:true, flux:0, grazeCooldown:0,
  hurtFlash:0, trailT:0, trailPos:[], pointerDashX:0, pointerDashY:0, pointerDashT:0
};
function resetPlayer(){
  player.x=WORLD_W/2; player.y=WORLD_H/2; player.vx=0; player.vy=0;
  player.facing=0; player.lives=3; player.energy=0; player.charges=2;
  player.dashActive=false; player.dashTime=0; player.dashCooldown=0; player.dashBuffer=0;
  player.dashId=0; player.dashKillCount=0; player.dashFlowMult=1; player.iFrames=2.0; player.flux=0;
  player.hurtFlash=0; player.trailPos.length=0; player.pointerDashT=0;
}

/* ---------------- 全局游戏状态 ---------------- */
const game = {
  state:'title', time:0, score:0, best:loadSave().best, bestCombo:loadSave().bestCombo, bestTime:loadSave().bestTime,
  combo:0, comboTimer:0, kills:0, grazes:0, maxCombo:0, timeSurvived:0, deathCause:null,
  shake:0, hitstop:0, flashWhite:0, flashRed:0, announceT:0, announceStr:'', announceColor:COL.cyan,
  elapsed:0, difficulty:0, nova:null, deathTimer:0, deaths:0, runId:0,
  wispTimer:0.8, spikerTimer:999, weaverTimer:999, breakerTimer:999,
  firstSpiker:true, firstWeaver:true, firstBreaker:true, firstNova:true,
  spikerNext:2, weaverNext:2, breakerNext:2, surgeTimer:45, surgeInterval:42, overloadAnnounced:false,
  bossSpawned:false, completed:false, endReason:null, finalApproach:false,
  level:1, selectedLevel:1, levelPhase:0, twinTarget:'A', twinHp:8, twinStun:0, relayTimer:0,
  pulse:null, firstPulse:true,
  formationTimer:3.0, formationIndex:0,
  flowMode:'none', flowAngle:0, flowStrength:0, flowFreeze:0, flowShiftTimer:0,
  pulsarMode:'inhale', pulsarModeTimer:4.5, pulsarStun:0, pulsarFuelTimer:1.5
};
function resetGame(){
  resetPlayer();
  for(const e of enemies){ e.active=false; e.state='dead'; }
  for(const b of bullets) b.active=false;
  for(const m of motes) m.active=false;
  for(const n of nodes) n.active=false;
  for(const p of particles) p.active=false;
  for(const t of texts) t.active=false;
  game.state='playing'; game.time=0; game.score=0; game.combo=0; game.comboTimer=0;
  game.kills=0; game.grazes=0; game.maxCombo=0; game.timeSurvived=0; game.deathCause=null;
  game.shake=0; game.hitstop=0; game.flashWhite=0; game.flashRed=0;
  game.elapsed=0; game.difficulty=0; game.nova=null; game.deathTimer=0; game.deaths=0; game.runId++;
  game.wispTimer=1.1; game.spikerTimer=999; game.weaverTimer=999; game.breakerTimer=999;
  game.firstSpiker=true; game.firstWeaver=true; game.firstBreaker=true; game.firstNova=true; game.newBest=false;
  game.spikerNext=2; game.weaverNext=2; game.breakerNext=2; game.surgeTimer=45; game.surgeInterval=42; game.overloadAnnounced=false;
  game.bossSpawned=false; game.completed=false; game.endReason=null; game.finalApproach=false;
  game.levelPhase=0; game.twinTarget='A'; game.twinHp=8; game.twinStun=0; game.relayTimer=0;
  game.pulse=null; game.firstPulse=true;
  game.formationTimer=2.8; game.formationIndex=0;
  game.flowMode='none'; game.flowAngle=0; game.flowStrength=0; game.flowFreeze=0; game.flowShiftTimer=0;
  game.pulsarMode='inhale'; game.pulsarModeTimer=4.5; game.pulsarStun=0; game.pulsarFuelTimer=1.5;
  const intro = game.level===1?'第一关 // 星尘核心':(game.level===2?'第二关 // 阵列追猎':'第三关 // 星流');
  const introColor = game.level===1?COL.purple:(game.level===2?COL.magenta:COL.cyan);
  announce(intro, introColor, 2.6);
}
function announce(str,color,dur){
  game.announceStr = str; game.announceColor = color || COL.cyan; game.announceT = dur || 2.6;
}
function startGame(level){
  audio.init(); audio.resume();
  if(audio.muted) audio.setMuted(true);
  game.level = level || game.selectedLevel || game.level || 1;
  game.selectedLevel = game.level;
  resetGame();
  audio.sfx('ui');
  spawnText(player.x,player.y-40,'GO!',COL.cyan,26,1);
}
function pauseGame(){
  if(game.state==='playing'){ game.state='paused'; audio.sfx('ui'); }
}
function resumeGame(){
  if(game.state==='paused'){ game.state='playing'; lastTime = performance.now(); audio.sfx('ui'); }
}
function restartGame(){ startGame(game.level || game.selectedLevel || 1); }

/* ---------------- 选关 / 菜单 ---------------- */
const MENU = {
  level1:{x:65,y:330,w:250,h:112},
  level2:{x:355,y:330,w:250,h:112},
  level3:{x:645,y:330,w:250,h:112},
  start:{x:350,y:475,w:260,h:58},
  retry:{x:255,y:470,w:210,h:56},
  select:{x:495,y:470,w:210,h:56}
};
function pointInRect(x,y,r){ return x>=r.x && x<=r.x+r.w && y>=r.y && y<=r.y+r.h; }
function returnToStageSelect(level){
  game.state='title';
  if(level>=1 && level<=3) game.selectedLevel=level;
  else if(game.selectedLevel<1 || game.selectedLevel>3) game.selectedLevel=game.level||1;
  game.elapsed = 0;
  keys.clear();
  audio.sfx('ui');
}
function handleTitlePointer(cx,cy){
  const w=screenToWorld(cx,cy);
  if(pointInRect(w.x,w.y,MENU.level1)){ game.selectedLevel=1; audio.sfx('ui'); return; }
  if(pointInRect(w.x,w.y,MENU.level2)){ game.selectedLevel=2; audio.sfx('ui'); return; }
  if(pointInRect(w.x,w.y,MENU.level3)){ game.selectedLevel=3; audio.sfx('ui'); return; }
  if(pointInRect(w.x,w.y,MENU.start)){ startGame(game.selectedLevel); return; }
}
function handleGameoverPointer(cx,cy){
  const w=screenToWorld(cx,cy);
  if(pointInRect(w.x,w.y,MENU.retry)){ restartGame(); return; }
  if(pointInRect(w.x,w.y,MENU.select)){ returnToStageSelect(); return; }
}

/* ---------------- 输入 ---------------- */
const keys = new Set();
let lastTime = performance.now();
function onKeyDown(e){
  const k = e.key.toLowerCase();
  if([' ','arrowup','arrowdown','arrowleft','arrowright','shift','tab'].includes(k)) e.preventDefault();
  if(e.repeat) return;

  // Title is an explicit selection state: choose first, confirm second.
  if(game.state==='title'){
    if(k==='1' || k==='2' || k==='3'){ game.selectedLevel=Number(k); audio.sfx('ui'); return; }
    if(k==='arrowleft' || k==='a'){ game.selectedLevel=game.selectedLevel<=1?3:game.selectedLevel-1; audio.sfx('ui'); return; }
    if(k==='arrowright' || k==='d'){ game.selectedLevel=game.selectedLevel>=3?1:game.selectedLevel+1; audio.sfx('ui'); return; }
    if(k===' ' || k==='enter'){ startGame(game.selectedLevel); return; }
    if(k==='m'){ audio.toggleMute(); return; }
    return;
  }

  // Game-over has two distinct actions: retry the played stage, or return to stage select.
  if(game.state==='gameover'){
    if(k==='r' || k===' ' || k==='enter'){ restartGame(); return; }
    if(k==='escape' || k==='tab'){ returnToStageSelect(); return; }
    if(k==='1' || k==='2' || k==='3'){ returnToStageSelect(Number(k)); return; }
    if(k==='m'){ audio.toggleMute(); return; }
    return;
  }

  keys.add(k);
  if(k==='m'){ const m = audio.toggleMute(); spawnText(player.x,player.y-30,m?'静音':'声音开启',COL.white,15,0.8); return; }
  if(k==='p' || k==='escape'){
    if(game.state==='playing') pauseGame();
    else if(game.state==='paused') resumeGame();
    return;
  }
  if(k==='r'){ restartGame(); return; }
  if(k===' ' || k==='enter'){
    if(game.state==='paused'){ resumeGame(); return; }
    if(game.state==='playing') player.dashBuffer = 0.18;
    return;
  }
  if(k==='q' && game.state==='playing'){ tryPulse(); return; }
  if((k==='e' || k==='shift') && game.state==='playing') tryNova();
}
function onKeyUp(e){
  keys.delete(e.key.toLowerCase());
}
function dashTowardPoint(cx,cy){
  const w = screenToWorld(cx,cy);
  const dx = w.x - player.x, dy = w.y - player.y;
  const d = Math.hypot(dx,dy) || 1;
  player.facing = Math.atan2(dy,dx);
  player.pointerDashX = dx/d; player.pointerDashY = dy/d; player.pointerDashT = 0.22;
  player.dashBuffer = 0.18;
}
function onMouseDown(e){
  audio.init(); audio.resume();
  if(game.state==='title'){ handleTitlePointer(e.clientX,e.clientY); return; }
  if(game.state==='gameover'){ handleGameoverPointer(e.clientX,e.clientY); return; }
  if(game.state==='paused'){ resumeGame(); return; }
  if(game.state==='playing') dashTowardPoint(e.clientX,e.clientY);
}
function onTouchStart(e){
  e.preventDefault();
  audio.init(); audio.resume();
  const t = e.touches && e.touches[0];
  if(!t) return;
  if(game.state==='title'){ handleTitlePointer(t.clientX,t.clientY); return; }
  if(game.state==='gameover'){ handleGameoverPointer(t.clientX,t.clientY); return; }
  if(game.state==='paused'){ resumeGame(); return; }
  if(game.state==='playing') dashTowardPoint(t.clientX,t.clientY);
}
window.addEventListener('keydown', onKeyDown);
window.addEventListener('keyup', onKeyUp);
canvas.addEventListener('mousedown', onMouseDown);
window.addEventListener('blur', ()=>{ if(game.state==='playing') pauseGame(); });
document.addEventListener('visibilitychange', ()=>{ if(document.hidden && game.state==='playing') pauseGame(); });
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('touchstart', onTouchStart, {passive:false});

function screenToWorld(cx,cy){
  return { x:(cx - viewOx)/viewScale, y:(cy - viewOy)/viewScale };
}
function readMoveInput(){
  let x = 0, y = 0;
  if(keys.has('arrowleft')||keys.has('a')) x--;
  if(keys.has('arrowright')||keys.has('d')) x++;
  if(keys.has('arrowup')||keys.has('w')) y--;
  if(keys.has('arrowdown')||keys.has('s')) y++;
  player.inputX = x; player.inputY = y;
  const len = Math.hypot(x,y);
  player.moveActive = len > 0.01;
  if(player.moveActive){ player.facing = Math.atan2(y,x); }
  return len;
}
