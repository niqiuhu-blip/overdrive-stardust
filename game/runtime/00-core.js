'use strict';

/* ============================================================
   超驰星尘 OVERDRIVE://STARDUST
   一句话核心：冲刺同时是位移、无敌与唯一武器；
   击杀掉落会过期的能量，逼你主动冲进敌群而不是躲开。
   原创概念：以“冲刺充能循环 + 擦弹蓄能新星”为双核心的
   街机清版竞技场，敌人全部程序化生成。
   ============================================================ */

const TAU = Math.PI * 2;
const WORLD_W = 960;
const WORLD_H = 600;
const STEP = 1 / 60;
const RUN_DURATION = 300;
const LEVEL1_BOSS_TIME = 220;
const LEVEL2_BOSS_TIME = 220;
const LEVEL3_BOSS_TIME = 220;
const clamp = (v,a,b) => v < a ? a : v > b ? b : v;
const lerp = (a,b,t) => a + (b-a)*t;
const rand = (a=1,b) => b === undefined ? Math.random()*a : a + Math.random()*(b-a);
const pick = arr => arr[(Math.random()*arr.length)|0];

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let cssW = 1, cssH = 1, dpr = 1, viewScale = 1, viewOx = 0, viewOy = 0;

function resize(){
  cssW = Math.max(1, window.innerWidth || document.documentElement.clientWidth);
  cssH = Math.max(1, window.innerHeight || document.documentElement.clientHeight);
  dpr = clamp(window.devicePixelRatio || 1, 1, 2);
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  viewScale = Math.min(cssW / WORLD_W, cssH / WORLD_H);
  viewOx = (cssW - WORLD_W * viewScale) / 2;
  viewOy = (cssH - WORLD_H * viewScale) / 2;
  buildBackground();
}
window.addEventListener('resize', resize);

/* ---------------- 持久化 ---------------- */
const SAVE_KEY = 'overdriveStardustSave_v1';
function loadSave(){
  try{
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    return {
      best: Math.max(0, s.best|0),
      bestCombo: Math.max(0, s.bestCombo|0),
      bestTime: Math.max(0, s.bestTime|0),
      muted: !!s.muted
    };
  }catch(e){ return { best:0, bestCombo:0, bestTime:0, muted:false }; }
}
function persistSave(){
  try{ localStorage.setItem(SAVE_KEY, JSON.stringify({ best: game.best, bestCombo: game.bestCombo, bestTime: game.bestTime, muted: audio.muted })); }
  catch(e){}
}

/* ---------------- 颜色 ---------------- */
const COL = {
  cyan:'#4df3ff', magenta:'#ff4d9e', orange:'#ffb347', green:'#7dff6a',
  red:'#ff5555', yellow:'#ffe66d', purple:'#b57bff', white:'#ffffff', dim:'#8b9bb4'
};
function hexRGB(hex){
  const n = parseInt(hex.slice(1),16);
  return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 };
}

