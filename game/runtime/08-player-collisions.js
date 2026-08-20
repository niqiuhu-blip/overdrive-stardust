/* ---------------- 更新：子弹 / 轨迹 / 光尘 ---------------- */
function updateBullets(dt){
  for(const b of bullets){
    if(!b.active) continue; b.life-=dt; b.x+=b.vx*dt; b.y+=b.vy*dt;
    if(game.level===3){ const fv=flowVectorAt(b.x,b.y); b.x+=fv.x*dt*0.62; b.y+=fv.y*dt*0.62; }
    if(b.life<=0||b.x<-20||b.x>WORLD_W+20||b.y<-20||b.y>WORLD_H+20){ b.active=false; continue; }
    if(!player.dashActive&&player.iFrames<=0&&player.grazeCooldown<=0&&Math.hypot(b.x-player.x,b.y-player.y)<player.r+b.radius+24){ b.lastGraze=b.lastGraze||-9; if(game.time-b.lastGraze>1){ b.lastGraze=game.time; addGraze((b.x+player.x)/2,(b.y+player.y)/2,COL.yellow); } }
  }
}
function updateNodes(dt){ for(const n of nodes){ if(!n.active) continue; n.life-=dt; if(n.life<=0) n.active=false; } }
function updateMotes(dt){
  for(const m of motes){
    if(!m.active) continue; m.life-=dt; if(m.life<=0){ m.active=false; continue; }
    const dx=player.x-m.x,dy=player.y-m.y,dist=Math.hypot(dx,dy)||1,comboPull=game.combo>=3,magnetR=comboPull?285:(player.dashActive?190:150);
    if(dist<magnetR){ const pull=(player.dashActive?2400:1700)*(comboPull?1.45:1); m.vx+=dx/dist*pull*dt; m.vy+=dy/dist*pull*dt; }
    m.vx*=1-Math.min(1,2.2*dt); m.vy*=1-Math.min(1,2.2*dt); m.x+=m.vx*dt; m.y+=m.vy*dt;
    if(dist<player.r+m.r+3){ m.active=false; if(m.kind==='heal'){ player.lives=Math.min(3,player.lives+1); grantDashEnergy(25,m.x,m.y); addScore(250,m.x,m.y,'修复'); burst(m.x,m.y,COL.green,16,200,0.5,4,0); } else{ grantDashEnergy(m.value,m.x,m.y); game.score+=5; burst(m.x,m.y,COL.cyan,4,90,0.25,3,0); } audio.sfx('mote'); }
  }
}
function updateParticles(dt){ for(const p of particles){ if(!p.active) continue; p.life-=dt; if(p.life<=0){ p.active=false; continue; } const dr=Math.exp(-(p.drag||3)*dt); p.vx*=dr; p.vy*=dr; p.vy+=(p.grav||0)*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; } }
function updateTexts(dt){ for(const t of texts){ if(!t.active) continue; t.life-=dt; t.y+=t.vy*dt; t.vy*=1-1.6*dt; if(t.life<=0) t.active=false; } }

