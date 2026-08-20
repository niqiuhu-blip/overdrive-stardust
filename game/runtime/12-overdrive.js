'use strict';

/* v0.7b — Overdrive / Formation Break tuning
   - Every tracked formation must be realistically clearable by one dash.
   - Overdrive changes encounter supply, not player power.
*/

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

const OVERDRIVE_THRESHOLDS=[0,24,52,82];
const OVERDRIVE_PACE=[1,1.35,1.75,2.30];
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
    spawnText(player.x,player.y-50,OVERDRIVE_LABELS[next],OVERDRIVE_COLORS[next],next===3?24:19,1.05);
    game.shake=Math.min(16,game.shake+4+next*2);
    game.flashWhite=Math.max(game.flashWhite,next===3?0.13:0.06);
    audio.sfx('milestone');
    // A gear change should be felt immediately, not several seconds later.
    game.overdriveFeedTimer=0.05;
    if(game.level===2) game.formationTimer=Math.min(game.formationTimer,0.45);
  }
}
function addMomentum(amount){ game.momentum=clamp((game.momentum||0)+amount,0,100); updateOverdriveTier(true); }
function directorPace(){ return game.bossSpawned?1:(OVERDRIVE_PACE[game.overdriveLevel||0]||1); }
function resetOverdriveState(){
  game.momentum=0; game.overdriveLevel=0; game.overdriveFeedTimer=2.0;
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

// Tracked groups are always one-dimensional kill lines. Decorative/interfering enemies
// may sit nearby, but are never required for FORMATION BREAK.
spawnFormationWave=function(){
  if(game.level!==2||game.bossSpawned) return;
  const t=game.time,tier=game.overdriveLevel||0;
  const cap=(t<60?9:(t<180?12:15))+tier*2;
  let alive=0; for(const e of enemies) if(e.active) alive++;
  if(alive>=cap-2){ game.formationTimer=tier>=2?0.65:1.1; return; }
  const idx=game.formationIndex++;
  const cx=clamp(WORLD_W/2+rand(-105,105),220,WORLD_W-220);
  const cy=clamp(WORLD_H/2+rand(-80,80),150,WORLD_H-150);
  if(t<60){
    const a=[0,Math.PI/2,Math.PI/4,-Math.PI/4][idx%4];
    spawnTrackedFormationLine(a,5,44,cx,cy,idx%2?24:-24);
    announce('FORMATION // 一线穿杀',COL.magenta,0.95);
    game.formationTimer=7.0/directorPace();
  }else if(t<120){
    const a=[0,Math.PI/4,Math.PI/2,-Math.PI/4][idx%4];
    // Former V-shape removed: every Break target remains a single clearable line.
    spawnTrackedFormationLine(a,5,43,cx,cy,idx%2?32:-32);
    if(idx%2===0){
      placeFormationEnemy('spiker',cx+Math.cos(a)*150,cy+Math.sin(a)*150,0,0,0);
      placeFormationEnemy('spiker',cx-Math.cos(a)*150,cy-Math.sin(a)*150,0,0,0);
      announce('FORMATION // 守线火力',COL.yellow,0.9);
    }else{
      const side=a+Math.PI/2;
      placeFormationEnemy('wisp',cx+Math.cos(side)*105,cy+Math.sin(side)*105,-28,0,2.2);
      placeFormationEnemy('wisp',cx-Math.cos(side)*105,cy-Math.sin(side)*105,28,0,2.2);
      announce('FORMATION // 偏移诱饵',COL.yellow,0.9);
    }
    game.formationTimer=6.2/directorPace();
  }else if(t<180){
    const a=(idx%6)*Math.PI/6;
    spawnTrackedFormationLine(a,6,40,cx,cy,idx%2?48:-48);
    if(idx%2===0){ const w=placeFormationEnemy('weaver',cx-Math.sin(a)*110,cy+Math.cos(a)*110,0,0,0); w.heading=a; }
    else placeFormationEnemy('breaker',cx+Math.cos(a)*178,cy+Math.sin(a)*178,0,0,0);
    announce('FORMATION // 移动杀线',COL.green,0.85);
    game.formationTimer=5.4/directorPace();
  }else{
    // REDLINE: two independent clearable lines. Each can Break on its own.
    const a=(idx%4)*Math.PI/4;
    spawnTrackedFormationLine(a,6,39,cx,cy,54);
    spawnTrackedFormationLine(a+Math.PI/2,5,42,cx+rand(-34,34),cy+rand(-30,30),-46);
    if(idx%2===0) placeFormationEnemy('spiker',cx,cy,0,0,0);
    announce('REDLINE // 双杀线',COL.magenta,0.75);
    game.formationTimer=4.0/directorPace();
  }
};

function registerFormationDashKill(enemy,cause){
  if(game.level!==2||cause!=='dash'||!enemy.formationGroupId) return;
  const g=game.formationGroups[enemy.formationGroupId]; if(!g||g.broken) return;
  if(g.dashId!==player.dashId){ g.dashId=player.dashId; g.count=0; }
  g.count++;
  if(g.count<g.size) return;
  g.broken=true;
  addScore(520+g.size*110,player.x,player.y-46,'FORMATION BREAK');
  addMomentum(20+g.size*1.0);
  game.comboTimer=Math.max(game.comboTimer,3.0);
  game.formationTimer=0.12;
  game.overdriveFeedTimer=0.05;
  game.hitstop=Math.max(game.hitstop,0.07);
  game.flashWhite=Math.max(game.flashWhite,0.18);
  game.shake=Math.min(20,game.shake+10);
  audio.sfx('milestone');
}

const _onKillOverdrive=onKill;
onKill=function(enemy,cause){
  const formationGroupId=enemy.formationGroupId||0;
  _onKillOverdrive(enemy,cause);
  if(cause==='dash'){
    addMomentum(2.7+Math.min(1.5,game.combo*0.052));
    if(formationGroupId) registerFormationDashKill({formationGroupId},cause);
  }
};

const _updateDirectorOverdrive=updateDirector;
updateDirector=function(dt){
  if(game.state==='playing'&&!game.bossSpawned){
    const pace=directorPace(),extra=(pace-1)*dt;
    if(extra>0){
      if(game.level===1){
        game.wispTimer-=extra;
        if(game.spikerTimer!==999) game.spikerTimer-=extra;
        if(game.weaverTimer!==999) game.weaverTimer-=extra;
        if(game.breakerTimer!==999) game.breakerTimer-=extra;
        game.surgeTimer-=extra;
      }else if(game.level===2){
        // Formation timer already scales by pace when a wave is created; this extra
        // acceleration makes tier changes immediately visible mid-countdown.
        game.formationTimer-=extra*1.4;
        game.wispTimer-=extra;
      }else if(game.level===3){
        game.wispTimer-=extra;
        if(game.spikerTimer!==999) game.spikerTimer-=extra;
        if(game.weaverTimer!==999) game.weaverTimer-=extra;
        if(game.breakerTimer!==999) game.breakerTimer-=extra;
      }
    }
  }
  _updateDirectorOverdrive(dt);
  if(game.state!=='playing'||game.bossSpawned) return;
  const tier=game.overdriveLevel||0; if(tier<=0) return;
  game.overdriveFeedTimer-=dt; if(game.overdriveFeedTimer>0) return;

  if(game.level===2){
    // In Formation, the extra supply is another deliberate line, not random clutter.
    if(game.formationTimer>0.9) game.formationTimer=0.35;
  }else{
    const d=game.difficulty;
    const baseCap=game.level===1?(game.time<22?2:Math.round(3+d*10)):(game.time<60?5:Math.round(6+d*8));
    const cap=baseCap+[0,3,6,9][tier];
    const want=[0,1,2,3][tier];
    for(let i=0;i<want&&countActiveEnemies()<cap;i++) spawnWisp();
  }
  game.overdriveFeedTimer=[9,2.2,1.15,0.62][tier];
};

const _updateWorldOverdrive=updateWorld;
updateWorld=function(dt){
  _updateWorldOverdrive(dt); if(game.state!=='playing') return;
  const decay=game.combo>0&&game.comboTimer>0?0.65:12.0;
  game.momentum=Math.max(0,(game.momentum||0)-decay*dt);
  updateOverdriveTier(false);
};

const _drawHUDOverdrive=drawHUD;
drawHUD=function(){
  _drawHUDOverdrive();
  const tier=game.overdriveLevel||0;
  if(tier>0){
    drawPanelText(`${OVERDRIVE_LABELS[tier]} // PACE ×${directorPace().toFixed(2)}`,WORLD_W-30,158,12,OVERDRIVE_COLORS[tier],'right');
    if(tier===3) drawPanelText('KEEP IT ALIVE',WORLD_W-30,176,10,COL.magenta,'right',0.65+0.35*Math.sin(game.elapsed*7));
  }
};

if(window.__OVERDRIVE_TEST__){
  Object.defineProperties(window.__OVERDRIVE_TEST__,{
    momentum:{get(){return game.momentum||0;}},
    overdriveLevel:{get(){return game.overdriveLevel||0;}},
    scoreMultiplier:{get(){return scoreMultiplier();}}
  });
  window.__OVERDRIVE_TEST__.setMomentum=function(v){ game.momentum=clamp(v,0,100); updateOverdriveTier(false); game.overdriveFeedTimer=0.01; };
  window.__OVERDRIVE_TEST__.directorPace=function(){ return directorPace(); };
}
