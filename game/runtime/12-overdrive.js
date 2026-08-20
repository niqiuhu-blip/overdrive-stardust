'use strict';

/* ---------------- v0.7: combo -> Overdrive / Formation Break ----------------
   High-skill play raises the game's pace ceiling instead of player power.
   Momentum is not a spendable resource: it is a hidden heat value surfaced only
   as NORMAL / OVERDRIVE I / OVERDRIVE II / REDLINE states.
   -------------------------------------------------------------------------- */

function comboBaseMultiplier(combo){
  let c=Math.max(0,combo|0),m=1;
  const t1=Math.min(c,10); m+=t1*0.22; c-=t1;
  const t2=Math.min(c,15); m+=t2*0.075; c-=t2;
  const t3=Math.min(c,25); m+=t3*0.035; c-=t3;
  if(c>0) m+=c*0.015;
  return m;
}
scoreMultiplier=function(){
  let m=comboBaseMultiplier(game.combo);
  if(player.flux>=100) m*=1.5;
  return m;
};

const OVERDRIVE_THRESHOLDS=[0,28,60,90];
const OVERDRIVE_PACE=[1,1.12,1.28,1.48];
const OVERDRIVE_LABELS=['NORMAL','OVERDRIVE I','OVERDRIVE II','REDLINE'];
const OVERDRIVE_COLORS=[COL.dim,COL.cyan,COL.yellow,COL.magenta];

function overdriveTierFor(v){
  if(v>=OVERDRIVE_THRESHOLDS[3]) return 3;
  if(v>=OVERDRIVE_THRESHOLDS[2]) return 2;
  if(v>=OVERDRIVE_THRESHOLDS[1]) return 1;
  return 0;
}
function updateOverdriveTier(announceRise){
  const next=overdriveTierFor(game.momentum||0),prev=game.overdriveLevel||0;
  game.overdriveLevel=next;
  if(announceRise&&next>prev){
    spawnText(player.x,player.y-50,OVERDRIVE_LABELS[next],OVERDRIVE_COLORS[next],next===3?22:18,1.0);
    game.shake=Math.min(14,game.shake+3+next);
    audio.sfx('milestone');
  }
}
function addMomentum(amount){ game.momentum=clamp((game.momentum||0)+amount,0,100); updateOverdriveTier(true); }
function directorPace(){ if(game.bossSpawned) return 1; return OVERDRIVE_PACE[game.overdriveLevel||0]||1; }
function resetOverdriveState(){
  game.momentum=0; game.overdriveLevel=0; game.overdriveFeedTimer=3.5;
  game.formationSerial=0; game.formationGroups=Object.create(null);
}
resetOverdriveState();

const _resetGameOverdrive=resetGame;
resetGame=function(){ _resetGameOverdrive(); resetOverdriveState(); };

const _spawnEnemyOverdrive=spawnEnemy;
spawnEnemy=function(kind){ const e=_spawnEnemyOverdrive(kind); e.formationGroupId=0; return e; };

function registerFormationGroup(list){
  const members=list.filter(Boolean); if(!members.length) return 0;
  const id=++game.formationSerial;
  game.formationGroups[id]={size:members.length,dashId:-1,count:0,broken:false};
  for(const e of members) e.formationGroupId=id;
  return id;
}
function spawnTrackedFormationLine(angle,count,spacing,cx,cy,drift,kind){
  const dx=Math.cos(angle),dy=Math.sin(angle),px=-dy,py=dx,members=[];
  for(let i=0;i<count;i++){
    const off=(i-(count-1)/2)*spacing;
    members.push(placeFormationEnemy(kind||'wisp',cx+dx*off,cy+dy*off,px*(drift||0),py*(drift||0),2.4));
  }
  registerFormationGroup(members); return members;
}

spawnFormationWave=function(){
  if(game.level!==2||game.bossSpawned) return;
  const t=game.time,cap=t<60?9:(t<180?12:15);
  let alive=0; for(const e of enemies) if(e.active) alive++;
  if(alive>=cap-2){ game.formationTimer=1.25; return; }
  const idx=game.formationIndex++;
  const cx=clamp(WORLD_W/2+rand(-105,105),220,WORLD_W-220);
  const cy=clamp(WORLD_H/2+rand(-80,80),150,WORLD_H-150);
  if(t<60){
    const a=[0,Math.PI/2,Math.PI/4,-Math.PI/4][idx%4];
    spawnTrackedFormationLine(a,5,48,cx,cy,idx%2?28:-28);
    announce('FORMATION // 一线穿杀',COL.magenta,1.15); game.formationTimer=7.2;
  }else if(t<120){
    if(idx%2===0){
      const a=(idx%4)*Math.PI/4; spawnTrackedFormationLine(a,5,46,cx,cy,34);
      placeFormationEnemy('spiker',cx+Math.cos(a)*150,cy+Math.sin(a)*150,0,0,0);
      placeFormationEnemy('spiker',cx-Math.cos(a)*150,cy-Math.sin(a)*150,0,0,0);
    }else{
      const members=[]; for(let i=-2;i<=2;i++) members.push(placeFormationEnemy('wisp',cx+i*44,cy+Math.abs(i)*36,-34,0,2.5));
      registerFormationGroup(members);
    }
    announce('FORMATION // 交叉火力',COL.yellow,1.0); game.formationTimer=6.6;
  }else if(t<180){
    const a=(idx%6)*Math.PI/6; spawnTrackedFormationLine(a,6,43,cx,cy,idx%2?52:-52);
    if(idx%2===0){ const w=placeFormationEnemy('weaver',cx-Math.sin(a)*105,cy+Math.cos(a)*105,0,0,0); w.heading=a; }
    else placeFormationEnemy('breaker',cx+Math.cos(a)*175,cy+Math.sin(a)*175,0,0,0);
    announce('FORMATION // 移动阵列',COL.green,1.0); game.formationTimer=5.8;
  }else{
    const a=(idx%4)*Math.PI/4;
    spawnTrackedFormationLine(a,6,42,cx,cy,58);
    spawnTrackedFormationLine(a+Math.PI/2,5,46,cx+rand(-40,40),cy+rand(-35,35),-48);
    if(idx%2===0) placeFormationEnemy('spiker',cx,cy,0,0,0);
    announce('REDLINE // 阵列交叠',COL.magenta,0.9); game.formationTimer=4.4;
  }
};

