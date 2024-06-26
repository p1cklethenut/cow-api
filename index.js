const express = require("express");
const fs = require("fs");
const { connect } = require("http2");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const url = process.env["db"];
let connections = {}; //to track and update clients

app.get("/*", (req, res) => {
  switch(req.url){
    case("/"):
      res.sendFile(__dirname + "/cow/index.html");
      break;

    case("/script.js"):
      res.sendFile(__dirname + "/cow/script.js");
      break;

    case("/cow.png"):
      res.sendFile(__dirname + `/cow/cow${Math.floor(Math.random() * 1)}.png`);
      break;

    case("/rollcow"):
      let rolls = [];
      for (let i = 0; i < 10; i++) {
        rolls.push(rollcow());
      }
      res.send(rolls);
      break;
      
    case("/cowcur.png"):
      res.sendFile(__dirname + "/cowcur.png");
      break;
      
    case("/cronjob"):
      //keeping server alive + saving data to Db
      saveData();
      res.send("croned");
      break;
    case("/404/style.css"):
      res.sendFile(__dirname + "/404page/style.css");
      break;
    case("/404/bg.jpg"):
      res.sendFile(__dirname + "/404page/cowbg.jpg");
      break;
    default:
      res.sendFile(__dirname + "/404page/index.html");
  }  
})

app.post("/*", (req, res) => {
  switch(req.url){
    case("/cowtubeapi"):
      ytapi(req, res);
      break;
    default:
      res.send("404")
  }
});



//Function to POST clicks data to a url endpoint:
function saveData() {
  let data = JSON.parse(fs.readFileSync("./data.json"));
  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      // Handle the API response here
      //console.log("Server Data Backed up.")
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
    });
}

//setup socket.io server
function socketSetup() {
  io.on("connection", (socket) => {
    let socket_client_id = socket.id;
    // Send initial content to the client when connected
    let connection_client_id;

    socket.on("disconnect", (reason) => {
      // ...
      //console.log(reason)
      /*
      console.log(connection_client_id)
      console.log(connections)
      console.log(connections[connection_client_id])
      console.log(socket_client_id)
      */
      if (!connection_client_id) {
        console.log("no id");
        return;
      }
      if (connections[connection_client_id].includes(socket_client_id)) {
        connections[connection_client_id].splice(
          connections[connection_client_id].indexOf(socket_client_id),
          1,
        );
        //console.log(`connections: ${JSON.stringify(connections)}`)
        console.log(`client ${connection_client_id} disconnected`);

        if (connections[connection_client_id].length == 0) {
          delete connections[connection_client_id];
        }
        let totalclients = 0;
        for (const id in connections) {
          totalclients += connections[id].length;
          if (connections[id].length == 0) {
            delete connections[id];
          }
        }
        console.log(`clients connected: ${totalclients}`);
      }
    });

    socket.on("id", (data) => {
      //console.log("ided:"+data);
      let id = data;
      let json = require("./data.json");
      if (!id || json.users[id] === undefined) {
        let isdupe = true;
        while (isdupe) {
          id = Math.floor(10000000 + Math.random() * 90000000).toString();
          if (!Object.keys(json.users).includes(id)) {
            isdupe = false;
          }
        }
        json.users[id] = 0;
        fs.writeFileSync(__dirname + "/data.json", JSON.stringify(json));
        //console.log("created: "+id)
      }
      let total = json.clicks;
      let self = json.users[id];
      io.to(socket_client_id).emit("number", {
        total: total,
        self: self,
        id: id,
      });
      let leaderboardpos = getPlacement(id,json.users);
      io.to(socket_client_id).emit("leaderboard", {
        lb: leaderboardpos,
      })
      if (connections[id]) {
        if (!connections[id].includes(socket_client_id)) {
          connections[id].push(socket_client_id);
        }
      } else {
        connections[id] = [socket_client_id];
      }
      connection_client_id = id;
      console.log(`connections: ${JSON.stringify(connections)}`);
    });

    socket.on("clicked", (data) => {
      //console.log("clicked: "+JSON.stringify(data));
      let id = data.id;
      let clicks = data.clicks;

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
      json.clicks += clicks;
      json.users[id] += clicks;
      fs.writeFileSync(__dirname + "/data.json", JSON.stringify(json));

      let total = json.clicks;
      let self = json.users[id];
      for (let i = 0; i < connections[i].length; i++) {
        io.to(connections[id][i]).emit("number", {
          total: total,
          self: self,
          id: id,
        });
      }
      connection_client_id = id;
    });
  });
}

//Function to get placement of user by id
function getPlacement(id,users){

  const obj = users;
  const sortedinorder = Object.fromEntries( Object.entries(obj).sort((a, b) => b[1] -a[1]) );
  for(let i=0; i<Object.keys(sortedinorder).length;i++){
    if(sortedinorder[Object.keys(sortedinorder)[i]]==users[id]){
      return i+1
    }
  }
}

//Function to update Total cow count globally (setInterval(this))
function updateTotalGlobal() {
  clearEmpt()
  if (Object.keys(connections).length == 0) {
    return;
  }

  const json = require("./data.json");
  const totalclicks = json.clicks;
  io.emit("total", { total: totalclicks });

  //also
}

function clearEmpt(){
  let json = require("./data.json");
  let newusers= {};
  for(const id in json.users){
    //console.log(id)
    //console.log(json.users[id])

    if(json.users[id]>0||Object.keys(connections).includes(id)){
      newusers[id] = json.users[id]
    }
  }
  
  json.users = newusers;
  fs.writeFileSync(__dirname + "/data.json", JSON.stringify(json));
}

//Function to roll a cow drop. Deps: getTotalWeight(), ./rolls.json:
function rollcow() {
  //Function to get weight to randomize cow drops:
  function getTotalWeight() {
    const data = require("./rolls.json");
    let total = 0;
    for (let indexofdata = 0; indexofdata < data.length; indexofdata++) {
      total += data[indexofdata].weight;
    }
    return total;
  }

  let totalweight = getTotalWeight();
  let roll = Math.floor(Math.random() * totalweight);
  let data = require("./rolls.json");
  let cow = data[0];
  for (let indexofdata = 0; indexofdata < data.length; indexofdata++) {
    if (roll < data[indexofdata].weight) {
      cow = data[indexofdata];
      break;
    }
    roll -= data[indexofdata].weight;
  }
  return cow.name;
}

//Function to randomize a youtube video based on a search query, uses "cow" if input is undefined:
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

//---------------------------------------------------------------------------------//
//main entrypoint:
function main() {
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      fs.writeFileSync(__dirname + "/data.json", data);
      console.log("got data");
      http.listen(process.env.PORT || 3001, () => {
        console.log("Server listening on port " + process.env.PORT || 3001);
        setInterval(updateTotalGlobal, 1000); // updating total cow count every second
        socketSetup();
      });
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
    });
}

main();
