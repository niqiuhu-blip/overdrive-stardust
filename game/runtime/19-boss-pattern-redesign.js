'use strict';

/* ---------------- Boss pattern redesign ----------------
   Design rule: boss danger should be learnable after observing one or two cycles.
   Core = rotating rings with a stable gap rhythm.
   Twin = telegraphed A/B alternating volleys.
   Pulsar = no fodder; enter through the visible accretion-ring gate and Dash
   through the core. Successful passes refund one Dash charge.
*/

function bossAngleDelta(a,b){
  return Math.abs(((a-b+Math.PI*3)%TAU)-Math.PI);
}
function bossFireRingGap(x,y,count,speed,base,gapAngle,gapHalf){
  for(let i=0;i<count;i++){
    const a=base+i/count*TAU;
    if(bossAngleDelta(a,gapAngle)<gapHalf) continue;
    spawnBullet(x+Math.cos(a)*42,y+Math.sin(a)*42,Math.cos(a)*speed,Math.sin(a)*speed,7);
  }
  audio.sfx('warn');
}
function bossFireFan(x,y,aim,count,spread,speed){
  const mid=(count-1)/2;
  for(let i=0;i<count;i++){
    const a=aim+(i-mid)*spread;
    spawnBullet(x+Math.cos(a)*34,y+Math.sin(a)*34,Math.cos(a)*speed,Math.sin(a)*speed,6);
  }
  audio.sfx('shoot');
}

const _resetGameBossPatterns=resetGame;
resetGame=function(){
  _resetGameBossPatterns();
  game.twinPatternTimer=0.9;
  game.twinVolleyPending=false;
  game.twinVolleyWarn=0;
  game.twinVolleySide='A';
  game.twinVolleyAim=0;
  game.pulsarGateAngle=0;
  game.pulsarGateIndex=0;
  game.pulsarPatternTimer=1.25;
  game.pulsarPatternWave=0;
  game.pulsarRingR=148;
  game.pulsarGateHalf=0.46;
};

/* ---------- Level 3 flow used by the redesigned Pulsar ---------- */
const _flowVectorAtBossPatterns=flowVectorAt;
flowVectorAt=function(x,y){
  const p=enemies.find(e=>e.active&&e.kind==='pulsar'&&e.state!=='spawn');
  if(game.level===3&&game.bossSpawned&&p){
    if(game.flowFreeze>0) return {x:0,y:0};
    const dx=WORLD_W/2-x,dy=WORLD_H/2-y,d=Math.hypot(dx,dy)||1;
    const rx=dx/d,ry=dy/d;
    if(p.hp>4){
      // ACCRETION: readable radial inward flow.
      return {x:rx*102,y:ry*102};
    }
    // ROTATION: same inward language plus a coherent clockwise tangential flow.
    const tx=-ry,ty=rx;
    return {x:rx*42+tx*106,y:ry*42+ty*106};
  }
  return _flowVectorAtBossPatterns(x,y);
};

/* ---------- Pulsar: gate-through-core fight ---------- */
spawnPulsarBoss=function(){
  for(const e of enemies) if(e.active) e.active=false;
  for(const b of bullets) b.active=false;
  for(const n of nodes) n.active=false;
  const p=spawnEnemy('pulsar');
  p.hp=8; p.maxHp=8; p.r=42; p.spawnT=1.05; p.state='spawn'; p.harmless=true;
  p.rot=0; p.bpPhase=1;
  game.bossSpawned=true;
  game.pulsarGateAngle=0;
  game.pulsarGateIndex=0;
  game.pulsarPatternTimer=1.35;
  game.pulsarPatternWave=0;
  game.pulsarRingR=148;
  game.pulsarGateHalf=0.46;
  game.pulsarMode='accretion';
  player.charges=player.maxCharges;
  player.energy=0;
  player.iFrames=Math.max(player.iFrames,1.5);
  announce('PULSAR // 找到入口，贯穿核心',COL.cyan,3.4);
  spawnText(WORLD_W/2,WORLD_H/2-106,'ENTRY → CORE → BREAK',COL.yellow,16,2.4);
  audio.sfx('milestone');
  return p;
};

