const socket = io();
const number = document.getElementById("num");
const self = document.getElementById("selfnum");
let clickbuffer=0;
let clicksendbuffer = 0;
//console.log(1)
let selfid;
let timelastclicked = 0;
let cowimgs = []
let width = 200;
let totalcows = 0;
let selfcows = 0;
let leaderboardpos;
function getId(){
  let id = localStorage.getItem("id")
  if(!id){
    return null
  }else{
    if(id.length==8){
      try {
        let parsedid = parseInt(id)
        if(parsedid>0){
          return id
        }else{
          return null
        }
      }catch (e){
        return null
      }
    }
  }
}


async function clicked(){
  //console.log("clicked")
  if(timelastclicked != undefined){
    if(timelastclicked+50 > Date.now()){
      //console.log(timelastclicked+50 < Date.now())
      return
    }
  }
  timelastclicked = Date.now()
  //console.log("registed")
  //const mooaudio = new Audio("/moo.mp3");


  clickbuffer += 1
  updatedisplay()
  
  const cowbtn = document.getElementById("cowbtn")
  //console.log((width *0.8).toFixed(0)+"px")
  cowbtn.style.width= (width *0.8).toFixed(0)+"px"

  let secs = 150
  let options = [1,2,3,5,10]
  let num = options[Math.floor(Math.random() * options.length)]
  for (let i = 0; i < num; i++){
    clickeffect(cowbtn)
    await sleep(secs/num)
  }
  cowbtn.style.width= width+"px"
}

function updatedisplay(){

  number.innerHTML = "Total Cows: "+(totalcows + clickbuffer+clicksendbuffer);
  if(leaderboardpos){
    self.innerHTML = "Your contributions: "+(selfcows + clickbuffer+clicksendbuffer) + `<br>Leaderboard Position: ${leaderboardpos}`;
  }else{
    self.innerHTML = "Your contributions: "+(selfcows + clickbuffer+clicksendbuffer);
  }
}

function generatecowimgid(){
  let id = Math.floor(Math.random() * 10000)
  while (cowimgs.includes(id)){
    id = Math.floor(Math.random() * 10000)
  }
  return id
}

async function clickeffect(cowbtn){
  let cowid = generatecowimgid();
  let element = `
  <div id="${await cowid}" class="cowparticle" style="
        left: ${Math.floor(Math.random()*80)}%;
        top:${Math.floor(Math.random()*80)}%;
        width:${Math.floor(Math.random()*10)+5}%;">
  <img src="/cow.png">
  </div>`


  cowbtn.innerHTML += element
  for(let i = 0; i < 25; i++){
    let cowparticle = document.getElementById(cowid)
    cowparticle.style.opacity = 1-(1/25*i)**2
    await sleep(1000/50)

  }
  let cowimg = document.getElementById(cowid)
  //console.log(cowimg)
  cowimg.remove()
}

async function sleep(ms){
  return new Promise((resolve)=>(setTimeout(()=>{resolve()},ms)))
}

socket.on("connect", (data) => {
  socket.emit("id", getId());
  
})

socket.on("total",(data)=>{


  totalcows = data.total
  updatedisplay()
})

socket.on("leaderboard",(data)=>{
  let pos = data.lb  
  leaderboardpos = pos
})

socket.on("number", (data) => {
  
  //console.log(data)
  clicksendbuffer = 0
  totalcows = data.total
  selfcows = data.self
  updatedisplay()
  localStorage.setItem('id',data.id)
  if(selfid != data.id){
    document.getElementById('uuid').innerHTML=`
    uuid: ${data.id}
    `
    selfid = data.id
    document.getElementById('cowbtn').onclick = clicked

  }
});
  
async function update(){
  if(clickbuffer>0){
    socket.emit("clicked",{id:getId(),clicks:clickbuffer})
    clicksendbuffer = clickbuffer;
    clickbuffer = 0;

  }
  await sleep(1000)
  update()
}
update()