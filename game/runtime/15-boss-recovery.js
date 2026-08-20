'use strict';

/* ---------------- Boss milestone recovery ----------------
   Each boss grants at most one REPAIR opportunity around mid-fight.
   If the player is still at full life when the milestone is reached, the
   repair is armed and drops immediately after the next real hit instead.
*/
game.bossRepairDropped={1:false,2:false,3:false};
game.bossRepairPending={1:false,2:false,3:false};

function resetBossRepairState(){
  game.bossRepairDropped={1:false,2:false,3:false};
  game.bossRepairPending={1:false,2:false,3:false};
}
const _resetGameBossRecovery=resetGame;
resetGame=function(){ _resetGameBossRecovery(); resetBossRepairState(); };

function spawnBossRepair(level,x,y){
  if(game.bossRepairDropped[level]) return;
  game.bossRepairDropped[level]=true;
  game.bossRepairPending[level]=false;
  const px=clamp(x===undefined?player.x+Math.cos(player.facing)*58:x,30,WORLD_W-30);
  const py=clamp(y===undefined?player.y+Math.sin(player.facing)*58:y,30,WORLD_H-30);
  const m=spawnMote(px,py,0,'heal',true);
  m.life=14; m.maxLife=14;
  announce('REPAIR // +1 LIFE',COL.green,1.8);
  spawnText(px,py-18,'REPAIR',COL.green,18,1.2);
  audio.sfx('milestone');
}
function offerBossRepair(level,x,y){
  if(game.bossRepairDropped[level]||game.bossRepairPending[level]) return;
  if(player.lives<3) spawnBossRepair(level,x,y);
  else game.bossRepairPending[level]=true;
}

const _damageEnemyBossRecovery=damageEnemy;
damageEnemy=function(e,dmg,cause){
  const kind=e&&e.kind;
  _damageEnemyBossRecovery(e,dmg,cause);
  if(!e) return;
  if(kind==='core' && e.active && e.hp<=3) offerBossRepair(1);
  else if(kind==='pulsar' && e.active && e.hp<=5) offerBossRepair(3);
};

const _hitTwinBossRecovery=hitTwin;
hitTwin=function(e){
  _hitTwinBossRecovery(e);
  if(game.twinHp>0 && game.twinHp<=4) offerBossRepair(2);
};

const _hurtPlayerBossRecovery=hurtPlayer;
hurtPlayer=function(fromX,fromY,srcKind){
  const before=player.lives;
  _hurtPlayerBossRecovery(fromX,fromY,srcKind);
  if(player.lives>=before || player.lives<=0) return;
  const level=game.level|0;
  if(game.bossSpawned && game.bossRepairPending[level]) spawnBossRepair(level);
};

// Invincible Boss Practice is for mechanism study, so remove the normal 5:00
// timeout while the toggle is ON. Boss behavior and attack cadence are unchanged.
const _updateDirectorBossRecovery=updateDirector;
updateDirector=function(dt){
  if(game.bossPractice && game.bossPracticeInvincible && game.bossSpawned && game.time>RUN_DURATION-1.5){
    game.time=RUN_DURATION-1.5;
  }
  _updateDirectorBossRecovery(dt);
};
