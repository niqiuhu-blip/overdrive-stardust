/* ---------------- 受伤 / 死亡 ---------------- */
function hurtPlayer(fromX,fromY,srcKind){
  if(game.state!=='playing' || player.dashActive || player.iFrames > 0) return;
  player.lives--; player.iFrames=1.5; player.hurtFlash=0.25; player.flux=clamp(player.flux+8,0,100); game.combo=0; game.comboTimer=0;
  game.shake=16; game.hitstop=Math.max(game.hitstop,0.06); game.flashRed=0.28;
  const a=Math.atan2(player.y-fromY,player.x-fromX); player.vx=Math.cos(a)*360; player.vy=Math.sin(a)*360;
  burst(player.x,player.y,COL.cyan,26,300,0.6,5,0); burst(player.x,player.y,COL.red,18,200,0.5,4,0); audio.sfx('hurt');
  for(const b of bullets) if(b.active && Math.hypot(b.x-player.x,b.y-player.y)<110) b.active=false;
  for(const e of enemies){
    if(e.active && e.state!=='spawn' && Math.hypot(e.x-player.x,e.y-player.y)<150){
      e.touchCooldown=1.4; e.harmless=true; const ea=Math.atan2(e.y-player.y,e.x-player.x); e.vx+=Math.cos(ea)*220; e.vy+=Math.sin(ea)*220;
    }
  }
  if(player.lives<=0){ player.lives=0; game.deathCause=srcKind||'contact'; die(); }
  else spawnText(player.x,player.y-30,'-1',COL.red,22,0.8);
}
function die(){
  game.state='dying'; game.deathTimer=1.25; game.shake=26; game.flashWhite=0.5; game.deaths++;
  burst(player.x,player.y,COL.cyan,60,520,1.1,8,0); burst(player.x,player.y,COL.white,40,380,0.9,6,0); spawnParticle(player.x,player.y,0,0,0.9,40,COL.white,0,1); audio.sfx('over');
}
function finishGame(reason){
  if(game.state==='gameover') return; game.state='gameover'; game.endReason=reason||game.endReason||'death'; game.newBest=game.score>game.best && game.score>0;
  if(game.newBest) game.best=game.score; if(game.maxCombo>game.bestCombo) game.bestCombo=game.maxCombo; game.timeSurvived=Math.min(game.time,RUN_DURATION);
  if(game.timeSurvived>game.bestTime) game.bestTime=game.timeSurvived; persistSave();
}
