/* ---------------- 脉冲 / 新星 ---------------- */
function tryPulse(){
  if(player.charges>=player.maxCharges){ audio.sfx('warn'); spawnText(player.x,player.y-26,'DASH 已满',COL.cyan,13,0.7); return; }
  if(player.flux < 25){ audio.sfx('warn'); spawnText(player.x,player.y-26,'RECHARGE 需要 25',COL.purple,13,0.7); return; }
  player.flux=Math.max(0,player.flux-25);
  player.charges=Math.min(player.maxCharges,player.charges+1);
  player.energy=0;
  game.pulse=null;
  game.shake=Math.max(game.shake,5); game.hitstop=Math.max(game.hitstop,0.012);
  spawnText(player.x,player.y-32,'DASH +1',COL.cyan,17,0.8);
  burst(player.x,player.y,COL.cyan,14,180,0.32,4,0);
  audio.sfx('dash');
}
function updatePulse(dt){
  if(game.pulse) game.pulse=null;
}
function drawPulse(p){}
function tryNova(){
  if(player.flux<100){ audio.sfx('warn'); spawnText(player.x,player.y-26,'能量不足',COL.purple,13,0.7); return; }
  player.flux=0; for(const e of enemies) if(e.active) e.novaHit=false;
  game.nova={x:player.x,y:player.y,r:10,maxR:430,speed:760,active:true,hit:false,bossUtilityTriggered:false}; player.iFrames=Math.max(player.iFrames,0.6);
  game.shake=18; game.flashWhite=0.35; game.hitstop=Math.max(game.hitstop,0.05); audio.sfx('nova'); burst(player.x,player.y,COL.purple,36,420,0.7,6,0);
}
function updateNova(dt){
  const n=game.nova; if(!n || !n.active) return; n.r+=n.speed*dt;
  for(const b of bullets){ if(b.active && !b.hitByNova && Math.hypot(b.x-n.x,b.y-n.y)<=n.r+6){ b.active=false; addScore(5,b.x,b.y); burst(b.x,b.y,COL.orange,3,90,0.3,2,0); } }
  for(const nd of nodes){ if(nd.active && !nd.hitByNova && Math.hypot(nd.x-n.x,nd.y-n.y)<=n.r+6){ nd.active=false; addScore(5,nd.x,nd.y); } }
  for(const e of enemies){
    if(!e.active || e.state==='spawn' || e.novaHit) continue;
    if(Math.hypot(e.x-n.x,e.y-n.y)<=n.r+e.r){
      e.novaHit=true;
      if(e.kind==='relay'){
      }else if(e.kind==='twinA'||e.kind==='twinB'){
        if(!n.bossUtilityTriggered){ n.bossUtilityTriggered=true; game.twinStun=Math.max(game.twinStun,2.8); spawnRelayLane(true); announce('NOVA // TWIN FREEZE',COL.purple,1.4); spawnText(WORLD_W/2,WORLD_H/2-44,'双核停火 2.8s',COL.purple,16,1.0); }
      }else if(e.kind==='pulsar'){
        if(!n.bossUtilityTriggered){ n.bossUtilityTriggered=true; game.flowFreeze=Math.max(game.flowFreeze,2.5); game.pulsarStun=Math.max(game.pulsarStun,2.5); announce('NOVA // FLOW FREEZE',COL.purple,1.4); spawnText(WORLD_W/2,WORLD_H/2-58,'流场冻结 2.5s',COL.purple,16,1.0); }
      }else damageEnemy(e,2,'nova');
    }
  }
  if(n.r>=n.maxR){ n.active=false; game.nova=null; }
}
function damageEnemy(e,dmg,cause){
  if(e.kind==='core'){
    if(e.shielded){ spawnText(e.x,e.y-54,'SHIELD',COL.yellow,14,0.55); burst(e.x,e.y,COL.yellow,5,100,0.25,3,0); return; }
    const dealt=cause==='nova'?1:dmg; e.hp-=dealt; e.damageWindow+=dealt;
    if(cause==='nova'){ e.vulnerableT+=2.0; spawnText(e.x,e.y-70,'NOVA // WINDOW +2s',COL.purple,13,0.8); }
    addScore(cause==='nova'?250:350,e.x,e.y-48,'CORE'); burst(e.x,e.y,COL.purple,18,260,0.45,5,0); game.hitstop=Math.max(game.hitstop,0.055); game.shake=Math.max(game.shake,12);
    if(e.hp<=0){ killCore(e,cause); return; }
    if(e.damageWindow>=2){ e.shielded=true; e.vulnerableT=0; e.damageWindow=0; spawnCoreShards(e); announce('核心重新上锁',COL.red,1.5); }
    return;
  }
  if(e.kind==='pulsar'){
    if(cause==='nova') return; e.hp-=dmg; addScore(420,e.x,e.y-52,'PULSAR'); burst(e.x,e.y,COL.cyan,18,280,0.45,5,0); game.hitstop=Math.max(game.hitstop,0.055); game.shake=Math.max(game.shake,12);
    if(e.hp<=0){ killPulsar(e,cause); return; } if(e.hp===5){ announce('POLARITY SHIFT // 极性分裂',COL.yellow,2.3); audio.sfx('milestone'); } return;
  }
  if(e.kind==='breaker'){
    e.hp-=dmg; e.harmless=true; e.touchCooldown=0.9;
    if(e.hp>0){ e.mode='stun'; e.modeT=0.7; const a=Math.atan2(e.y-player.y,e.x-player.x); e.vx=Math.cos(a)*260; e.vy=Math.sin(a)*260; addScore(100,e.x,e.y-16); burst(e.x,e.y,COL.red,12,220,0.5,4,0); audio.sfx('break'); return; }
  }
  onKill(e,cause);
}
function onDashHitEnemy(e){
  if(e.state==='spawn'||!e.active||e.lastDashId===player.dashId) return; e.lastDashId=player.dashId;
  if(e.kind==='breaker') damageEnemy(e,1,'dash');
  else if(e.kind==='core') damageEnemy(e,1,'dash');
  else if(e.kind==='twinA'||e.kind==='twinB') hitTwin(e);
  else if(e.kind==='pulsar') damageEnemy(e,1,'dash');
  else onKill(e,'dash');
}
