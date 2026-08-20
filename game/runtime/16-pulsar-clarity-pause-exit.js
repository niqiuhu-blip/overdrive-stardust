'use strict';

/* ---------------- Pulsar clarity + pause exit ---------------- */
game.pulsarReadTimer=0;
game.pulsarReadPhase='inhale';
MENU.pauseMenu={x:350,y:390,w:260,h:52};

function pulsarIsAttackWindow(){
  return game.pulsarMode==='inhale' || game.flowFreeze>0;
}

const _damageEnemyPulsarClarity=damageEnemy;
damageEnemy=function(e,dmg,cause){
  if(e && e.kind==='pulsar' && cause!=='nova' && !pulsarIsAttackWindow()){
    spawnText(e.x,e.y-54,'CORE LOCKED',COL.magenta,14,0.55);
    burst(e.x,e.y,COL.magenta,5,100,0.22,2.5,0);
    game.hitstop=Math.max(game.hitstop,0.012);
    return;
  }
  _damageEnemyPulsarClarity(e,dmg,cause);
};

const _spawnPulsarBossClarity=spawnPulsarBoss;
spawnPulsarBoss=function(){
  const p=_spawnPulsarBossClarity();
  game.pulsarReadTimer=4.6;
  game.pulsarReadPhase='inhale';
  announce('INHALE // ATTACK WINDOW // 冲击核心',COL.cyan,2.8);
  return p;
};

const _updateEnemiesPulsarClarity=updateEnemies;
updateEnemies=function(dt){
  _updateEnemiesPulsarClarity(dt);
  const p=enemies.find(e=>e.active&&e.kind==='pulsar');
  if(!p) return;

  // First half uses the existing inhale/exhale cycle. Second half keeps the same
  // readable grammar, only faster, instead of switching to an opaque polarity rule.
  if(p.hp<=5 && game.flowFreeze<=0){
    game.pulsarReadTimer-=dt;
    if(game.pulsarReadTimer<=0){
      game.pulsarReadPhase=game.pulsarReadPhase==='inhale'?'exhale':'inhale';
      game.pulsarReadTimer=3.25;
      announce(game.pulsarReadPhase==='inhale'?'INHALE // ATTACK WINDOW':'EXHALE // EVADE',game.pulsarReadPhase==='inhale'?COL.cyan:COL.magenta,1.5);
    }
    game.pulsarMode=game.pulsarReadPhase;
    setFlow(game.pulsarMode,game.pulsarMode==='inhale'?156:174,0);
  }
};

const _drawHUDPulsarClarity=drawHUD;
drawHUD=function(){
  _drawHUDPulsarClarity();
  const p=enemies.find(e=>e.active&&e.kind==='pulsar');
  if(p){
    const attack=pulsarIsAttackWindow();
    drawPanelText(attack?'PULSAR // ATTACK WINDOW':'PULSAR // CORE LOCKED · EVADE',WORLD_W/2,40,12,attack?COL.cyan:COL.magenta,'center');
    drawPanelText(attack?'冲刺核心造成伤害':'等待下一次 INHALE',WORLD_W/2,57,10,attack?COL.white:COL.dim,'center');
  }
};

const _renderPauseExit=renderPause;
renderPause=function(){
  _renderPauseExit();
  const r=MENU.pauseMenu;
  ctx.fillStyle='rgba(255,255,255,0.07)'; ctx.fillRect(r.x,r.y,r.w,r.h);
  ctx.strokeStyle=COL.yellow; ctx.lineWidth=1.6; ctx.strokeRect(r.x+0.5,r.y+0.5,r.w-1,r.h-1);
  drawText(game.bossPractice?'[ 返回 BOSS 选择 ]':'[ 返回主菜单 ]',r.x+r.w/2,r.y+r.h/2,18,COL.white,'center');
  drawPanelText('TAB / 点击返回',WORLD_W/2,r.y+r.h+22,11,COL.yellow,'center');
};

function exitPausedToMenu(){
  if(game.bossPractice) openBossSelect();
  else returnToStageSelect();
}

window.addEventListener('keydown',e=>{
  if(game.state==='paused' && e.key.toLowerCase()==='tab'){
    e.preventDefault(); e.stopImmediatePropagation(); exitPausedToMenu();
  }
},true);

canvas.addEventListener('mousedown',e=>{
  if(game.state!=='paused') return;
  const w=screenToWorld(e.clientX,e.clientY);
  if(pointInRect(w.x,w.y,MENU.pauseMenu)){
    e.preventDefault(); e.stopImmediatePropagation(); exitPausedToMenu();
  }
},true);