const _startDashBossPatterns=startDash;
startDash=function(){
  player.pulsarDashStartX=player.x;
  player.pulsarDashStartY=player.y;
  _startDashBossPatterns();
};

function pulsarGateQualified(){
  const sx=player.pulsarDashStartX===undefined?player.x:player.pulsarDashStartX;
  const sy=player.pulsarDashStartY===undefined?player.y:player.pulsarDashStartY;
  const dx=sx-WORLD_W/2,dy=sy-WORLD_H/2,r=Math.hypot(dx,dy);
  if(r<game.pulsarRingR-8) return false;
  const entryAngle=Math.atan2(dy,dx);
  if(bossAngleDelta(entryAngle,game.pulsarGateAngle)>game.pulsarGateHalf) return false;
  const inwardX=-dx/(r||1),inwardY=-dy/(r||1);
  const towardCore=inwardX*player.dashDirX+inwardY*player.dashDirY;
  return towardCore>0.78;
}

const _damageEnemyBossPatterns=damageEnemy;
damageEnemy=function(e,dmg,cause){
  if(!e||e.kind!=='pulsar'){
    _damageEnemyBossPatterns(e,dmg,cause);
    return;
  }
  if(cause==='nova') return;
  if(cause!=='dash'||!pulsarGateQualified()){
    spawnText(e.x,e.y-56,'CORE SEALED',COL.magenta,14,0.55);
    burst(e.x,e.y,COL.magenta,5,100,0.22,2.5,0);
    game.hitstop=Math.max(game.hitstop,0.012);
    return;
  }

  e.hp-=1;
  addScore(520,e.x,e.y-54,'THROUGH');
  burst(e.x,e.y,COL.cyan,22,320,0.48,5.5,0);
  game.hitstop=Math.max(game.hitstop,0.07);
  game.shake=Math.max(game.shake,14);
  grantDashEnergy(100,e.x,e.y-82);
  // Carry the successful Dash out through the far side of the ring.
  if(player.dashActive) player.dashTime=Math.max(player.dashTime,0.14);

  if(e.hp<=0){ killPulsar(e,cause); return; }

  const hits=8-e.hp;
  if(e.hp>4){
    // Deterministic gate jumps: no random target selection.
    const seq=[0,2.35,-1.55,3.02,0.82,-2.36,1.62,-0.72];
    game.pulsarGateIndex=Math.min(seq.length-1,hits);
    game.pulsarGateAngle=seq[game.pulsarGateIndex];
    spawnText(WORLD_W/2,WORLD_H/2-112,'ENTRY SHIFT',COL.cyan,14,0.9);
  }else if(e.hp===4){
    game.pulsarMode='rotation';
    game.pulsarPatternTimer=0.95;
    announce('ROTATION // 入口开始旋转',COL.yellow,2.4);
    audio.sfx('milestone');
    if(typeof offerBossRepair==='function') offerBossRepair(3);
  }
};

/* ---------- Suppress old boss bullet timers, then run structured patterns ---------- */
const _updateEnemiesBossPatterns=updateEnemies;
updateEnemies=function(dt){
  const hiddenPulsars=[];
  for(const e of enemies){
    if(!e.active) continue;
    if(e.kind==='core'||e.kind==='twinA'||e.kind==='twinB'){
      // Old implementation has independent shot/wave timers. Disable both;
      // movement, shield logic and target logic still run normally.
      e.shotT=999;
      e.waveT=999;
    }else if(e.kind==='pulsar'){
      hiddenPulsars.push(e);
      e.active=false;
    }
  }

  _updateEnemiesBossPatterns(dt);
  for(const p of hiddenPulsars) p.active=true;

  updateCorePattern(dt);
  updateTwinPattern(dt);
  for(const p of hiddenPulsars) updatePulsarPattern(p,dt);
};

