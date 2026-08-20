/* ---------------- 计分 ---------------- */
function scoreMultiplier(){
  let m = 1 + Math.min(game.combo,10) * 0.22;
  if(player.flux >= 100) m *= 1.5;
  return m;
}
function addScore(base,x,y,label){
  const mult = scoreMultiplier();
  const v = Math.round(base * mult);
  game.score += v;
  if(x !== undefined && y !== undefined) spawnText(x,y,label ? `${label} +${v}` : `+${v}`, COL.white, label?14:16, 0.85);
  return v;
}
function onKill(enemy,cause){
  game.kills++;
  game.combo++;
  game.comboTimer = 3.0;
  if(game.combo > game.maxCombo) game.maxCombo = game.combo;
  if(game.combo > game.bestCombo){ game.bestCombo = game.combo; }
  const mult = scoreMultiplier();
  const base = enemy.score || 100;
  let v = Math.round(base * mult);
  game.score += v;
  const label = cause === 'nova' ? 'NOVA' : null;
  spawnText(enemy.x,enemy.y-18,label?`${label} +${v}`:`+${v}`, enemy.color, 17, 0.9);
  const moteCount = enemy.motes === undefined ? 3 : enemy.motes;
  if(cause!=='nova') dropMotes(enemy.x,enemy.y, moteCount, enemy.score);
  burst(enemy.x,enemy.y,enemy.color, enemy.kind==='core'?50:20, enemy.kind==='core'?480:260, enemy.kind==='core'?1.0:0.6, enemy.kind==='core'?7:4.5, 0);
  spawnParticle(enemy.x,enemy.y,0,0,0.35,enemy.r*2.2,enemy.color,0,1);
  game.shake = Math.min(18, game.shake + (enemy.kind==='core'?9:3));
  const killPitch = 1 + Math.min(game.combo,12)*0.055;
  if(cause==='dash'){
    player.dashKillCount++;
    if(player.dashActive) player.dashTime = Math.min(player.dashTime + 0.045, 0.25);
    game.hitstop = Math.max(game.hitstop, enemy.kind==='core'?0.08:0.028);
  }
  audio.sfx('kill',{pitch:killPitch});
  enemy.active=false; enemy.state='dead';
}
function dropMotes(x,y,count,score){
  for(let i=0;i<count;i++) spawnMote(x + rand(-8,8), y + rand(-8,8), 25, 'energy', i < 2);
  if(score >= 400 && score < 4000) spawnMote(x,y+14, 0, 'heal');
}
function grantDashEnergy(amount,x,y){
  player.energy += amount;
  while(player.energy >= 100 && player.charges < player.maxCharges){
    player.charges++;
    player.energy -= 100;
    spawnText(x===undefined?player.x:x, y===undefined?player.y-24:y, '冲刺 +1', COL.cyan, 15, 0.7);
    audio.sfx('dash');
  }
  if(player.charges >= player.maxCharges) player.energy = 0;
}
function addGraze(x,y,color){
  game.grazes++;
  player.flux = clamp(player.flux + 8, 0, 100);
  game.score += 15;
  spawnText(x,y,'擦弹 +15',COL.yellow,13,0.6);
  spawnParticle(x,y,0,0,0.25,3,COL.yellow,0,1);
  audio.sfx('graze');
}

