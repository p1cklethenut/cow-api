const express = require("express");
const fs = require("fs");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const url = "https://script.google.com/macros/s/AKfycbwEt02re6ab7g043yEfNUgysvDacJtcPOAoNa1-v1EVbrVyC0fiohjy3CrqoaR40UqNdg/exec"
// Serve static files (replace with your actual path)
app.get("/", (req, res) => {
  res.sendFile("/index.html", { root: __dirname });
});

app.get("/script.js", (req, res) => {
  res.sendFile(__dirname + "/script.js");
});

app.get("/style.css", (req, res) => {
  res.sendFile(__dirname + "/style.css");
});

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
  // Send initial content to the client when connected

  // Listen for 'edit' events from the client
  socket.on("id", (data) => {
    console.log("ided");
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
    }
    let total = json.clicks;
    let self = json.users[id];
    io.emit("number", { total: total, self: self, id: id });
  });

  socket.on("clicked", (data) => {
    console.log("clicked");
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
    io.emit("number", { total: total, self: self, id: id });
  });
});

if(true){
  
  fetch(url
  )
  .then((response) => response.json())
  .then((data) => {
    fs.writeFileSync(__dirname+"/data.json",data)
    console.log("got data")
    http.listen(3000, () => {
      console.log("Server listening on port 3000");
    });
  })
  .catch((error) => {
    console.error("Error fetching data:", error);
  });
}

