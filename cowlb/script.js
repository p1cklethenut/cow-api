const socket = io();

const placementlabel = document.getElementById("placement");
const uuidlabel = document.getElementById("uuid");
const list = document.getElementById("lbl");
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
function getLb(){
  socket.emit("getlb")
  //return {pos:2,id:"1",lb:[{id:"1",cows:23424},{id:"2",cows:23424}]}
}

function format(lb,id){
  let html = ""
  for(let i=0;i<lb.length;i++){
    if(lb[i].id == id){

      html += `<li class="list-group-item active">uuid: ${lb[i].id} - ${lb[i].cows} cows</li>`

      continue
    }
    html += `<li class="list-group-item">uuid:${lb[i].id} - ${lb[i].cows}cows</li>`
    
  }
  return html
}

function getPos(lb,id){
  for(let i=0;i<lb.length;i++){
    if(lb[i].id == id){
      return i+1
    }
  }
  return "unknown"
}

async function main(data){
  let lb = data
  let id = getId()
  if(lb){
    placementlabel.innerHTML = `Leaderboard Position: ${getPos(lb,id)}`
    uuidlabel.innerHTML = `uuid: ${id}`
    
    list.innerHTML = await format(lb,id)
  }
}
console.log(1)
getLb()
socket.on("lb",(data)=>{
  main(data)

})