/* ---------------- 音频（WebAudio 合成，零外部素材） ---------------- */
const audio = {
  ctx:null, master:null, musicGain:null, muted:false,
  musicTimer:0, musicStep:0, noiseBuf:null,
  init(){
    if(this.ctx) return;
    try{
      const AC = window.AudioContext || window.webkitAudioContext;
      if(!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.16;
      this.musicGain.connect(this.master);
      const len = this.ctx.sampleRate * 0.5;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for(let i=0;i<len;i++) d[i] = Math.random()*2-1;
    }catch(e){ this.ctx = null; }
  },
  resume(){ if(this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(()=>{}); },
  setMuted(m){ this.muted = m; if(this.master) this.master.gain.setTargetAtTime(m?0:0.5, this.ctx.currentTime, 0.02); persistSave(); },
  toggleMute(){ this.setMuted(!this.muted); return this.muted; },
  tone(o){
    if(!this.ctx || !this.master) return;
    try{
      const t0 = this.ctx.currentTime + (o.delay || 0);
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = o.type || 'sine';
      osc.frequency.setValueAtTime(Math.max(20,o.f0), t0);
      if(o.f1) osc.frequency.exponentialRampToValueAtTime(Math.max(20,o.f1), t0 + o.dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(o.vol || 0.2, t0 + (o.attack || 0.004));
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
      osc.connect(g); g.connect(this.master);
      osc.start(t0); osc.stop(t0 + o.dur + 0.05);
    }catch(e){}
  },
  noise(o){
    if(!this.ctx || !this.master || !this.noiseBuf) return;
    try{
      const t0 = this.ctx.currentTime + (o.delay || 0);
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf; src.loop = true;
      const filt = this.ctx.createBiquadFilter();
      filt.type = o.filter || 'bandpass';
      filt.frequency.setValueAtTime(o.f0 || 1000, t0);
      if(o.f1) filt.frequency.exponentialRampToValueAtTime(Math.max(40,o.f1), t0 + o.dur);
      filt.Q.value = o.q || 0.8;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(o.vol || 0.2, t0 + (o.attack || 0.004));
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
      src.connect(filt); filt.connect(g); g.connect(this.master);
      src.start(t0); src.stop(t0 + o.dur + 0.05);
    }catch(e){}
  },
  sfx(name,opt){
    if(this.muted) return;
    this.init();
    const pitch = (opt && opt.pitch) || 1;
    switch(name){
      case 'dash': this.noise({f0:900, f1:2600, dur:0.16, vol:0.16, filter:'bandpass', q:1.2}); this.tone({f0:260, f1:720, dur:0.13, vol:0.10, type:'sawtooth'}); break;
      case 'kill': this.tone({f0:440*pitch, f1:880*pitch, dur:0.09, vol:0.15, type:'square'}); this.noise({f0:1400, f1:500, dur:0.08, vol:0.10}); break;
      case 'mote': this.tone({f0:760, f1:1180, dur:0.06, vol:0.07, type:'sine'}); break;
      case 'hurt': this.tone({f0:190, f1:55, dur:0.28, vol:0.25, type:'sawtooth'}); this.noise({f0:400, f1:120, dur:0.22, vol:0.20, filter:'lowpass'}); break;
      case 'shoot': this.tone({f0:1180, f1:620, dur:0.05, vol:0.035, type:'square'}); break;
      case 'warn': this.tone({f0:880, f1:1320, dur:0.07, vol:0.05, type:'sine'}); break;
      case 'nova': this.noise({f0:250, f1:3600, dur:0.55, vol:0.22, filter:'highpass'}); this.tone({f0:90, f1:45, dur:0.5, vol:0.22, type:'sawtooth'}); this.tone({f0:520, f1:1560, dur:0.35, vol:0.10, type:'triangle'}); break;
      case 'pulse': this.noise({f0:900, f1:2600, dur:0.11, vol:0.11, filter:'highpass'}); this.tone({f0:340, f1:780, dur:0.10, vol:0.10, type:'triangle'}); break;
      case 'graze': this.tone({f0:1250, f1:1850, dur:0.035, vol:0.028, type:'sine'}); break;
      case 'over': this.tone({f0:660, f1:120, dur:1.0, vol:0.20, type:'sawtooth'}); this.noise({f0:700, f1:90, dur:0.8, vol:0.14, filter:'lowpass'}); break;
      case 'ui': this.tone({f0:620, f1:880, dur:0.05, vol:0.08, type:'square'}); break;
      case 'break': this.tone({f0:130, f1:55, dur:0.12, vol:0.16, type:'square'}); this.noise({f0:800, f1:250, dur:0.1, vol:0.12}); break;
      case 'spawn': this.tone({f0:330, f1:660, dur:0.10, vol:0.04, type:'triangle'}); break;
      case 'milestone': this.tone({f0:520, f1:1040, dur:0.14, vol:0.08, type:'triangle'}); this.tone({f0:780, f1:1560, dur:0.12, vol:0.06, type:'triangle', delay:0.1}); break;
    }
  },
  updateMusic(dt){
    if(!this.ctx || this.muted || game.state !== 'playing') return;
    this.musicTimer -= dt;
    if(this.musicTimer <= 0){
      this.musicTimer = 0.245;
      this.musicStep++;
      const bar = Math.floor(this.musicStep / 8) % 4;
      const bass = [55,55,65.4,49][bar];
      if(this.musicStep % 8 === 0) this.tone({f0:bass, f1:bass*0.98, dur:0.5, vol:0.18, type:'triangle'});
      const scale = [220,261.6,329.6,392,440,523.3];
      const f = scale[Math.floor(this.musicStep*7)%scale.length] * (this.musicStep%3===0?2:1);
      this.tone({f0:f, f1:f, dur:0.09, vol:0.045, type:'square'});
      if(this.musicStep % 16 === 4) this.noise({f0:4000, f1:1200, dur:0.05, vol:0.025, filter:'highpass'});
    }
  }
};

/* ---------------- 发光精灵 ---------------- */
const glowSprites = {};
function glowSprite(color){
  if(glowSprites[color]) return glowSprites[color];
  const s = document.createElement('canvas'); s.width = s.height = 64;
  const c = s.getContext('2d');
  const rgb = hexRGB(color);
  const g = c.createRadialGradient(32,32,0,32,32,32);
  g.addColorStop(0, `rgba(255,255,255,0.95)`);
  g.addColorStop(0.18, `rgba(${rgb.r},${rgb.g},${rgb.b},0.55)`);
  g.addColorStop(0.55, `rgba(${rgb.r},${rgb.g},${rgb.b},0.14)`);
  g.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
  c.fillStyle = g; c.fillRect(0,0,64,64);
  glowSprites[color] = s; return s;
}
function drawGlow(x,y,radius,color,alpha){
  alpha = alpha === undefined ? 1 : alpha;
  if(alpha <= 0.01 || radius <= 0.5) return;
  ctx.save();
  ctx.globalAlpha = clamp(alpha,0,1);
  ctx.globalCompositeOperation = 'lighter';
  const spr = glowSprite(color);
  ctx.drawImage(spr, x-radius*1.8, y-radius*1.8, radius*3.6, radius*3.6);
  ctx.restore();
}
function strokeShape(points,color,width){
  ctx.beginPath();
  ctx.moveTo(points[0],points[1]);
  for(let i=2;i<points.length;i+=2) ctx.lineTo(points[i],points[i+1]);
  ctx.closePath();
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
}
function fillShape(points,color){
  ctx.beginPath();
  ctx.moveTo(points[0],points[1]);
  for(let i=2;i<points.length;i+=2) ctx.lineTo(points[i],points[i+1]);
  ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
}

/* ---------------- 背景 ---------------- */
let bgCanvas = null;
function buildBackground(){
  bgCanvas = document.createElement('canvas');
  bgCanvas.width = WORLD_W; bgCanvas.height = WORLD_H;
  const c = bgCanvas.getContext('2d');
  const g = c.createRadialGradient(WORLD_W/2,WORLD_H/2,80,WORLD_W/2,WORLD_H/2,WORLD_W*0.65);
  g.addColorStop(0,'#0a1020'); g.addColorStop(1,'#04060d');
  c.fillStyle = g; c.fillRect(0,0,WORLD_W,WORLD_H);
  for(let i=0;i<130;i++){
    const x = Math.random()*WORLD_W, y = Math.random()*WORLD_H;
    const r = Math.random()*1.3 + 0.3;
    c.globalAlpha = 0.10 + Math.random()*0.4;
    c.fillStyle = Math.random()<0.7 ? '#9fd8ff' : '#ffffff';
    c.beginPath(); c.arc(x,y,r,0,TAU); c.fill();
  }
  c.globalAlpha = 0.05; c.strokeStyle = '#4d9fff'; c.lineWidth = 1;
  for(let x=48;x<WORLD_W;x+=48){ c.beginPath(); c.moveTo(x,0); c.lineTo(x,WORLD_H); c.stroke(); }
  for(let y=48;y<WORLD_H;y+=48){ c.beginPath(); c.moveTo(0,y); c.lineTo(WORLD_W,y); c.stroke(); }
  c.globalAlpha = 1;
}
