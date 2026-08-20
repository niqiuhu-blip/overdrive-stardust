/* ---------------- 主循环（固定时间步 + delta clamp） ---------------- */
let acc=0;
function frame(t){
  let dt=(t-lastTime)/1000; lastTime=t; if(!Number.isFinite(dt)||dt<0) dt=0; dt=Math.min(dt,0.1);
  if(game.state==='paused'||game.state==='title'||game.state==='gameover') game.elapsed+=dt;
  if(game.state==='playing'){
    acc+=dt; let guard=0; while(acc>=STEP&&guard<8&&game.state==='playing'){ if(game.hitstop>0) game.hitstop-=STEP; else updateWorld(STEP); acc-=STEP; guard++; } if(guard>=8) acc=0;
  }else if(game.state==='dying'){
    game.deathTimer-=dt; updateParticles(dt); updateTexts(dt); updateEnemies(dt); updateBullets(dt); updateNodes(dt); updateMotes(dt); updateCollisions(); updatePulse(dt); updateNova(dt); game.shake=Math.max(0,game.shake-dt*40); game.flashWhite=Math.max(0,game.flashWhite-dt*1.8); game.flashRed=Math.max(0,game.flashRed-dt*2.4); if(game.deathTimer<=0) finishGame('death');
  }else if(game.state!=='paused'){
    updateParticles(dt); updateTexts(dt);
    // Victory previously froze the final shake value forever because gameover
    // screens do not run updateWorld(). Decay frozen-screen feedback here.
    game.shake=Math.max(0,game.shake-dt*40);
    game.flashWhite=Math.max(0,game.flashWhite-dt*1.8);
    game.flashRed=Math.max(0,game.flashRed-dt*2.4);
  }
  render(); requestAnimationFrame(frame);
}
function boot(){ const saved=loadSave(); game.best=saved.best; game.bestCombo=saved.bestCombo; game.bestTime=saved.bestTime; audio.muted=saved.muted; resetPlayer(); for(const e of enemies) e.active=false; resize(); requestAnimationFrame(frame); }
boot();
window.__OVERDRIVE_TEST__={
  get state(){return game.state;}, get score(){return game.score;}, get time(){return game.time;}, get best(){return game.best;}, get bestTime(){return game.bestTime;}, get newBest(){return game.newBest;}, get deathCause(){return game.deathCause;}, get endReason(){return game.endReason;}, get level(){return game.level;}, get selectedLevel(){return game.selectedLevel;}, get twinHp(){return game.twinHp;}, get twinTarget(){return game.twinTarget;}, get flowMode(){return game.flowMode;}, get flux(){return player.flux;},
  start(level){startGame(level||game.selectedLevel);}, pause(){pauseGame();}, resume(){resumeGame();}, setFlux(v){player.flux=clamp(v,0,100);}, flowAt(x,y){return flowVectorAt(x,y);}, pulse(){tryPulse();}, setPlayer(x,y){player.x=x;player.y=y;},
  testPulseClear(){ const b=spawnBullet(player.x+45,player.y,0,0,2),n=spawnNode(player.x+55,player.y,player.x+50,player.y,2); player.flux=Math.max(player.flux,25); const before=player.flux; tryPulse(); for(let i=0;i<10;i++) updatePulse(STEP); return {before,after:player.flux,bulletActive:b.active,nodeActive:n.active,pulseActive:!!game.pulse}; },
  key(k){onKeyDown({key:k,preventDefault(){},repeat:false});}, keyup(k){onKeyUp({key:k});}, menuClick(x,y){if(game.state==='title') handleTitlePointer(viewOx+x*viewScale,viewOy+y*viewScale); else if(game.state==='gameover') handleGameoverPointer(viewOx+x*viewScale,viewOy+y*viewScale);}, god(on){if(on){player.iFrames=999999;player.charges=3;player.energy=0;}else if(player.iFrames>9)player.iFrames=0;}, spawn(kind){spawnEnemy(kind);}, step(n){n=n||60;for(let i=0;i<n;i++){if(game.state==='playing')updateWorld(STEP);}},
  enemies(){return enemies.filter(e=>e.active).map(e=>({kind:e.kind,state:e.state,hp:e.hp,shielded:e.shielded,twinId:e.twinId,x:e.x,y:e.y,vx:e.vx,vy:e.vy,mode:e.mode,spawnT:e.spawnT}));}, bullets(){return bullets.filter(b=>b.active).map(b=>({x:b.x,y:b.y,vx:b.vx,vy:b.vy}));}, motes(){return motes.filter(m=>m.active).map(m=>({x:m.x,y:m.y,kind:m.kind,value:m.value}));}, player(){return {x:player.x,y:player.y,lives:player.lives,charges:player.charges,energy:player.energy,flux:player.flux,dashActive:player.dashActive,iFrames:player.iFrames,combo:game.combo,inputX:player.inputX,inputY:player.inputY,facing:player.facing};}
};