function updatePlayer(dt){
  const len=readMoveInput(),targetX=player.inputX*315,targetY=player.inputY*315,k=1-Math.exp(-10*dt); player.vx+=(targetX-player.vx)*k; player.vy+=(targetY-player.vy)*k;
  if(!player.dashActive){ player.x+=player.vx*dt; player.y+=player.vy*dt; if(game.level===3){ const fv=flowVectorAt(player.x,player.y); player.x+=fv.x*dt*0.28; player.y+=fv.y*dt*0.28; } player.x=clamp(player.x,player.r,WORLD_W-player.r); player.y=clamp(player.y,player.r,WORLD_H-player.r); if(len>0.01) player.facing=Math.atan2(player.inputY,player.inputX); }
  if(player.iFrames>0) player.iFrames-=dt; if(player.hurtFlash>0) player.hurtFlash-=dt; if(player.grazeCooldown>0) player.grazeCooldown-=dt; if(player.pointerDashT>0) player.pointerDashT-=dt;
  if(player.dashActive){
    player.dashTime-=dt; player.trailT-=dt; player.x+=player.dashDirX*player.dashSpeed*player.dashFlowMult*dt; player.y+=player.dashDirY*player.dashSpeed*player.dashFlowMult*dt;
    if(player.trailT<=0){ player.trailT=0.016; player.trailPos.push({x:player.x,y:player.y,a:0.5}); if(player.trailPos.length>24) player.trailPos.shift(); }
    if(player.x<=player.r||player.x>=WORLD_W-player.r||player.y<=player.r||player.y>=WORLD_H-player.r){ player.dashActive=false; player.dashTime=0; player.dashCooldown=0.10; player.x=clamp(player.x,player.r,WORLD_W-player.r); player.y=clamp(player.y,player.r,WORLD_H-player.r); player.iFrames=Math.max(player.iFrames,0.2); finishDash(); }
    else if(player.dashTime<=0){ player.dashActive=false; player.dashTime=0; player.dashCooldown=0.09; player.iFrames=Math.max(player.iFrames,0.22); finishDash(); }
  }else{ player.dashCooldown-=dt; player.dashBuffer-=dt; if(player.dashBuffer>0&&player.dashCooldown<=0&&player.charges>=1) startDash(); }
  if(!player.dashActive&&player.dashKillCount>=2){ const n=player.dashKillCount,bonus=Math.round((n-1)*160*scoreMultiplier()); game.score+=bonus; spawnText(player.x,player.y-34,`${n}连斩 +${bonus}`,COL.yellow,19,1.1); player.dashKillCount=0; audio.sfx('milestone'); }
  else if(!player.dashActive) player.dashKillCount=0;
}
function startDash(){
  let dx=player.pointerDashT>0?player.pointerDashX:player.inputX,dy=player.pointerDashT>0?player.pointerDashY:player.inputY; if(player.pointerDashT>0) player.pointerDashT=0;
  if(Math.hypot(dx,dy)<0.1){ dx=Math.cos(player.facing); dy=Math.sin(player.facing); }
  else{ let best=null,bestScore=1e9; const baseAng=Math.atan2(dy,dx); for(const e of enemies){ if(!e.active||e.state==='spawn') continue; const ex=e.x-player.x,ey=e.y-player.y,dist=Math.hypot(ex,ey); if(dist<34||dist>180) continue; const diff=Math.abs(((Math.atan2(ey,ex)-baseAng+Math.PI*3)%(Math.PI*2))-Math.PI); if(diff<0.245){ const score=diff*220+dist*0.28; if(score<bestScore){ bestScore=score; best={x:ex,y:ey}; } } } if(best){ dx=best.x; dy=best.y; } }
  const d=Math.hypot(dx,dy)||1; player.dashDirX=dx/d; player.dashDirY=dy/d; player.dashFlowMult=1;
  if(game.level===3){ const fv=flowVectorAt(player.x,player.y),fm=Math.hypot(fv.x,fv.y); if(fm>1){ const dot=(player.dashDirX*fv.x+player.dashDirY*fv.y)/fm; player.dashFlowMult=1+0.23*Math.max(0,dot)-0.10*Math.max(0,-dot); } }
  player.facing=Math.atan2(player.dashDirY,player.dashDirX); player.dashActive=true; player.dashTime=player.dashDur; player.dashBuffer=0; player.charges--; player.dashId++; player.dashKillCount=0; player.trailPos.length=0; player.trailT=0; player.vx=player.dashDirX*player.dashSpeed; player.vy=player.dashDirY*player.dashSpeed; game.shake=Math.min(12,game.shake+4); audio.sfx('dash'); burst(player.x,player.y,COL.cyan,10,150,0.3,3,0);
}
function finishDash(){ player.vx*=0.35; player.vy*=0.35; }
function updateCollisions(){
  const pr=player.r;
  for(const e of enemies){ if(!e.active||e.state==='spawn') continue; const dx=player.x-e.x,dy=player.y-e.y,rr=pr+e.r+(player.dashActive?6:0); if(dx*dx+dy*dy<rr*rr){ if(player.dashActive) onDashHitEnemy(e); else if(!e.harmless&&e.touchCooldown<=0&&game.state==='playing'){ e.touchCooldown=1.2; hurtPlayer(e.x,e.y,e.kind); } } }
  for(const b of bullets){ if(!b.active) continue; const dx=b.x-player.x,dy=b.y-player.y,rr=pr+b.radius+1; if(dx*dx+dy*dy<rr*rr){ if(player.dashActive){ b.active=false; addScore(5,b.x,b.y); burst(b.x,b.y,COL.orange,5,120,0.3,3,0); audio.sfx('mote'); } else if(player.iFrames<=0&&game.state==='playing'){ b.active=false; hurtPlayer(b.x,b.y,'bullet'); } } }
  for(const n of nodes){ if(!n.active) continue; const dx=n.x-player.x,dy=n.y-player.y,rr=pr+7; if(dx*dx+dy*dy<rr*rr){ if(player.dashActive){ n.active=false; addScore(5,n.x,n.y); burst(n.x,n.y,COL.green,4,110,0.3,3,0); } else if(player.iFrames<=0&&game.state==='playing'){ n.active=false; hurtPlayer(n.x,n.y,'trail'); } } }
}