function updateCorePattern(dt){
  const core=findCore();
  if(!core||core.state==='spawn') return;
  if(core.bpPatternT===undefined){ core.bpPatternT=1.0; core.bpWave=0; core.bpGapAngle=-0.65; }
  core.bpPatternT-=dt;
  if(core.bpPatternT>0) return;

  core.bpWave++;
  // Same rotation direction every wave. Vulnerable phase is slightly calmer so
  // the player can actually use the damage window.
  core.bpGapAngle+=core.shielded?0.42:0.30;
  const count=core.shielded?14:11;
  const speed=core.shielded?158:142;
  const gapHalf=core.shielded?0.43:0.58;
  bossFireRingGap(core.x,core.y,count,speed,core.bpWave*0.17,core.bpGapAngle,gapHalf);
  core.bpPatternT=core.shielded?1.85:1.38;
}

function updateTwinPattern(dt){
  if(!game.bossSpawned||game.level!==2||game.twinHp<=0) return;
  if(game.twinStun>0) return;

  if(game.twinVolleyPending){
    game.twinVolleyWarn-=dt;
    if(game.twinVolleyWarn>0) return;
    const src=findTwin(game.twinVolleySide);
    if(src){
      const hard=game.twinHp<=4;
      bossFireFan(src.x,src.y,game.twinVolleyAim,hard?5:4,hard?0.145:0.16,hard?236:216);
    }
    game.twinVolleyPending=false;
    game.twinVolleySide=game.twinVolleySide==='A'?'B':'A';
    game.twinPatternTimer=game.twinHp<=4?1.05:1.32;
    return;
  }

  game.twinPatternTimer-=dt;
  if(game.twinPatternTimer>0) return;
  const src=findTwin(game.twinVolleySide);
  if(!src){ game.twinVolleySide=game.twinVolleySide==='A'?'B':'A'; game.twinPatternTimer=0.25; return; }
  game.twinVolleyAim=Math.atan2(player.y-src.y,player.x-src.x); // locks now; does not track during warning.
  game.twinVolleyWarn=0.48;
  game.twinVolleyPending=true;
  spawnText(src.x,src.y-62,`${game.twinVolleySide} // VOLLEY`,src.color,13,0.55);
  audio.sfx('warn');
}

function updatePulsarPattern(p,dt){
  if(!p.active) return;
  if(p.state==='spawn'){
    p.spawnT-=dt;
    p.rot+=dt*0.5;
    if(p.spawnT<=0){ p.state='active'; p.harmless=false; }
    return;
  }

  p.x=WORLD_W/2; p.y=WORLD_H/2;
  const phase2=p.hp<=4;
  p.bpPhase=phase2?2:1;
  p.rot+=dt*(phase2?0.90:0.52);
  game.pulsarMode=phase2?'rotation':'accretion';

  if(game.flowFreeze>0) return;
  if(phase2) game.pulsarGateAngle+=dt*0.34;

  game.pulsarPatternTimer-=dt;
  if(game.pulsarPatternTimer>0) return;
  game.pulsarPatternWave++;

  // Every wave obeys the same rule: bullets form a ring, and the visible ENTRY
  // sector is also the safe lane through that ring.
  const count=phase2?18:15;
  const speed=phase2?188:162;
  const gap=phase2?0.50:0.56;
  const offset=game.pulsarPatternWave*(phase2?0.19:0.13);
  bossFireRingGap(p.x,p.y,count,speed,offset,game.pulsarGateAngle,gap);
  game.pulsarPatternTimer=phase2?1.18:1.58;
};

