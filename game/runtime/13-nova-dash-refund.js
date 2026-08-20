'use strict';

/* Nova kills refund Dash exactly like normal ordinary-enemy kills.
   The three-charge cap remains the only limiter; overflow is discarded by grantDashEnergy(). */
const _onKillNovaDashRefund = onKill;
onKill = function(enemy,cause){
  const refundNova = cause==='nova' && enemy && (enemy.motes||0)>0;
  const x=enemy&&enemy.x, y=enemy&&enemy.y;
  const moteCount=enemy&&enemy.motes===undefined?3:(enemy?enemy.motes:0);
  const score=enemy&&enemy.score||0;
  _onKillNovaDashRefund(enemy,cause);
  if(refundNova) dropMotes(x,y,moteCount,score);
};
