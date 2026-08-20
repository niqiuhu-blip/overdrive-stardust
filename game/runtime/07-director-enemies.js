/* ---------------- 导演 / 难度 ---------------- */
function updateDirector(dt){
  game.time+=dt; game.elapsed+=dt; game.difficulty=clamp(game.time/230,0,1);
  if(game.time>=RUN_DURATION){ game.time=RUN_DURATION; if(!game.completed) finishGame('timeout'); return; }
  if(game.level===3){ updateDirectorLevel3(dt); return; }
  if(game.level===2){ updateDirectorLevel2(dt); return; }
  updateDirectorLevel1(dt);
}
function updateDirectorLevel1(dt){
  const d=game.difficulty;
  if(game.time>=205&&!game.finalApproach){ game.finalApproach=true; game.surgeInterval=18; announce('FINAL APPROACH // 核心信号锁定',COL.yellow,3.0); audio.sfx('milestone'); }
  if(game.time>=LEVEL1_BOSS_TIME&&!game.bossSpawned){ spawnCore(); return; } if(game.bossSpawned) return;
  const maxAlive=game.time<22?2:Math.round(3+d*10); game.wispTimer-=dt;
  if(game.wispTimer<=0&&countActiveEnemies()<maxAlive){ spawnWisp(); game.wispTimer=Math.max(0.5,1.9-1.4*d)*rand(0.82,1.18); }
  if(game.time>=27&&game.spikerTimer===999){ game.spikerTimer=1; announce('新威胁：针刺哨卫',COL.orange,3.2); audio.sfx('milestone'); }
  if(game.spikerTimer!==999){ game.spikerTimer-=dt; if(game.spikerTimer<=0&&(game.firstSpiker||countActiveEnemies()<maxAlive+2)){ spawnSpiker(); game.firstSpiker=false; game.spikerTimer=Math.max(4.2,10.5-6.2*d)*rand(0.8,1.2); } }
  if(game.time>=56&&game.weaverTimer===999){ game.weaverTimer=1; announce('新威胁：织网者',COL.green,3.2); audio.sfx('milestone'); }
  if(game.weaverTimer!==999){ game.weaverTimer-=dt; if(game.weaverTimer<=0&&(game.firstWeaver||countActiveEnemies()<maxAlive+2)){ spawnWeaver(); game.firstWeaver=false; game.weaverTimer=Math.max(5.6,12.5-6.8*d)*rand(0.8,1.2); } }
  if(game.time>=104&&game.breakerTimer===999){ game.breakerTimer=1.2; announce('新威胁：破阵者',COL.red,3.2); audio.sfx('milestone'); }
  if(game.breakerTimer!==999){ game.breakerTimer-=dt; if(game.breakerTimer<=0&&(game.firstBreaker||countActiveEnemies()<maxAlive)){ spawnBreaker(); game.firstBreaker=false; game.breakerTimer=Math.max(8.5,16-7.5*d)*rand(0.8,1.2); } }
  if(game.time>=170&&!game.overloadAnnounced){ game.overloadAnnounced=true; game.surgeInterval=25; game.surgeTimer=Math.min(game.surgeTimer,10); announce('核心超载 // 连杀窗口开启',COL.red,2.8); audio.sfx('milestone'); }
  game.surgeTimer-=dt; if(game.surgeTimer<=0){ game.surgeTimer=game.surgeInterval; const n=Math.min(9,4+Math.floor(d*5)); for(let i=0;i<n;i++){ if(countActiveEnemies()>=maxAlive+3) break; spawnWisp(); } announce('围猎波次',COL.yellow,1.4); }
}
function updateDirectorLevel2(dt){
  const t=game.time;
  if(t>=205&&!game.finalApproach){ game.finalApproach=true; announce('FINAL FORMATION // 双星信号接近',COL.magenta,3.0); audio.sfx('milestone'); }
  if(t>=LEVEL2_BOSS_TIME&&!game.bossSpawned){ spawnTwinBoss(); return; } if(game.bossSpawned) return;
  game.formationTimer-=dt; if(game.formationTimer<=0) spawnFormationWave();
  const maxAlive=t<60?9:(t<180?12:15); game.wispTimer-=dt;
  if(game.wispTimer<=0&&countActiveEnemies()<maxAlive){ spawnWisp(); game.wispTimer=(t<60?3.0:(t<180?2.5:1.8))*rand(0.85,1.15); }
  if(t>=180&&!game.overloadAnnounced){ game.overloadAnnounced=true; game.formationTimer=Math.min(game.formationTimer,0.25); announce('REDLINE // 阵列交叠',COL.magenta,3.0); audio.sfx('milestone'); }
}
function updateDirectorLevel3(dt){
  const t=game.time,d=game.difficulty; updateFlowState(dt);
  if(t>=205&&!game.finalApproach){ game.finalApproach=true; announce('CURRENT COLLAPSE // 脉冲星接近',COL.cyan,3.0); audio.sfx('milestone'); }
  if(t>=LEVEL3_BOSS_TIME&&!game.bossSpawned){ spawnPulsarBoss(); return; } if(game.bossSpawned) return;
  const maxAlive=t<60?5:Math.round(6+d*8); game.wispTimer-=dt;
  if(game.wispTimer<=0&&countActiveEnemies()<maxAlive){ spawnWisp(); game.wispTimer=(t<60?1.7:(t<120?1.45:(t<180?1.15:0.82)))*rand(0.84,1.16); }
  if(t>=50&&game.spikerTimer===999){ game.spikerTimer=0.5; announce('流向扰动 // 哨卫弹道偏折',COL.orange,2.5); audio.sfx('milestone'); }
  if(game.spikerTimer!==999){ game.spikerTimer-=dt; if(game.spikerTimer<=0&&countActiveEnemies()<maxAlive+2){ spawnSpiker(); game.spikerTimer=(t<140?8.8:6.0)*rand(0.85,1.15); } }
  if(t>=105&&game.weaverTimer===999){ game.weaverTimer=0.6; announce('涡流形成 // 轨迹开始弯折',COL.green,2.5); audio.sfx('milestone'); }
  if(game.weaverTimer!==999){ game.weaverTimer-=dt; if(game.weaverTimer<=0&&countActiveEnemies()<maxAlive+2){ spawnWeaver(); game.weaverTimer=(t<180?10.2:7.4)*rand(0.85,1.16); } }
  if(t>=155&&game.breakerTimer===999){ game.breakerTimer=0.8; announce('湍流增压 // 破阵者介入',COL.red,2.5); audio.sfx('milestone'); }
  if(game.breakerTimer!==999){ game.breakerTimer-=dt; if(game.breakerTimer<=0&&countActiveEnemies()<maxAlive){ spawnBreaker(); game.breakerTimer=(t<190?13.5:9.5)*rand(0.85,1.15); } }
  if(t>=180&&!game.overloadAnnounced){ game.overloadAnnounced=true; announce('TURBULENCE // 星流失稳',COL.cyan,3.0); audio.sfx('milestone'); }
}
function countActiveEnemies(){ let n=0; for(const e of enemies) if(e.active&&e.state!=='spawn') n++; return n; }