function registerFormationDashKill(enemy,cause){
  if(game.level!==2||cause!=='dash'||!enemy.formationGroupId) return;
  const g=game.formationGroups[enemy.formationGroupId]; if(!g||g.broken) return;
  if(g.dashId!==player.dashId){ g.dashId=player.dashId; g.count=0; }
  g.count++; if(g.count<g.size) return;
  g.broken=true;
  addScore(520+g.size*110,player.x,player.y-46,'FORMATION BREAK');
  addMomentum(16+g.size*0.8); game.comboTimer=Math.max(game.comboTimer,3.0);
  game.formationTimer=Math.min(game.formationTimer,0.28); game.hitstop=Math.max(game.hitstop,0.055);
  game.flashWhite=Math.max(game.flashWhite,0.14); game.shake=Math.min(18,game.shake+8);
}

const _onKillOverdrive=onKill;
onKill=function(enemy,cause){
  const formationGroupId=enemy.formationGroupId||0;
  _onKillOverdrive(enemy,cause);
  if(cause==='dash'){
    addMomentum(2.35+Math.min(1.15,game.combo*0.046));
    if(formationGroupId) registerFormationDashKill({formationGroupId},cause);
  }
};

const _updateDirectorOverdrive=updateDirector;
updateDirector=function(dt){
  if(game.state==='playing'&&!game.bossSpawned){
    const extra=(directorPace()-1)*dt;
    if(extra>0){
      if(game.level===1){
        game.wispTimer-=extra;
        if(game.spikerTimer!==999) game.spikerTimer-=extra;
        if(game.weaverTimer!==999) game.weaverTimer-=extra;
        if(game.breakerTimer!==999) game.breakerTimer-=extra;
        game.surgeTimer-=extra;
      }else if(game.level===2){ game.formationTimer-=extra; game.wispTimer-=extra*0.65; }
      else if(game.level===3){
        game.wispTimer-=extra;
        if(game.spikerTimer!==999) game.spikerTimer-=extra;
        if(game.weaverTimer!==999) game.weaverTimer-=extra;
        if(game.breakerTimer!==999) game.breakerTimer-=extra;
      }
    }
  }
  _updateDirectorOverdrive(dt);
  if(game.state!=='playing'||game.bossSpawned) return;
  const tier=game.overdriveLevel||0; if(tier<=0||game.level===2) return;
  game.overdriveFeedTimer-=dt; if(game.overdriveFeedTimer>0) return;
  const d=game.difficulty;
  const baseCap=game.level===1?(game.time<22?2:Math.round(3+d*10)):(game.time<60?5:Math.round(6+d*8));
  const cap=baseCap+tier*2;
  if(countActiveEnemies()<cap) spawnWisp();
  game.overdriveFeedTimer=[5.0,4.2,2.9,1.9][tier];
};

const _updateWorldOverdrive=updateWorld;
updateWorld=function(dt){
  _updateWorldOverdrive(dt); if(game.state!=='playing') return;
  const decay=game.combo>0&&game.comboTimer>0?0.9:10.0;
  game.momentum=Math.max(0,(game.momentum||0)-decay*dt); updateOverdriveTier(false);
};

const _drawHUDOverdrive=drawHUD;
drawHUD=function(){
  _drawHUDOverdrive(); const tier=game.overdriveLevel||0;
  if(tier>0) drawPanelText(`${OVERDRIVE_LABELS[tier]} // PACE ×${directorPace().toFixed(2)}`,WORLD_W-30,158,11,OVERDRIVE_COLORS[tier],'right');
};

if(window.__OVERDRIVE_TEST__){
  Object.defineProperties(window.__OVERDRIVE_TEST__,{
    momentum:{get(){return game.momentum||0;}}, overdriveLevel:{get(){return game.overdriveLevel||0;}}, scoreMultiplier:{get(){return scoreMultiplier();}}
  });
  window.__OVERDRIVE_TEST__.setMomentum=function(v){ game.momentum=clamp(v,0,100); updateOverdriveTier(false); };
  window.__OVERDRIVE_TEST__.directorPace=function(){ return directorPace(); };
}
