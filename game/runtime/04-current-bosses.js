/* ---------------- 第三关：STELLAR CURRENT 流场 ---------------- */
function setFlow(mode,strength,angle){ game.flowMode=mode; game.flowStrength=strength||0; if(angle!==undefined) game.flowAngle=angle; }
function flowVectorAt(x,y){
  if(game.level!==3 || game.flowFreeze>0 || game.flowMode==='none') return {x:0,y:0};
  const s=game.flowStrength;
  if(game.flowMode==='stream') return {x:Math.cos(game.flowAngle)*s,y:Math.sin(game.flowAngle)*s};
  if(game.flowMode==='dual'){
    const sign=y<WORLD_H/2?1:-1; return {x:Math.cos(game.flowAngle)*s*sign,y:Math.sin(game.flowAngle)*s*sign};
  }
  if(game.flowMode==='vortex' || game.flowMode==='turbulence'){
    const cx=WORLD_W/2+Math.sin(game.time*0.33)*70, cy=WORLD_H/2+Math.cos(game.time*0.27)*48;
    const dx=x-cx, dy=y-cy, d=Math.hypot(dx,dy)||1; let vx=-dy/d*s, vy=dx/d*s;
    if(game.flowMode==='turbulence'){ vx+=Math.cos(game.flowAngle)*s*0.55; vy+=Math.sin(game.flowAngle)*s*0.55; }
    return {x:vx,y:vy};
  }
  if(game.flowMode==='inhale' || game.flowMode==='exhale'){
    const dx=WORLD_W/2-x, dy=WORLD_H/2-y, d=Math.hypot(dx,dy)||1, sign=game.flowMode==='inhale'?1:-1;
    return {x:dx/d*s*sign,y:dy/d*s*sign};
  }
  if(game.flowMode==='polarity'){
    const ax=Math.cos(game.flowAngle), ay=Math.sin(game.flowAngle);
    const side=((x-WORLD_W/2)*(-ay)+(y-WORLD_H/2)*ax)>=0?1:-1;
    const dx=WORLD_W/2-x, dy=WORLD_H/2-y, d=Math.hypot(dx,dy)||1;
    return {x:dx/d*s*side,y:dy/d*s*side};
  }
  return {x:0,y:0};
}
function updateFlowState(dt){
  if(game.level!==3) return;
  if(game.flowFreeze>0){ game.flowFreeze=Math.max(0,game.flowFreeze-dt); return; }
  if(game.bossSpawned){ game.flowAngle += dt*0.34; return; }
  const t=game.time;
  if(t<60) setFlow('stream',92,Math.sin(t*0.018)*0.35);
  else if(t<120) setFlow('dual',104,0.18*Math.sin(t*0.025));
  else if(t<180) setFlow('vortex',112,0);
  else{ game.flowAngle += dt*0.46; setFlow('turbulence',118,game.flowAngle); }
}
function drawFlowField(){
  if(game.level!==3 || game.flowMode==='none') return;
  ctx.save(); const frozen=game.flowFreeze>0; ctx.globalAlpha=frozen?0.10:0.18; ctx.strokeStyle=frozen?COL.white:COL.cyan; ctx.lineWidth=1.4;
  for(let y=70;y<WORLD_H;y+=92){ for(let x=70;x<WORLD_W;x+=110){
    const v=flowVectorAt(x,y), d=Math.hypot(v.x,v.y); if(d<1) continue;
    const nx=v.x/d, ny=v.y/d, len=24+Math.min(20,d*0.12);
    ctx.beginPath(); ctx.moveTo(x-nx*len*0.35,y-ny*len*0.35); ctx.lineTo(x+nx*len*0.65,y+ny*len*0.65); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+nx*len*0.65,y+ny*len*0.65); ctx.lineTo(x+nx*len*0.45-ny*4,y+ny*len*0.45+nx*4); ctx.lineTo(x+nx*len*0.45+ny*4,y+ny*len*0.45-nx*4); ctx.stroke();
  }} ctx.restore();
}
function spawnPulsarFuel(count){
  for(let i=0;i<count;i++){
    const a=(i/count)*TAU+game.time*0.17, r=150+18*(i%2);
    const e=placeFormationEnemy('wisp',WORLD_W/2+Math.cos(a)*r,WORLD_H/2+Math.sin(a)*r,0,0,1.4);
    e.formationVX=-Math.sin(a)*34; e.formationVY=Math.cos(a)*34;
  }
}
function spawnPulsarBoss(){
  for(const e of enemies) if(e.active) e.active=false; for(const b of bullets) b.active=false; for(const n of nodes) n.active=false;
  const p=spawnEnemy('pulsar'); game.bossSpawned=true; game.pulsarMode='inhale'; game.pulsarModeTimer=4.8; game.pulsarStun=0; game.pulsarFuelTimer=0.8;
  setFlow('inhale',142,0); player.charges=player.maxCharges; player.energy=0; player.iFrames=Math.max(player.iFrames,1.5); spawnPulsarFuel(6);
  announce('PULSAR // 吸积脉冲协议',COL.cyan,3.4); audio.sfx('milestone'); return p;
}
function killPulsar(p,cause){
  p.active=false; game.completed=true; const bonus=10500+Math.max(0,Math.round((RUN_DURATION-game.time)*150)); game.score+=bonus;
  spawnText(WORLD_W/2,WORLD_H/2-78,`PULSAR BREAK +${bonus}`,COL.yellow,24,1.6); game.flashWhite=0.95; game.shake=32; audio.sfx('nova'); finishGame('victory');
}
function spawnTwinBoss(){
  for(const e of enemies) if(e.active) e.active=false; for(const b of bullets) b.active=false; for(const n of nodes) n.active=false;
  const a=spawnEnemy('twinA'), b=spawnEnemy('twinB'); a.x=220; a.y=WORLD_H/2; b.x=740; b.y=WORLD_H/2;
  game.bossSpawned=true; game.twinTarget='A'; game.twinHp=8; game.twinStun=0; game.relayTimer=2.5; player.charges=player.maxCharges; player.iFrames=Math.max(player.iFrames,1.5);
  spawnRelayLane(true); announce('TWIN DRIVE // 交替追猎协议',COL.magenta,3.4); audio.sfx('milestone');
}
function hitTwin(e){
  if(game.twinHp<=0) return;
  if(e.twinId!==game.twinTarget){ spawnText(e.x,e.y-42,'PHASE',e.color,13,0.45); burst(e.x,e.y,e.color,5,90,0.22,2.5,0); return; }
  game.twinHp--; addScore(450,e.x,e.y-42,'CHAIN'); burst(e.x,e.y,e.color,20,260,0.45,5,0); game.hitstop=Math.max(game.hitstop,0.045); game.shake=Math.max(game.shake,10);
  if(player.dashActive) player.dashTime=Math.min(player.dashTime+0.065,0.29);
  if(game.twinHp<=0){
    const other=findTwin(e.twinId==='A'?'B':'A'); if(other) other.active=false; e.active=false; game.completed=true;
    const bonus=9000+Math.max(0,Math.round((RUN_DURATION-game.time)*140)); game.score+=bonus; spawnText(WORLD_W/2,WORLD_H/2-70,`TWIN BREAK +${bonus}`,COL.yellow,24,1.6);
    game.flashWhite=0.9; game.shake=30; audio.sfx('nova'); finishGame('victory'); return;
  }
  game.twinTarget=e.twinId==='A'?'B':'A'; announce(`TARGET SHIFT // 追击 ${game.twinTarget}`, game.twinTarget==='A'?COL.cyan:COL.magenta, 0.9); spawnRelayLane(true); game.relayTimer=3.4;
}
function spawnCoreShards(core){
  const count=3; for(let i=0;i<count;i++){ const sh=spawnEnemy('shard'); sh.orbitA=i/count*TAU+core.rot; sh.orbitR=86+(i%2)*14; sh.orbitSpeed=0.9+i*0.08; sh.x=core.x+Math.cos(sh.orbitA)*sh.orbitR; sh.y=core.y+Math.sin(sh.orbitA)*sh.orbitR; }
}
function spawnCore(){
  for(const e of enemies) if(e.active) e.active=false; for(const b of bullets) b.active=false; for(const n of nodes) n.active=false;
  const core=spawnEnemy('core'); player.charges=player.maxCharges; player.energy=0; player.iFrames=Math.max(player.iFrames,1.4); game.bossSpawned=true;
  spawnCoreShards(core); spawnWisp(); spawnWisp(); announce('STARDUST CORE // 最终协议',COL.purple,3.4); audio.sfx('milestone'); return core;
}
function spawnBossShield(core){ core.shielded=true; core.vulnerableT=0; core.damageWindow=0; spawnCoreShards(core); if(countActiveEnemies()<8){ spawnWisp(); spawnWisp(); } announce('核心护盾重构：切开三枚星核',COL.yellow,2.2); }
function fireCore(core){
  const phase=core.hp<=2?3:(core.hp<=4?2:1); core.phase=phase; const n=7+phase*2, base=core.rot+game.time*0.11, sp=175+phase*28;
  for(let i=0;i<n;i++){ const a=base+i/n*TAU; spawnBullet(core.x+Math.cos(a)*42,core.y+Math.sin(a)*42,Math.cos(a)*sp,Math.sin(a)*sp,6); }
  const aim=Math.atan2(player.y-core.y,player.x-core.x); for(let j=-1;j<=1;j++){ const a=aim+j*0.16; spawnBullet(core.x+Math.cos(a)*42,core.y+Math.sin(a)*42,Math.cos(a)*(235+phase*18),Math.sin(a)*(235+phase*18),6); } audio.sfx('shoot');
}
function killCore(core,cause){
  onKill(core,cause); game.completed=true; const timeBonus=Math.max(0,Math.round((RUN_DURATION-game.time)*120)); game.score+=8000+timeBonus;
  spawnText(WORLD_W/2,WORLD_H/2-78,`CORE BREAK +${8000+timeBonus}`,COL.yellow,24,1.6); game.flashWhite=0.8; game.shake=28; audio.sfx('nova'); finishGame('victory');
}
