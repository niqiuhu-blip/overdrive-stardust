'use strict';

/* ---------------- Direct Dash-energy settlement ----------------
   Dash energy is part of the core kill -> dash loop, so it resolves immediately
   on kill instead of spawning collectible energy motes. Healing drops remain
   physical pickups because recovery is intentionally positional.
*/
dropMotes=function(x,y,count,score){
  if(count>0) grantDashEnergy(count*25,x,y-8);
  if(score>=400 && score<4000) spawnMote(x,y+14,0,'heal');
};