/* ---------- Visual language ---------- */
const _drawEnemyBossPatterns=drawEnemy;
drawEnemy=function(e){
  if(!e||e.kind!=='pulsar'){
    _drawEnemyBossPatterns(e);
    // Twin volley telegraph: locked firing line, so it can be dodged deliberately.
    if(e&&e.active&&(e.kind==='twinA'||e.kind==='twinB')&&game.twinVolleyPending&&e.twinId===game.twinVolleySide){
      ctx.save();
      ctx.globalAlpha=0.35+0.45*clamp(1-game.twinVolleyWarn/0.48,0,1);
      ctx.strokeStyle=e.color; ctx.lineWidth=2; ctx.setLineDash([5,8]);
      ctx.beginPath(); ctx.moveTo(e.x,e.y); ctx.lineTo(e.x+Math.cos(game.twinVolleyAim)*520,e.y+Math.sin(game.twinVolleyAim)*520); ctx.stroke();
      ctx.setLineDash([]); ctx.restore();
    }
    return;
  }

  if(e.state==='spawn'){
    ctx.save(); ctx.globalAlpha=0.7; ctx.strokeStyle=COL.cyan; ctx.lineWidth=2; ctx.setLineDash([7,9]);
    ctx.beginPath(); ctx.arc(e.x,e.y,game.pulsarRingR,0,TAU); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    drawGlow(e.x,e.y,e.r*4,COL.cyan,0.5);
    return;
  }

  const phase2=e.hp<=4,frac=clamp(e.hp/e.maxHp,0,1),r=game.pulsarRingR;
  drawGlow(e.x,e.y,e.r*4.5,COL.cyan,0.78);
  ctx.save();
  ctx.translate(e.x,e.y);
  ctx.rotate(e.rot);
  ctx.strokeStyle=phase2?COL.yellow:COL.cyan; ctx.lineWidth=3;
  ctx.beginPath(); ctx.arc(0,0,e.r+13,0,TAU); ctx.stroke();
  ctx.restore();
  fillShape([e.x,e.y-e.r,e.x+e.r*0.88,e.y+e.r*0.45,e.x,e.y+e.r,e.x-e.r*0.88,e.y+e.r*0.45],COL.white);

  // Dim full accretion ring.
  ctx.save();
  ctx.globalAlpha=0.28; ctx.strokeStyle=phase2?COL.yellow:COL.cyan; ctx.lineWidth=3;
  ctx.setLineDash([7,10]); ctx.beginPath(); ctx.arc(e.x,e.y,r,0,TAU); ctx.stroke(); ctx.setLineDash([]);
  // Bright ENTRY arc.
  ctx.globalAlpha=0.95; ctx.strokeStyle=COL.cyan; ctx.lineWidth=10;
  ctx.beginPath(); ctx.arc(e.x,e.y,r,game.pulsarGateAngle-game.pulsarGateHalf,game.pulsarGateAngle+game.pulsarGateHalf); ctx.stroke();
  const gx=e.x+Math.cos(game.pulsarGateAngle)*r,gy=e.y+Math.sin(game.pulsarGateAngle)*r;
  drawGlow(gx,gy,22,COL.cyan,0.85);
  ctx.restore();
  drawPanelText('ENTRY',e.x+Math.cos(game.pulsarGateAngle)*(r+24),e.y+Math.sin(game.pulsarGateAngle)*(r+24),11,COL.yellow,'center');

  ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.fillRect(e.x-54,e.y-68,108,6);
  ctx.fillStyle=phase2?COL.yellow:COL.cyan; ctx.fillRect(e.x-54,e.y-68,108*frac,6);
  drawPanelText(phase2?'ROTATION':'ACCRETION',e.x,e.y-84,11,phase2?COL.yellow:COL.cyan,'center');
};

const _drawHUDBossPatterns=drawHUD;
drawHUD=function(){
  const p=enemies.find(e=>e.active&&e.kind==='pulsar');
  if(p) p.active=false; // suppress obsolete INHALE/EXHALE overlay from v0.7h
  _drawHUDBossPatterns();
  if(p) p.active=true;
  if(p&&p.state!=='spawn'){
    drawPanelText(`PULSAR // HP ${p.hp}/8 // ${p.hp>4?'ACCRETION':'ROTATION'}`,WORLD_W/2,36,12,p.hp>4?COL.cyan:COL.yellow,'center');
    drawPanelText('从高亮 ENTRY 方向冲入并贯穿核心 · 成功回 1 DASH',WORLD_W/2,54,10,COL.white,'center');
    if(game.flowFreeze>0) drawPanelText(`NOVA FREEZE ${game.flowFreeze.toFixed(1)}s`,WORLD_W/2,70,10,COL.purple,'center');
  }
};
