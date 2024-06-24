const socket = io();
const number = document.getElementById("num");
const self = document.getElementById("selfnum");

console.log(1)
let selfid;

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

socket.on("connect", (data) => {
  socket.emit("id", getId());
  
})

socket.on("number", (data) => {
  console.log(data)
  number.innerHTML = "Total Cows: "+data.total;
  self.innerHTML = "Your contribution: "+data.self
  localStorage.setItem('id',data.id)
  if(selfid != data.id){
    selfid = data.id
    document.getElementById('btn').onclick = () => {
      socket.emit("clicked", selfid);
    }
  }
});
  