/* ---------------- 更新：敌人 ---------------- */
function updateEnemies(dt){
  const d=game.difficulty, warmup=game.time<20?0.62+0.38*(game.time/20):1;
  for(const e of enemies){
    if(!e.active) continue;
    if(e.touchCooldown>0){ e.touchCooldown-=dt; if(e.touchCooldown<=0&&!(e.kind==='breaker'&&e.mode==='stun')) e.harmless=false; }
    if(e.state==='spawn'){ e.spawnT-=dt; if(e.spawnT<=0){ e.state='active'; e.harmless=(e.kind==='twinA'||e.kind==='twinB'||e.kind==='relay'); } continue; }
    if(e.kind==='wisp'){
      if(e.formationT>0){ e.formationT-=dt; const kf=1-Math.exp(-5*dt); e.vx+=(e.formationVX-e.vx)*kf; e.vy+=(e.formationVY-e.vy)*kf; e.x+=e.vx*dt; e.y+=e.vy*dt; }
      else{ const dx=player.x-e.x,dy=player.y-e.y,dist=Math.hypot(dx,dy)||1,sp=(76+50*d)*warmup+Math.sin(game.time*e.wobble+e.phase)*20; const k=1-Math.exp(-3.2*dt); e.vx+=(dx/dist*sp-e.vx)*k; e.vy+=(dy/dist*sp-e.vy)*k; e.x+=e.vx*dt; e.y+=e.vy*dt; }
      e.x=clamp(e.x,20,WORLD_W-20); e.y=clamp(e.y,20,WORLD_H-20);
    }else if(e.kind==='spiker'){
      e.rot+=dt*0.8;
      if(e.aiming){ e.aimT-=dt; if(e.aimT>0.25) e.aimAngle=Math.atan2(player.y-e.y,player.x-e.x); if(e.aimT<=0){ fireSpiker(e); e.aiming=false; e.cooldown=Math.max(1.5,2.6-1.0*d)*rand(0.85,1.2); } }
      else{ e.cooldown-=dt; if(e.cooldown<=0){ e.aiming=true; e.aimT=0.9; e.aimAngle=Math.atan2(player.y-e.y,player.x-e.x); e.burst=game.difficulty>0.42?5:3; audio.sfx('warn'); } }
    }else if(e.kind==='weaver'){
      e.heading+=Math.sin(game.time*e.turnRate+e.phase)*dt*1.35; const vx=Math.cos(e.heading)*e.speed,vy=Math.sin(e.heading)*e.speed; e.x+=vx*dt; e.y+=vy*dt;
      if(e.x<24||e.x>WORLD_W-24){ e.heading=Math.PI-e.heading; e.x=clamp(e.x,24,WORLD_W-24); } if(e.y<24||e.y>WORLD_H-24){ e.heading=-e.heading; e.y=clamp(e.y,24,WORLD_H-24); }
      e.nodeT-=dt; if(e.nodeT<=0){ e.nodeT=0.115; if(e.lastX!==undefined) spawnNode(e.x,e.y,e.lastX,e.lastY,4.2); else spawnNode(e.x,e.y,e.x,e.y,4.2); e.lastX=e.x; e.lastY=e.y; } e.vx=vx; e.vy=vy;
    }else if(e.kind==='breaker') updateBreaker(e,dt);
    else if(e.kind==='shard'){
      const core=findCore(); if(!core){ e.active=false; continue; } e.orbitA+=dt*e.orbitSpeed*(core.hp<=2?1.7:1.15); e.x=core.x+Math.cos(e.orbitA)*e.orbitR; e.y=core.y+Math.sin(e.orbitA)*e.orbitR;
    }else if(e.kind==='core'){
      e.rot+=dt*(0.45+(6-e.hp)*0.08); e.x=WORLD_W/2+Math.sin(game.time*0.58)*72; e.y=WORLD_H/2+Math.sin(game.time*0.37+1.2)*40; e.shotT-=dt; e.waveT-=dt;
      if(e.shotT<=0){ fireCore(e); e.shotT=Math.max(0.72,1.35-(6-e.hp)*0.10); }
      if(e.waveT<=0){ const n=10+(6-e.hp),sp=140+(6-e.hp)*12; for(let i=0;i<n;i++){ const a=e.rot+i/n*TAU; spawnBullet(e.x+Math.cos(a)*40,e.y+Math.sin(a)*40,Math.cos(a)*sp,Math.sin(a)*sp,7); } e.waveT=Math.max(2,3.6-(6-e.hp)*0.2); audio.sfx('warn'); }
      if(e.shielded&&countKind('shard')===0){ e.shielded=false; e.vulnerableT=4.4; e.damageWindow=0; announce('护盾破碎 // 冲击核心！',COL.cyan,2.0); audio.sfx('milestone'); }
      else if(!e.shielded){ e.vulnerableT-=dt; if(e.vulnerableT<=0&&e.hp>0) spawnBossShield(e); } e.harmless=false;
    }else if(e.kind==='twinA'||e.kind==='twinB'){
      e.rot+=dt*(e.twinId==='A'?0.8:-0.72); const side=e.twinId==='A'?-1:1; e.x=WORLD_W/2+side*(250+Math.sin(game.time*0.43+(e.twinId==='A'?0:1.7))*28); e.y=WORLD_H/2+Math.sin(game.time*0.82+(e.twinId==='A'?0:Math.PI))*112; e.harmless=true;
      if(game.twinStun<=0){ e.shotT-=dt; e.waveT-=dt; if(e.shotT<=0){ const aim=Math.atan2(player.y-e.y,player.x-e.x),spread=e.twinId==='A'?0.14:0.22; for(let j=-1;j<=1;j++){ const a=aim+j*spread; spawnBullet(e.x+Math.cos(a)*34,e.y+Math.sin(a)*34,Math.cos(a)*(230+(8-game.twinHp)*7),Math.sin(a)*(230+(8-game.twinHp)*7),6); } e.shotT=(e.twinId==='A'?1.25:1.55)-Math.min(0.35,(8-game.twinHp)*0.04); audio.sfx('shoot'); }
        if(e.waveT<=0&&e.twinId==='B'){ const nn=7+(8-game.twinHp>4?2:0); for(let i=0;i<nn;i++){ const a=e.rot+i/nn*TAU; spawnBullet(e.x,e.y,Math.cos(a)*165,Math.sin(a)*165,6); } e.waveT=2.8; audio.sfx('warn'); } }
    }else if(e.kind==='pulsar'){
      e.rot+=dt*0.72; e.x=WORLD_W/2; e.y=WORLD_H/2; e.harmless=false; if(game.pulsarStun>0) game.pulsarStun=Math.max(0,game.pulsarStun-dt);
      if(e.hp>5){ game.pulsarModeTimer-=dt; if(game.pulsarModeTimer<=0){ game.pulsarMode=game.pulsarMode==='inhale'?'exhale':'inhale'; game.pulsarModeTimer=4.8; announce(game.pulsarMode==='inhale'?'INHALE // 吸积':'EXHALE // 爆发',game.pulsarMode==='inhale'?COL.cyan:COL.magenta,1.2); } setFlow(game.pulsarMode,game.pulsarMode==='inhale'?148:162,0); }
      else{ game.pulsarMode='polarity'; game.flowAngle+=dt*0.42; setFlow('polarity',152,game.flowAngle); }
      game.pulsarFuelTimer-=dt; if(game.pulsarFuelTimer<=0&&countActiveEnemies()<10){ spawnPulsarFuel(e.hp>5?4:6); game.pulsarFuelTimer=e.hp>5?4.4:3.4; }
      if(game.pulsarStun<=0){ e.shotT-=dt; e.waveT-=dt; if(e.shotT<=0){ const aim=Math.atan2(player.y-e.y,player.x-e.x); for(let j=-2;j<=2;j++){ const a=aim+j*0.14; spawnBullet(e.x,e.y,Math.cos(a)*(205+(10-e.hp)*7),Math.sin(a)*(205+(10-e.hp)*7),6); } e.shotT=Math.max(0.72,1.28-(10-e.hp)*0.045); audio.sfx('shoot'); } if(e.waveT<=0){ const nn=e.hp>5?10:14; for(let i=0;i<nn;i++){ const a=e.rot+i/nn*TAU; spawnBullet(e.x,e.y,Math.cos(a)*170,Math.sin(a)*170,6); } e.waveT=e.hp>5?2.8:2.15; audio.sfx('warn'); } }
    }else if(e.kind==='relay'){
      const a=findTwin('A'),b=findTwin('B'); if(!a||!b){ e.active=false; continue; } const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len,wob=e.laneOffset+Math.sin(game.time*3.2+e.phase)*8; e.x=lerp(a.x,b.x,e.laneT)+nx*wob; e.y=lerp(a.y,b.y,e.laneT)+ny*wob; e.harmless=true;
    }
    if(game.level===3&&e.kind!=='pulsar'&&e.kind!=='relay'&&e.kind!=='twinA'&&e.kind!=='twinB'){ const fv=flowVectorAt(e.x,e.y),scale=e.kind==='breaker'?0.18:0.34; e.x=clamp(e.x+fv.x*dt*scale,20,WORLD_W-20); e.y=clamp(e.y+fv.y*dt*scale,20,WORLD_H-20); if(e.kind==='weaver'&&(Math.abs(fv.x)+Math.abs(fv.y)>1)) e.heading+=(fv.x*Math.sin(e.heading)-fv.y*Math.cos(e.heading))*dt*0.0008; }
    if(player.grazeCooldown<=0&&!player.dashActive&&player.iFrames<=0&&game.state==='playing'){ const gr=player.r+e.r+26,dd=Math.hypot(e.x-player.x,e.y-player.y); if(dd<gr&&game.time-e.lastGraze>1.1){ e.lastGraze=game.time; addGraze((player.x+e.x)/2,(player.y+e.y)/2,COL.yellow); } }
  }
  if(game.level===2&&game.bossSpawned&&game.twinHp>0){ if(game.twinStun>0) game.twinStun=Math.max(0,game.twinStun-dt); game.relayTimer-=dt; if(game.relayTimer<=0||countKind('relay')<2){ spawnRelayLane(true); game.relayTimer=3.6; } }
}
function fireSpiker(e){
  const n=e.burst,spread=n===3?0.24:0.17,speed=205+game.difficulty*45; for(let i=0;i<n;i++){ const a=e.aimAngle+(i-(n-1)/2)*spread; spawnBullet(e.x+Math.cos(a)*16,e.y+Math.sin(a)*16,Math.cos(a)*speed,Math.sin(a)*speed,7); } audio.sfx('shoot'); burst(e.x,e.y,COL.orange,5,120,0.25,3,0);
}
function updateBreaker(e,dt){
  const d=game.difficulty;
  if(e.mode==='seek'){ e.modeT-=dt; const dx=player.x-e.x,dy=player.y-e.y,dist=Math.hypot(dx,dy)||1,sp=50+26*d; e.vx+=(dx/dist*sp-e.vx)*(1-Math.exp(-3*dt)); e.vy+=(dy/dist*sp-e.vy)*(1-Math.exp(-3*dt)); e.x+=e.vx*dt; e.y+=e.vy*dt; e.rot=Math.atan2(dy,dx); if(e.modeT<=0){ e.mode='aim'; e.modeT=0.75; e.chargeDirX=dx/dist; e.chargeDirY=dy/dist; e.rot=Math.atan2(e.chargeDirY,e.chargeDirX); audio.sfx('warn'); } }
  else if(e.mode==='aim'){ e.modeT-=dt; if(e.modeT>0.22){ const dx=player.x-e.x,dy=player.y-e.y,dist=Math.hypot(dx,dy)||1; e.chargeDirX=dx/dist; e.chargeDirY=dy/dist; e.rot=Math.atan2(dy,dx); } e.vx*=1-2*dt; e.vy*=1-2*dt; if(e.modeT<=0){ e.mode='charge'; e.modeT=0.62; audio.sfx('break'); } }
  else if(e.mode==='charge'){ e.modeT-=dt; const sp=540+80*d; e.vx=e.chargeDirX*sp; e.vy=e.chargeDirY*sp; e.x+=e.vx*dt; e.y+=e.vy*dt; e.rot=Math.atan2(e.chargeDirY,e.chargeDirX); if(e.x<26||e.x>WORLD_W-26||e.y<26||e.y>WORLD_H-26){ e.x=clamp(e.x,26,WORLD_W-26); e.y=clamp(e.y,26,WORLD_H-26); e.mode='stun'; e.modeT=0.9; e.harmless=true; e.touchCooldown=0.9; audio.sfx('break'); } if(e.modeT<=0){ e.mode='stun'; e.modeT=0.55; e.harmless=true; e.touchCooldown=0.55; } }
  else if(e.mode==='stun'){ e.modeT-=dt; e.vx*=1-4*dt; e.vy*=1-4*dt; e.x+=e.vx*dt; e.y+=e.vy*dt; if(e.modeT<=0){ e.mode='seek'; e.modeT=rand(1.2,1.9); e.harmless=false; } }
  e.x=clamp(e.x,26,WORLD_W-26); e.y=clamp(e.y,26,WORLD_H-26);
}
