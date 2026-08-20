/* ---------------- 第二关：FORMATION 阵列 runtime ---------------- */
function placeFormationEnemy(kind,x,y,driftX,driftY,hold){
  const e=spawnEnemy(kind);
  e.x=clamp(x,34,WORLD_W-34); e.y=clamp(y,34,WORLD_H-34);
  e.spawnT=0.30;
  if(kind==='wisp'){
    e.formationT=hold===undefined?2.25:hold;
    e.formationVX=driftX||0; e.formationVY=driftY||0;
  }
  return e;
}
function spawnFormationLine(angle,count,spacing,cx,cy,drift,kind){
  const dx=Math.cos(angle), dy=Math.sin(angle), px=-dy, py=dx;
  for(let i=0;i<count;i++){
    const off=(i-(count-1)/2)*spacing;
    placeFormationEnemy(kind||'wisp',cx+dx*off,cy+dy*off,px*(drift||0),py*(drift||0),2.4);
  }
}
function spawnFormationWave(){
  if(game.level!==2 || game.bossSpawned) return;
  const t=game.time;
  const cap=t<60?9:(t<180?12:15);
  let alive=0; for(const e of enemies) if(e.active) alive++;
  if(alive>=cap-2){ game.formationTimer=1.25; return; }
  const idx=game.formationIndex++;
  const cx=clamp(WORLD_W/2+rand(-105,105),220,WORLD_W-220);
  const cy=clamp(WORLD_H/2+rand(-80,80),150,WORLD_H-150);
  if(t<60){
    const a=[0,Math.PI/2,Math.PI/4,-Math.PI/4][idx%4];
    spawnFormationLine(a,5,48,cx,cy,idx%2?28:-28);
    announce('FORMATION // 一线穿杀',COL.magenta,1.15);
    game.formationTimer=7.2;
  }else if(t<120){
    if(idx%2===0){
      const a=(idx%4)*Math.PI/4;
      spawnFormationLine(a,5,46,cx,cy,34);
      placeFormationEnemy('spiker',cx+Math.cos(a)*150,cy+Math.sin(a)*150,0,0,0);
      placeFormationEnemy('spiker',cx-Math.cos(a)*150,cy-Math.sin(a)*150,0,0,0);
    }else{
      for(let i=-2;i<=2;i++) placeFormationEnemy('wisp',cx+i*44,cy+Math.abs(i)*36,-34,0,2.5);
    }
    announce('FORMATION // 交叉火力',COL.yellow,1.0);
    game.formationTimer=6.6;
  }else if(t<180){
    const a=(idx%6)*Math.PI/6;
    spawnFormationLine(a,6,43,cx,cy,idx%2?52:-52);
    if(idx%2===0){
      const w=placeFormationEnemy('weaver',cx-Math.sin(a)*105,cy+Math.cos(a)*105,0,0,0); w.heading=a;
    }else placeFormationEnemy('breaker',cx+Math.cos(a)*175,cy+Math.sin(a)*175,0,0,0);
    announce('FORMATION // 移动阵列',COL.green,1.0);
    game.formationTimer=5.8;
  }else{
    const a=(idx%4)*Math.PI/4;
    spawnFormationLine(a,6,42,cx,cy,58);
    spawnFormationLine(a+Math.PI/2,5,46,cx+rand(-40,40),cy+rand(-35,35),-48);
    if(idx%2===0) placeFormationEnemy('spiker',cx,cy,0,0,0);
    announce('REDLINE // 阵列交叠',COL.magenta,0.9);
    game.formationTimer=4.4;
  }
}