/* ---------------- 敌人创建 ---------------- */
function randomSpawnPos(minD,maxD){
  for(let i=0;i<20;i++){
    const a = rand(TAU), d = rand(minD,maxD);
    const x = clamp(player.x + Math.cos(a)*d, 28, WORLD_W-28);
    const y = clamp(player.y + Math.sin(a)*d, 28, WORLD_H-28);
    if(Math.hypot(x-player.x,y-player.y) > 210) return {x,y};
  }
  return { x:clamp(player.x + (Math.random()<0.5?-330:330),30,WORLD_W-30), y:rand(60,WORLD_H-60) };
}
function spawnEnemy(kind){
  const e = getInactive(enemies,{i:eCursor},'x'); eCursor = (eCursor+1)%MAX_ENEMIES;
  const pos = randomSpawnPos(270,430);
  e.active = true; e.kind = kind; e.state = 'spawn'; e.spawnT = 0.65; e.x = pos.x; e.y = pos.y;
  e.vx=0; e.vy=0; e.touchCooldown=0; e.harmless=true; e.lastGraze=0; e.lastDashId=-1; e.novaHit=false; e.lastX=undefined; e.lastY=undefined;
  e.formationT=0; e.formationVX=0; e.formationVY=0;
  e.r = 14; e.score = 100; e.color = COL.magenta; e.motes = 4;
  if(kind==='wisp'){
    e.phase = rand(TAU); e.wobble = rand(1.5,2.6); e.speed = 0;
  }else if(kind==='spiker'){
    e.r = 17; e.score = 150; e.color = COL.orange; e.motes = 4;
    e.cooldown = 1.15; e.aiming=false; e.aimT=0; e.aimAngle=0; e.burst=3; e.shotsFired=0; e.rot=rand(TAU);
  }else if(kind==='weaver'){
    e.r = 13; e.score = 200; e.color = COL.green; e.motes = 4;
    e.heading = Math.atan2(player.y - e.y + rand(-60,60), player.x - e.x + rand(-60,60));
    e.speed = 118; e.turnRate = rand(1.2,1.9); e.phase = rand(TAU); e.nodeT = 0;
  }else if(kind==='breaker'){
    e.r = 23; e.score = 400; e.color = COL.red; e.motes = 10; e.hp = 3;
    e.state='spawn'; e.mode='seek'; e.modeT=rand(1.1,1.7); e.speed=52; e.chargeDirX=0; e.chargeDirY=0; e.rot=Math.atan2(player.y-e.y,player.x-e.x);
  }else if(kind==='core'){
    e.x=WORLD_W/2; e.y=WORLD_H/2; e.r=38; e.score=5000; e.color=COL.purple; e.motes=0; e.hp=6; e.maxHp=6;
    e.spawnT=1.25; e.rot=0; e.shielded=true; e.vulnerableT=0; e.damageWindow=0; e.shotT=0.8; e.waveT=2.2; e.phase=1; e.harmless=true;
  }else if(kind==='shard'){
    e.r=12; e.score=220; e.color=COL.yellow; e.motes=4; e.hp=1; e.spawnT=0.35; e.orbitA=rand(TAU); e.orbitR=92; e.orbitSpeed=rand(0.75,1.05);
  }else if(kind==='twinA' || kind==='twinB'){
    e.r=31; e.score=0; e.color=kind==='twinA'?COL.cyan:COL.magenta; e.motes=0; e.spawnT=0.9;
    e.twinId=kind==='twinA'?'A':'B'; e.rot=rand(TAU); e.shotT=kind==='twinA'?0.7:1.1; e.waveT=2.4; e.harmless=true;
  }else if(kind==='relay'){
    e.r=10; e.score=90; e.color=COL.yellow; e.motes=4; e.hp=1; e.spawnT=0.20; e.laneT=0.5; e.laneOffset=0; e.phase=rand(TAU); e.harmless=true;
  }else if(kind==='pulsar'){
    e.x=WORLD_W/2; e.y=WORLD_H/2; e.r=42; e.score=6500; e.color=COL.cyan; e.motes=0;
    e.hp=10; e.maxHp=10; e.spawnT=1.1; e.rot=0; e.shotT=1.0; e.waveT=2.2; e.harmless=true;
  }
  audio.sfx('spawn');
  return e;
}
function spawnWisp(){ spawnEnemy('wisp'); }
function spawnSpiker(){ spawnEnemy('spiker'); }
function spawnWeaver(){ spawnEnemy('weaver'); }
function spawnBreaker(){ spawnEnemy('breaker'); }
function findCore(){ for(const e of enemies) if(e.active && e.kind==='core') return e; return null; }
function countKind(kind){ let n=0; for(const e of enemies) if(e.active && e.kind===kind) n++; return n; }
function findTwin(id){ const kind=id==='A'?'twinA':'twinB'; for(const e of enemies) if(e.active && e.kind===kind) return e; return null; }
function clearRelays(){ for(const e of enemies) if(e.active && e.kind==='relay') e.active=false; }
function spawnRelayLane(force){
  const a=findTwin('A'), b=findTwin('B'); if(!a || !b) return;
  if(!force && countKind('relay')>=2) return;
  if(force) clearRelays();
  const count=4;
  for(let i=1;i<=count;i++){
    const r=spawnEnemy('relay');
    r.laneT=i/(count+1); r.laneOffset=(i%2?1:-1)*rand(8,22); r.phase=rand(TAU);
    r.x=lerp(a.x,b.x,r.laneT); r.y=lerp(a.y,b.y,r.laneT)+r.laneOffset;
  }
}
