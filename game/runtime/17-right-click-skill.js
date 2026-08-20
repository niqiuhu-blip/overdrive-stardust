'use strict';

/* Right mouse button = small Flux skill (same as Q).
   Left mouse remains pointer-directed Dash. */
canvas.addEventListener('mousedown',e=>{
  if(e.button!==2 || game.state!=='playing') return;
  e.preventDefault();
  e.stopImmediatePropagation();
  audio.init(); audio.resume();
  tryPulse();
},true);

// The canvas owns RMB input; never open the browser context menu over it.
canvas.addEventListener('contextmenu',e=>e.preventDefault());
