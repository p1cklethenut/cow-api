const express = require("express");
const fs = require("fs");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const url = "https://script.google.com/macros/s/AKfycbwEt02re6ab7g043yEfNUgysvDacJtcPOAoNa1-v1EVbrVyC0fiohjy3CrqoaR40UqNdg/exec"
// Serve static files (replace with your actual path)
app.get("/", (req, res) => {
  res.sendFile("/cow/index.html", { root: __dirname });
});

app.get("/script.js", (req, res) => {
  res.sendFile(__dirname + "/cow/script.js");
});



app.post("/cowtubeapi",(req,res) =>{
  ytapi(req, res);
})


app.get("/rollcow",(req,res) =>{
    let rolls = []
    for(let i = 0; i < 10; i++){
      rolls.push(rollcow())
    }
    res.send(rolls)
})

app.get('/cowcur.png',(req,res) =>{
  
  res.sendFile(__dirname+"/cowcur.png")
})

app.get('/cronjob',(req,res) =>{
  saveData()
  res.send("croned")
})

function saveData(){
  let data = JSON.parse(fs.readFileSync("./data.json"))
  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
  .then((response) => {
    // Handle the API response here
    console.log("saved")
  })
  .catch((error) => {
    console.error("Error fetching data:", error);
  });
}

io.on("connection", (socket) => {
  let socketid = socket.id;
  // Send initial content to the client when connected

  // Listen for 'edit' events from the client
  socket.on("id", (data) => {
    console.log("ided:"+data);
    let id = data;
    let json = require("./data.json");
    if (!id||json.users[id]===undefined) {
      let isdupe = true;
      while (isdupe) {
        id = Math.floor(10000000 + Math.random() * 90000000).toString();
        if (!Object.keys(json.users).includes(id)) {
          isdupe = false;
        }
      }
      json.users[id] = 0;
      fs.writeFileSync(__dirname + "/data.json", JSON.stringify(json));
      console.log("created: "+id)
    }
    let total = json.clicks;
    let self = json.users[id];
    io.to(socketid).emit("number", { total: total, self: self, id: id });
  });

  socket.on("clicked", (data) => {
    console.log("clicked: "+data);
    let id = data;

    let json = require("./data.json");
    if (!Object.keys(json.users).includes(id)) {
      let isdupe = true;
      while (isdupe) {
        id = Math.floor(10000000 + Math.random() * 90000000).toString();
        if (!Object.keys(json.users).includes(id)) {
          isdupe = false;
        }
      }
      json.users[id] = 0;
    }
    json.clicks += 1;
    json.users[id] += 1;
    fs.writeFileSync(__dirname + "/data.json", JSON.stringify(json));

    let total = json.clicks;
    let self = json.users[id];
    io.to(socketid).emit("number", { total: total,self:self,id:id });
    io.emit("total", { total: total});
  });
});


function getTotalWeight(){
  const data = require('./rolls.json')
  let total = 0
  for(let indexofdata = 0; indexofdata < data.length; indexofdata++){
    total += data[indexofdata].weight
  }
  return total
}

function rollcow(){
  let totalweight = getTotalWeight()
  let roll = Math.floor(Math.random() * totalweight)
  let data = require('./rolls.json')
  let cow = data[0]
  for(let indexofdata = 0; indexofdata < data.length;indexofdata++){
    if(roll < data[indexofdata].weight){
      cow = data[indexofdata]
      break
    }
    roll -= data[indexofdata].weight
  }
  return cow.name
}

function ytapi(req, res) {
  let q = req.body.q;
  if (!q) {
    q = "cow";
  }
  //variable for your API_KEY
  const YOUTUBE_API_KEY = process.env.ytapi;
  //url from YouTube docs modified for my random term and API key,
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=100&q=${encodeURIComponent(q)}&key=${YOUTUBE_API_KEY}`;
  //fetch function following the aforementioned process
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      let i = 0;
      let item = data.items[Math.floor(Math.random() * data.items.length)];
      while (
        item.snippet.title.includes("#shorts") ||
        item.snippet.description.includes("#shorts")
      ) {
        item = data.items[Math.floor(Math.random() * data.items.length)];
        i++;
        if (i > 100) {
          break;
        }
      }
      res.send(JSON.stringify({ id: item.id.videoId, data: item }));
    });
}

if(true){
  
  fetch(url
  )
  .then((response) => response.json())
  .then((data) => {
    fs.writeFileSync(__dirname+"/data.json",data)
    console.log("got data")
    http.listen( process.env.PORT || 3001, () => {
      console.log("Server listening on port 3000");
    });
  })
  .catch((error) => {
    console.error("Error fetching data:", error);
  });
}


