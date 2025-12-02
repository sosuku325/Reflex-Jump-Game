const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d')
const scoreEl = document.getElementById('score');
const startOverlay = document.getElementById('startOverlay')
const gameOverOverlay = document.getElementById('gameOverOverlay');
const restartBtn  = document.getElementById('restartBtn')
const finalScore = document.getElementById('finalScore');

function fitCanvas(){
  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  canvas.width  = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr)
  ctx.setTransform(dpr,0,0,dpr,0,0)
}

canvas.style.height = '200px'

let running = false,
    isGameOver = false;
let score = 0;

const settings = {
  baseSpeed:8,
  gravity: .65,
  initialJump:-18,
  jumpHoldBoost:-.42,
  maxJumpHold:28
}

const player = {
  x:48, y:0,
  w:44, h:44,
  vy:0,
  grounded:false,
  jumpHoldRemaining:0
}

const groundY = 150;
let obstacles = []
let spawnTimer = 0
let lastTime = 0;
let speed = settings.baseSpeed


function startGame() {
  fitCanvas()
  obstacles = []
  spawnTimer = 0
  score = 0
  speed = settings.baseSpeed
  player.y = groundY - player.h
  player.vy = 0
  player.grounded = true
  player.jumpHoldRemaining = 0

  isGameOver = false
  running = true

  startOverlay.style.display = 'none'
  gameOverOverlay.style.display = 'none'
  scoreEl.textContent = 'SCORE: 0'

  lastTime = performance.now()
  requestAnimationFrame(loop)
}


function endGame(){
  running = false
  isGameOver = true;

  finalScore.textContent = '得点: ' + Math.floor(score)
  gameOverOverlay.style.display = 'flex'
}


function spawnObstacle(){
  const h = Math.random()>0.6 ? 44 : 28
  const w = Math.random()>0.6 ? 32 : 20
  const x = canvas.width/(window.devicePixelRatio||1)+40
  obstacles.push({x,y:groundY-h,w,h})
}


function doJump(){
  if(isGameOver) return
  if(!running) startGame()

  if(player.grounded){
    player.vy = settings.initialJump
    player.grounded = false
    player.jumpHoldRemaining = settings.maxJumpHold
  }
}


window.addEventListener('keydown', e=>{
  if(e.code==='Space' || e.code==='ArrowUp'){
    e.preventDefault()
    doJump()
  }
})

window.addEventListener('keyup', e=>{
  if(e.code==='Space' || e.code==='ArrowUp'){
    player.jumpHoldRemaining = 0
  }
})


canvas.addEventListener('touchstart', e=>{
  e.preventDefault()
  doJump()
})

canvas.addEventListener('mousedown', e=>{
  e.preventDefault()
  doJump()
})

startOverlay.addEventListener('click', ()=> startGame())
restartBtn.addEventListener('click', ()=> startGame())


function update(dt){
  if(player.jumpHoldRemaining>0){
    player.vy += settings.jumpHoldBoost
    player.jumpHoldRemaining--
  }

  player.vy += settings.gravity
  player.y  += player.vy

  if(player.y + player.h >= groundY){
    player.y = groundY - player.h
    player.vy = 0
    player.grounded = true
  }

  spawnTimer -= dt
  if(spawnTimer <= 0){
    spawnObstacle()
    spawnTimer = 600 + Math.random()*1200 - Math.min(Math.floor(score),700)
    if(spawnTimer < 320) spawnTimer = 320
  }

  for(let i = obstacles.length-1; i>=0; i--){
    obstacles[i].x -= speed
    if(obstacles[i].x + obstacles[i].w < -40)
      obstacles.splice(i,1)
  }

  for(const ob of obstacles){
    if(
      player.x < ob.x + ob.w &&
      player.x + player.w > ob.x &&
      player.y < ob.y + ob.h &&
      player.y + player.h > ob.y
    ){
      endGame()
    }
  }

  score += dt * 0.01
  scoreEl.textContent = 'SCORE: ' + Math.floor(score)

  speed = settings.baseSpeed + Math.floor(score / 80)
}


function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height)

  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(0,groundY,canvas.width,canvas.height-groundY)

  ctx.fillStyle = '#333'
  ctx.fillRect(player.x,player.y,player.w,player.h)

  ctx.fillStyle='#fff'
  ctx.fillRect(player.x+player.w-14, player.y+10, 6,6)

  const footOffset = (Math.floor(score/6)%2)*6
  ctx.fillRect(player.x+8,  player.y+player.h-6, 8,6)
  ctx.fillRect(player.x+24, player.y+player.h-6+footOffset, 8,6)

  for(const ob of obstacles){
    ctx.fillStyle = '#2b2b2b'
    ctx.fillRect(ob.x,ob.y,ob.w,ob.h)

    ctx.fillStyle='rgba(0,0,0,0.06)'
    ctx.fillRect(ob.x,ob.y+ob.h,ob.w,6)
  }

  for(let i=0;i<canvas.width;i+=28){
    ctx.fillStyle='rgba(0,0,0,0.02)'
    ctx.fillRect(i, groundY-2, 12,2)
  }
}


function loop(now){
  if(!running) return

  const dt = now - lastTime
  lastTime = now

  update(dt)
  draw()

  if(!isGameOver)
    requestAnimationFrame(loop)
}


window.addEventListener('resize', fitCanvas)
fitCanvas()

window.addEventListener('keydown', e=>{
  if(isGameOver && e.code==='Enter') startGame()
})
