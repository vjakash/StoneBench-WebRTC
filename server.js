const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000

app.use(express.static(__dirname + "/public"));
let peers = {};
let clients = 0;
io.on('connection', function(socket) {
    // console.log("sockets", socket.id);
    // console.log("connected:", socket.connected);
    // console.log("rooms:", socket.rooms);
    socket.on("NewClient", function(userName) {
        peers[socket.id] = userName;
        console.log(peers);
        if (clients < 2) {
            if (clients == 1) {
                this.emit('CreatePeer')
            }
        } else
            this.emit('SessionActive')
        clients++;
        console.log("count:" + clients);
    })
    socket.on('Offer', SendOffer)
    socket.on('Answer', SendAnswer)
    socket.on('disconnect', function Disconnect() {
        console.log(peers[socket.id] + " disconnected");
        if (clients > 0 && (peers[socket.id] != null || peers[socket.id] != undefined)) {
            if (clients <= 2)
                this.broadcast.emit("Disconnect", peers[socket.id]);
            clients--;
            delete peers[socket.id];
            console.log("count:" + clients);
        }
    })
    socket.on('connectUser', sendUserName)
})

// function Disconnect(socket) {
//     console.log(peers[socket.id])
//     if (clients > 0) {
//         if (clients <= 2)
//             this.broadcast.emit("Disconnect", peers[socket.id]);
//         clients--
//     }
// }
function sendUserName(username) {
    console.log('connect' + username)
    this.broadcast.emit("joined", username);
}

function SendOffer(offer) {
    this.broadcast.emit("BackOffer", offer)
}

function SendAnswer(data) {
    this.broadcast.emit("BackAnswer", data)
}

http.listen(port, () => console.log(`listening on ${port} port`))