'use strict';

/* ---------------- BOSS PRACTICE / selectable boss entry ---------------- */
game.bossSelect=false;
game.bossPractice=false;
game.bossPracticeLevel=1;

MENU.bossEntry={x:20,y:535,w:190,h:42};
MENU.boss1={x:65,y:300,w:250,h:132};
MENU.boss2={x:355,y:300,w:250,h:132};
MENU.boss3={x:645,y:300,w:250,h:132};
MENU.bossBack={x:350,y:470,w:260,h:52};

function startBossPractice(level){
  audio.init(); audio.resume(); if(audio.muted) audio.setMuted(true);
  const n=clamp(level|0,1,3);
  game.bossSelect=false;
  game.bossPractice=true;
  game.bossPracticeLevel=n;
  game.level=n; game.selectedLevel=n;
  resetGame();
  game.bossPractice=true;
  game.bossPracticeLevel=n;
  game.time=220; // same nominal boss window as a normal stage
  game.difficulty=1;
  game.combo=0; game.comboTimer=0;
  if(game.momentum!==undefined){ game.momentum=0; game.overdriveLevel=0; }
  player.charges=player.maxCharges; player.energy=0; player.iFrames=Math.max(player.iFrames,1.8);
  if(n===1) spawnCore();
  else if(n===2) spawnTwinBoss();
  else spawnPulsarBoss();
  spawnText(WORLD_W/2,WORLD_H/2-115,`BOSS PRACTICE // ${n}`,COL.white,19,1.1);
}

function openBossSelect(){
  game.bossPractice=false;
  game.bossSelect=true;
  game.state='title';
  game.elapsed=0;
  keys.clear();
  audio.sfx('ui');
}
function closeBossSelect(){
  game.bossSelect=false;
  game.bossPractice=false;
  game.state='title';
  game.elapsed=0;
  keys.clear();
  audio.sfx('ui');
}

const _startGameBossPractice=startGame;
startGame=function(level){
  game.bossSelect=false; game.bossPractice=false;
  _startGameBossPractice(level);
};

const _restartGameBossPractice=restartGame;
restartGame=function(){
  if(game.bossPractice){ startBossPractice(game.bossPracticeLevel); return; }
  _restartGameBossPractice();
};

const _returnToStageSelectBossPractice=returnToStageSelect;
returnToStageSelect=function(level){
  if(game.bossPractice){ openBossSelect(); return; }
  _returnToStageSelectBossPractice(level);
};

function renderBossSelect(){
  const t=game.elapsed;
  drawGlow(WORLD_W/2,122,105,COL.yellow,0.20+0.05*Math.sin(t*2));
  drawText('BOSS PRACTICE',WORLD_W/2,105,42,COL.white,'center');
  drawPanelText('选择一个 Boss，直接进入标准 Boss 战窗口',WORLD_W/2,148,14,COL.yellow,'center');
  drawPanelText('1 / 2 / 3 或点击卡片 · ESC 返回',WORLD_W/2,184,12,COL.dim,'center');
  drawMenuCard(MENU.boss1,'BOSS 1 · 星尘核心','拆盾 → 窗口 → 冲刺输出',false,COL.purple);
  drawMenuCard(MENU.boss2,'BOSS 2 · 双星追猎','TARGET SHIFT → 接力追击',false,COL.magenta);
  drawMenuCard(MENU.boss3,'BOSS 3 · 脉冲星','流场 → 吸积 / 爆发 → 极性',false,COL.cyan);
  const r=MENU.bossBack;
  ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.fillRect(r.x,r.y,r.w,r.h);
  ctx.strokeStyle=COL.dim; ctx.lineWidth=1.5; ctx.strokeRect(r.x+0.5,r.y+0.5,r.w-1,r.h-1);
  drawText('[ 返回普通关卡 ]',r.x+r.w/2,r.y+r.h/2,17,COL.white,'center');
}

const _renderTitleBossPractice=renderTitle;
renderTitle=function(){
  if(game.bossSelect){ renderBossSelect(); return; }
  _renderTitleBossPractice();
  const r=MENU.bossEntry,pulse=0.7+0.3*Math.sin(game.elapsed*4.1);
  ctx.fillStyle='rgba(3,5,10,0.92)'; ctx.fillRect(r.x-3,r.y-4,r.w+6,r.h+8);
  ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(r.x,r.y,r.w,r.h);
  ctx.strokeStyle=COL.yellow; ctx.lineWidth=1.5; ctx.strokeRect(r.x+0.5,r.y+0.5,r.w-1,r.h-1);
  drawText('BOSS PRACTICE [B]',r.x+r.w/2,r.y+r.h/2,14,COL.yellow,'center',pulse);
};

const _drawHUDBossPractice=drawHUD;
drawHUD=function(){
  _drawHUDBossPractice();
  if(game.bossPractice) drawPanelText(`BOSS PRACTICE // ${game.bossPracticeLevel}`,18,136,11,COL.yellow);
};

function bossSelectPoint(cx,cy){
  const w=screenToWorld(cx,cy);
  if(pointInRect(w.x,w.y,MENU.boss1)){ startBossPractice(1); return true; }
  if(pointInRect(w.x,w.y,MENU.boss2)){ startBossPractice(2); return true; }
  if(pointInRect(w.x,w.y,MENU.boss3)){ startBossPractice(3); return true; }
  if(pointInRect(w.x,w.y,MENU.bossBack)){ closeBossSelect(); return true; }
  return false;
}

// Capture-phase handlers run before the original title handlers, so boss-select
// input cannot accidentally start a normal stage.
window.addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();
  if(game.state==='title' && game.bossSelect){
    if(k==='1'||k==='2'||k==='3'){ e.preventDefault(); e.stopImmediatePropagation(); startBossPractice(Number(k)); return; }
    if(k==='escape'||k==='b'){ e.preventDefault(); e.stopImmediatePropagation(); closeBossSelect(); return; }
    if([' ','enter','arrowleft','arrowright','a','d'].includes(k)){ e.preventDefault(); e.stopImmediatePropagation(); return; }
  }
  if(game.state==='title' && !game.bossSelect && k==='b'){
    e.preventDefault(); e.stopImmediatePropagation(); openBossSelect();
  }
},true);

canvas.addEventListener('mousedown',e=>{
  if(game.state!=='title') return;
  if(game.bossSelect){ e.preventDefault(); e.stopImmediatePropagation(); bossSelectPoint(e.clientX,e.clientY); return; }
  const w=screenToWorld(e.clientX,e.clientY);
  if(pointInRect(w.x,w.y,MENU.bossEntry)){ e.preventDefault(); e.stopImmediatePropagation(); openBossSelect(); }
},true);
