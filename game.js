'use strict';
const cv=document.getElementById('gc'),cx=cv.getContext('2d'),W=800,H=416,TS=32;
const AIR=0,GND=1,BRK=2,QB=3,QBM=4,PTL=5,PTR=6,PBL=7,PBR=8,CT=9,USED=10;
const SOLID=new Set([GND,BRK,QB,QBM,PTL,PTR,PBL,PBR,USED]);
function mkRow(base,...p){const r=Array(80).fill(base);for(let i=0;i<p.length;i+=2)r[p[i]]=p[i+1];return r;}
function gRow(...pipes){const r=Array(80).fill(GND);pipes.forEach(c=>{r[c]=PBL;r[c+1]=PBR;});return r;}
const MAP=[
  mkRow(0),mkRow(0),mkRow(0),mkRow(0),mkRow(0),
  mkRow(0,11,QB,12,BRK,13,QB,14,BRK,15,QB,20,QB,21,BRK,22,QBM,23,BRK,56,QB,57,BRK,58,QB),
  mkRow(0,11,CT,12,CT,13,CT),
  mkRow(0,40,BRK,41,BRK,42,QBM,43,BRK),
  mkRow(0),mkRow(0),
  mkRow(0,5,PTL,6,PTR,14,PTL,15,PTR,28,PTL,29,PTR,43,PTL,44,PTR),
  gRow(5,14,28,43),
  Array(80).fill(GND)
];
const GINIT=[{tx:9},{tx:18},{tx:25},{tx:33},{tx:47},{tx:52},{tx:62}];
function tAt(c,r){if(r<0)return AIR;if(r>=MAP.length)return GND;if(c<0||c>=80)return AIR;return MAP[r][c];}
function setT(c,r,v){if(r>=0&&r<MAP.length&&c>=0&&c<80)MAP[r][c]=v;}
function solid(c,r){return SOLID.has(tAt(c,r));}
const K={};
document.addEventListener('keydown',e=>{K[e.code]=1;['ArrowLeft','ArrowRight','ArrowUp','Space','ArrowDown'].includes(e.code)&&e.preventDefault();if(e.code==='KeyP'&&G.state==='play'){G.state='pause';showOv('PAUSED','Press P to resume','▶ Resume',()=>{G.state='play';hideOv();});}});
document.addEventListener('keyup',e=>{K[e.code]=0;});
function pr(...c){return c.some(x=>K[x]);}
const G={state:'menu',score:0,coins:0,lives:3,time:400,camX:0,particles:[],mushrooms:[]};
const M={x:80,y:10*TS,vx:0,vy:0,w:22,h:28,big:false,inv:0,onGnd:false,jHeld:0,left:false,dead:false,dTimer:0,dVy:0,won:false,wonTimer:0};
let goombas=[];
function spawnLevel(){
  goombas=GINIT.map(g=>({x:g.tx*TS+4,y:10*TS,vx:-1.2,vy:0,onGnd:false,dead:false,squish:0,dTimer:0}));
  G.particles=[];G.mushrooms=[];G.camX=0;G.time=400;
  M.x=64;M.y=10*TS;M.vx=0;M.vy=0;M.big=false;M.inv=0;M.onGnd=false;M.dead=false;M.won=false;M.left=false;
  // restore coin tiles
  MAP[6][11]=CT;MAP[6][12]=CT;MAP[6][13]=CT;
  [11,12,13,14,15,20,21,22,23,56,57,58].forEach(c=>{ if(MAP[5][c]===USED)MAP[5][c]=QB; });
  [40,41,42,43].forEach(c=>{ if(MAP[7][c]===USED)MAP[7][c]=BRK; });
}
function r(x,y,w,h,col){cx.fillStyle=col;cx.fillRect(x,y,w,h);}
function drawBG(){
  const g=cx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#5C94FC');g.addColorStop(1,'#87BFFF');
  cx.fillStyle=g;cx.fillRect(0,0,W,H);
  cx.fillStyle='rgba(255,255,255,0.9)';
  [[60,55],[220,45],[400,60],[580,50],[740,58]].forEach(([bx,by])=>{
    const dx=((bx-G.camX*0.3)%1200+1200)%1200-100;
    cx.beginPath();cx.arc(dx+20,by,14,0,Math.PI*2);cx.arc(dx+40,by-8,18,0,Math.PI*2);cx.arc(dx+60,by,14,0,Math.PI*2);cx.fill();cx.fillRect(dx+6,by,68,14);
  });
  cx.fillStyle='#00A800';
  [[0,H-55,65],[250,H-48,52],[480,H-58,78]].forEach(([hx,hy,hr])=>{
    const dx=((hx-G.camX*0.5)%1400+1400)%1400-200;
    cx.beginPath();cx.arc(dx,hy,hr,Math.PI,0);cx.fill();
  });
}
function drawTile(t,sx,sy){
  const s=TS;
  if(t===GND||t===PBL||t===PBR){
    r(sx,sy,s,s,'#C84C0C');r(sx,sy,s,2,'#E06010');r(sx,sy,2,s,'#E06010');r(sx,sy+s-2,s,2,'#8B2800');r(sx+s-2,sy,2,s,'#8B2800');
    cx.strokeStyle='rgba(0,0,0,0.12)';cx.lineWidth=1;cx.strokeRect(sx+.5,sy+.5,s-1,s-1);
  }else if(t===BRK){
    r(sx,sy,s,s,'#C86428');r(sx,sy,s,2,'#E07840');r(sx,sy,2,s,'#E07840');r(sx,sy+s-2,s,2,'#8B3C00');
    cx.strokeStyle='rgba(0,0,0,0.25)';cx.lineWidth=1;
    cx.strokeRect(sx+.5,sy+.5,s/2-.5,s/2-.5);cx.strokeRect(sx+s/2+.5,sy+.5,s/2-.5,s/2-.5);
    cx.strokeRect(sx+.5,sy+s/2+.5,s/2-.5,s/2-.5);cx.strokeRect(sx+s/2+.5,sy+s/2+.5,s/2-.5,s/2-.5);
  }else if(t===QB||t===QBM){
    const fl=(Date.now()/200|0)%2;
    r(sx,sy,s,s,fl?'#FFD700':'#E8C000');r(sx,sy,s,3,'#FFF8A0');r(sx,sy,3,s,'#FFF8A0');r(sx,sy+s-3,s,3,'#A08000');r(sx+s-3,sy,3,s,'#A08000');
    cx.fillStyle='#000';cx.font='bold 20px monospace';cx.textAlign='center';cx.textBaseline='middle';cx.fillText('?',sx+s/2,sy+s/2+1);
  }else if(t===USED){
    r(sx,sy,s,s,'#707070');r(sx,sy,s,2,'#909090');r(sx,sy,2,s,'#909090');r(sx,sy+s-2,s,2,'#404040');
  }else if(t===PTL||t===PTR){
    const lft=t===PTL;
    r(sx,sy,s,s,'#00A800');
    if(lft){r(sx,sy,s,5,'#00C800');r(sx,sy,4,s,'#00C000');}
    else{r(sx,sy,s,5,'#00C800');r(sx+s-4,sy,4,s,'#005000');}
  }else if(t===CT){
    const bob=Math.sin(Date.now()/300+sx)*3;
    cx.fillStyle='#FFD700';cx.beginPath();cx.ellipse(sx+s/2,sy+s/2+bob,7,10,0,0,Math.PI*2);cx.fill();
    cx.fillStyle='#FFF080';cx.beginPath();cx.ellipse(sx+s/2-2,sy+s/2+bob,2,7,0,0,Math.PI*2);cx.fill();
  }
}
function drawMario(sx,sy){
  if(M.inv>0&&(M.inv/4|0)%2)return;
  const p=(dx,dy,w,h,col)=>{cx.fillStyle=col;cx.fillRect(M.left?sx+(22-dx-w):sx+dx,sy+dy,w,h);};
  if(!M.big){
    p(6,0,12,6,'#CC0000');p(3,4,20,3,'#CC0000');p(4,6,16,8,'#FFCC88');p(3,9,6,3,'#663300');p(13,9,6,3,'#663300');p(8,7,3,3,'#332200');p(13,7,3,3,'#332200');p(1,14,22,10,'#CC0000');p(0,14,4,6,'#FFCC88');p(18,14,4,6,'#FFCC88');p(2,24,8,4,'#0044CC');p(14,24,8,4,'#0044CC');p(0,26,11,5,'#663300');p(13,26,11,5,'#663300');
  }else{
    p(5,0,14,8,'#CC0000');p(3,6,20,4,'#CC0000');p(3,10,18,10,'#FFCC88');p(3,14,6,4,'#663300');p(13,14,6,4,'#663300');p(7,11,4,4,'#332200');p(13,11,4,4,'#332200');p(1,20,22,14,'#CC0000');p(0,20,4,8,'#FFCC88');p(20,20,4,8,'#FFCC88');p(2,34,8,6,'#0044CC');p(14,34,8,6,'#0044CC');p(2,40,8,8,'#0044CC');p(14,40,8,8,'#0044CC');p(0,44,11,6,'#663300');p(13,44,11,6,'#663300');
  }
}
function drawGoomba(g,sx,sy){
  const sq=g.squish>0,h=sq?12:28,yo=sq?16:0;
  r(sx+2,sy+yo,26,h,'#8B4513');r(sx+2,sy+yo,26,h*0.35|0,'#5C2D0A');
  if(!sq){r(sx+5,sy+12,7,7,'#FFCC88');r(sx+18,sy+12,7,7,'#FFCC88');r(sx+6,sy+14,3,3,'#000');r(sx+19,sy+14,3,3,'#000');r(sx+4,sy+20,10,5,'#663300');r(sx+16,sy+20,10,5,'#663300');}
}
function drawMushroom(m,sx,sy){
  r(sx+4,sy+14,20,14,'#FFCC88');r(sx,sy+4,28,18,'#CC0000');r(sx+6,sy,16,8,'#CC0000');
  r(sx+4,sy+6,6,6,'#fff');r(sx+18,sy+6,6,6,'#fff');
}
function hitBlock(col,row,type){
  if(type===QB){setT(col,row,USED);addScore(200);spawnCoinPop(col*TS+TS/2,row*TS);addCoin();spark(col*TS+TS/2,row*TS,'#FFD700');}
  else if(type===QBM){setT(col,row,USED);spawnMushroom(col*TS,row*TS-TS);}
  else if(type===BRK){if(M.big){setT(col,row,AIR);addScore(50);spark(col*TS+TS/2,row*TS+TS/2,'#C86428');}else{addScore(10);}}
}
let coinPops=[];
function spawnCoinPop(x,y){coinPops.push({x,y,vy:-8,life:40});}
function spawnMushroom(x,y){G.mushrooms.push({x,y,vx:1,vy:0,onGnd:false});}
function addScore(v){G.score=Math.min(999999,G.score+v);updateHUD();}
function addCoin(){G.coins++;addScore(100);updateHUD();}
function spark(x,y,col){for(let i=0;i<8;i++){const a=Math.random()*Math.PI*2,s=2+Math.random()*4;G.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,life:30,col});}}
function updateHUD(){
  document.getElementById('hScore').textContent=String(G.score).padStart(6,'0');
  document.getElementById('hCoins').textContent='×'+String(G.coins).padStart(2,'0');
  document.getElementById('hLives').textContent='♥ '+G.lives;
  document.getElementById('hTime').textContent=Math.ceil(G.time);
}
let _oa=null;
function showOv(t,m,b,fn){_oa=fn;document.getElementById('overlayTitle').textContent=t;document.getElementById('overlayMsg').textContent=m;document.getElementById('overlayBtn').textContent=b;document.getElementById('overlay').classList.remove('hidden');}
function hideOv(){document.getElementById('overlay').classList.add('hidden');}
window.overlayAction=()=>{if(_oa)_oa();};
function physicsMario(dt){
  const run=pr('KeyX','ShiftLeft','ShiftRight');
  const spd=run?4.8:2.8;
  if(pr('ArrowLeft','KeyA')){M.vx=Math.max(M.vx-0.5,-spd);M.left=true;}
  else if(pr('ArrowRight','KeyD')){M.vx=Math.min(M.vx+0.5,spd);M.left=false;}
  else{M.vx*=0.82;}
  const wantJump=pr('ArrowUp','KeyZ','Space');
  if(wantJump&&M.onGnd){M.vy=-12.5;M.jHeld=12;M.onGnd=false;}
  if(wantJump&&M.jHeld>0){M.vy-=0.4;M.jHeld--;}
  else{M.jHeld=0;}
  M.vy=Math.min(M.vy+0.55,16);
  // horizontal move + collision
  M.x+=M.vx;
  const mh=M.big?52:28,mw=M.w;
  let cx0=M.x/TS|0, cx1=(M.x+mw-1)/TS|0;
  let ry0=M.y/TS|0, ry1=(M.y+mh-1)/TS|0;
  for(let rr=ry0;rr<=ry1;rr++){
    if(M.vx>0&&solid(cx1,rr)){M.x=cx1*TS-mw;M.vx=0;break;}
    if(M.vx<0&&solid(cx0,rr)){M.x=(cx0+1)*TS;M.vx=0;break;}
  }
  if(M.x<0)M.x=0;
  // vertical move + collision
  M.y+=M.vy;M.onGnd=false;
  cx0=M.x/TS|0;cx1=(M.x+mw-1)/TS|0;
  ry0=M.y/TS|0;ry1=(M.y+mh-1)/TS|0;
  for(let cc=cx0;cc<=cx1;cc++){
    if(M.vy>0&&solid(cc,ry1)){M.y=ry1*TS-mh;M.vy=0;M.onGnd=true;break;}
    if(M.vy<0&&solid(cc,ry0)){
      const t2=tAt(cc,ry0);
      hitBlock(cc,ry0,t2);
      M.y=(ry0+1)*TS;M.vy=0;break;
    }
  }
  // collect coin tiles
  for(let rr=ry0;rr<=ry1;rr++){for(let cc=cx0;cc<=cx1;cc++){if(tAt(cc,rr)===CT){setT(cc,rr,AIR);addCoin();spark(cc*TS+TS/2,rr*TS+TS/2,'#FFD700');}}}
  // camera
  G.camX=Math.max(0,Math.min(M.x-W/2+TS,80*TS-W));
  // death by pit
  if(M.y>H+60)killMario();
}
function physicsGoombas(){
  goombas.forEach(g=>{
    if(g.dead){g.dTimer--;return;}
    g.vy=Math.min(g.vy+0.55,16);
    g.x+=g.vx;
    let gc0=g.x/TS|0,gc1=(g.x+28)/TS|0,gr0=g.y/TS|0,gr1=(g.y+28)/TS|0;
    if(g.vx<0&&solid(gc0,gr0)&&solid(gc0,gr1)){g.x=(gc0+1)*TS;g.vx*=-1;}
    if(g.vx>0&&solid(gc1,gr0)&&solid(gc1,gr1)){g.x=gc1*TS-28;g.vx*=-1;}
    g.y+=g.vy;g.onGnd=false;
    gc0=g.x/TS|0;gc1=(g.x+28)/TS|0;gr1=(g.y+28)/TS|0;
    if(solid(gc0,gr1)||solid(gc1,gr1)){g.y=gr1*TS-28;g.vy=0;g.onGnd=true;}
    if(g.y>H+60)g.dead=true;
    // check ledge (turn around)
    const ahead=g.vx>0?gc1+1:gc0-1;
    if(g.onGnd&&!solid(ahead,gr1+1)){g.vx*=-1;}
    // collide mario
    if(!M.dead&&!M.won&&M.inv<=0){
      const mx=M.x,my=M.y,mh=M.big?52:28;
      const ox=Math.min(mx+M.w,g.x+28)-Math.max(mx,g.x);
      const oy=Math.min(my+mh,g.y+28)-Math.max(my,g.y);
      if(ox>0&&oy>0){
        if(M.vy>0&&my+mh-M.vy<=g.y+4){
          g.squish=1;g.dead=true;g.dTimer=30;M.vy=-7;addScore(100);spark(g.x+14,g.y,'#8B4513');
        }else{
          if(M.big){M.big=false;M.h=28;M.inv=120;addScore(0);}
          else killMario();
        }
      }
    }
  });
}
function physicsMushrooms(){
  G.mushrooms.forEach(m=>{
    m.vy=Math.min(m.vy+0.55,16);m.x+=m.vx;
    let mc0=m.x/TS|0,mc1=(m.x+28)/TS|0,mr0=m.y/TS|0,mr1=(m.y+28)/TS|0;
    if(solid(mc0,mr0)||solid(mc1,mr0)){m.vx*=-1;}
    if(solid(mc0,mr1)||solid(mc1,mr1)){m.y=mr1*TS-28;m.vy=0;m.onGnd=true;}else{m.onGnd=false;}
    m.y+=m.vy;
    // collect
    if(!M.dead){
      const ox=Math.min(M.x+M.w,m.x+28)-Math.max(M.x,m.x);
      const oy=Math.min(M.y+(M.big?52:28),m.y+28)-Math.max(M.y,m.y);
      if(ox>4&&oy>4){m.collected=true;M.big=true;M.h=52;M.inv=90;addScore(1000);spark(m.x+14,m.y,'#CC0000');}
    }
  });
  G.mushrooms=G.mushrooms.filter(m=>!m.collected&&m.y<H+60);
}
function killMario(){
  if(M.dead||M.inv>0)return;
  M.dead=true;M.dTimer=80;M.dVy=-12;G.lives--;updateHUD();
}
function updateDead(){
  M.dVy+=0.4;M.y+=M.dVy;M.dTimer--;
  if(M.dTimer<=0){
    if(G.lives>0){spawnLevel();G.state='play';}
    else{G.state='over';showOv('GAME OVER','Your adventure ends here.\nFinal Score: '+G.score,'▶ Play Again',()=>{G.score=0;G.coins=0;G.lives=3;updateHUD();spawnLevel();G.state='play';hideOv();});}
  }
}
function checkWin(){if(M.x>78*TS){M.won=true;M.wonTimer=180;}}
function updateWin(){
  M.wonTimer--;
  if(M.wonTimer<=0){G.state='win';showOv('🎉 YOU WIN!','World 1-1 Complete!\nScore: '+G.score,'▶ Play Again',()=>{G.score=0;G.coins=0;G.lives=3;updateHUD();spawnLevel();G.state='play';hideOv();});}
}
function drawAll(){
  drawBG();
  const startC=Math.max(0,G.camX/TS|0),endC=Math.min(79,(G.camX+W)/TS+1|0);
  for(let row=0;row<MAP.length;row++){
    for(let col=startC;col<=endC;col++){
      const t=tAt(col,row);if(t===AIR)continue;
      drawTile(t,col*TS-G.camX,row*TS);
    }
  }
  // mushrooms
  G.mushrooms.forEach(m=>drawMushroom(m,m.x-G.camX,m.y));
  // coin pops
  coinPops.forEach(cp=>{
    cx.fillStyle='#FFD700';cx.font='bold 14px monospace';cx.textAlign='center';
    cx.fillText('+200',cp.x-G.camX,cp.y);
  });
  // goombas
  goombas.filter(g=>!g.dead||g.dTimer>0).forEach(g=>{
    const sx=g.x-G.camX;if(sx>-32&&sx<W+32)drawGoomba(g,sx,g.y);
  });
  // mario
  const msx=M.x-G.camX,msy=M.y;
  if(!M.dead)drawMario(msx,msy);
  else{cx.fillStyle='#CC0000';cx.beginPath();cx.arc(msx+11,msy+14,14,0,Math.PI*2);cx.fill();}
  // particles
  G.particles.forEach(p=>{
    const a=p.life/30;cx.globalAlpha=a;r(p.x-G.camX-3,p.y-3,6,6,p.col);cx.globalAlpha=1;
  });
  // end flag area hint
  const fx=78*TS-G.camX;if(fx>0&&fx<W){r(fx+14,0,4,H,'#aaa');r(fx,0,32,10,'#0a0');}
}
function update(){
  G.particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.2;p.life--;});
  G.particles=G.particles.filter(p=>p.life>0);
  coinPops.forEach(p=>{p.y+=p.vy;p.vy+=0.3;p.life--;});
  coinPops=coinPops.filter(p=>p.life>0);
  if(G.state!=='play')return;
  G.time=Math.max(0,G.time-1/60);updateHUD();
  if(G.time<=0)killMario();
  if(M.dead){updateDead();return;}
  if(M.won){updateWin();return;}
  if(M.inv>0)M.inv--;
  physicsMario();physicsGoombas();physicsMushrooms();
  checkWin();
}
function drawMenu(){
  drawBG();
  cx.fillStyle='rgba(0,0,0,0.55)';cx.fillRect(0,0,W,H);
  cx.fillStyle='#FFD700';cx.font='bold 28px "Press Start 2P"';cx.textAlign='center';cx.fillText('SUPER MARIO BROS',W/2,120);
  cx.fillStyle='#fff';cx.font='13px "Press Start 2P"';cx.fillText('NimbuPlay Cloud Gaming',W/2,165);
  const blink=(Date.now()/500|0)%2;
  if(blink){cx.fillStyle='#fff';cx.font='12px "Press Start 2P"';cx.fillText('PRESS  SPACE  TO  START',W/2,260);}
  cx.font='10px "Press Start 2P"';cx.fillStyle='#aaa';
  cx.fillText('← → Move    Z/Space Jump    X Run    P Pause',W/2,320);
  // draw mini mario in center
  cx.save();cx.translate(W/2-11,200);drawMario(0,0);cx.restore();
}
function loop(){
  requestAnimationFrame(loop);
  if(G.state==='menu'){
    drawMenu();
    if(pr('Space','KeyZ','Enter')){spawnLevel();G.state='play';hideOv();}
    return;
  }
  update();drawAll();
}
loop();
