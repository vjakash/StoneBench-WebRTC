let username = prompt("What is your name?");
while (username == '' || username === null) {
    username = prompt('Please enter a name to continue');
}
let Peer = require('simple-peer');
let socket = io();
let client = {};
let video = document.getElementById('myVideo');
let count = 0;

// function hasUserMedia() {
//     //check if the browser supports the WebRTC 
//     return !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
//         navigator.mozGetUserMedia || navigator.mediaDevices.getUserMedia);
// }
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia || navigator.mediaDevices.getUserMedia;
if (navigator.getUserMedia) {

    //enabling video and audio channels 
    navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(function(stream) {
        socket.emit('NewClient', username);
        video.srcObject = stream;
        video.play();

        //used to initialize a peer
        function InitPeer(type) {
            let peer = new Peer({ initiator: (type == 'init') ? true : false, stream: stream, trickle: false });
            peer.on('stream', function(stream) {
                CreateVideo(stream);
                console.log("connected");
                socket.emit('connectUser', username);
            });
            document.getElementById("send").addEventListener('click', function(e) {
                let message = document.getElementById("message").value;
                if (message !== "") {
                    peer.send(`message:${username}:${message}`);
                    createMessage(`message:${username}:${message}`, 0)
                    document.getElementById("message").value = "";
                }
            })
            document.getElementById("message").addEventListener('keydown', function(event) {
                if (event.keyCode === 13) {
                    event.preventDefault();
                    document.getElementById("send").click();
                } else {
                    let message = document.getElementById("message").value;
                    if (message !== "") {
                        peer.send(`info:${username}:is typing.....`);
                    }
                }
                // createMessage(`info:${username}:is typing.....`, 1);
            })
            peer.on('data', function(data) {
                // console.log(String(data));
                createMessage(String(data), 1);
            });
            return peer;
        }
        //for peer of type init(Initializer browser)
        function MakeInitPeer() {
            // console.log("makeInitPeer", count);
            // count++;
            client.gotAnswer = false;
            let peer = InitPeer('init');
            peer.on('signal', function(data) {
                // console.log("init peer", data);
                if (!client.gotAnswer) {
                    socket.emit('Offer', data);
                }
            })
            client.peer = peer;
        }
        //for peer of type not init(client browser)
        function MakeClientPeer(offer) {
            // console.log("MakeClientPeer", count);
            // count++;
            let peer = InitPeer('notInit')
            peer.on('signal', (data) => {
                // console.log("client peer", data);
                socket.emit('Answer', data);
            })
            peer.signal(offer);
            client.peer = peer;
        }

        function SignalAnswer(answer) {
            client.gotAnswer = true;
            let peer = client.peer;
            peer.signal(answer);
        }

        function SessionActive() {
            document.write('Session Active. Please come back later');
        }

        function RemovePeer(data) {
            console.log(data);
            document.getElementById("peerVideo").remove();
            document.getElementById("messages").innerHTML += `<div class="col-lg-12 info ml-4">
                <p style="color:red;">${data} disconnected</p>
            </div>`;
            // document.getElementById("muteText").remove();
            if (client.peer) {
                client.peer.destroy();
            }
        }
        socket.on('CreatePeer', MakeInitPeer);
        socket.on('BackOffer', MakeClientPeer);
        socket.on('BackAnswer', SignalAnswer);
        socket.on('SessionActive', SessionActive);
        socket.on('Disconnect', RemovePeer);
        socket.on('joined', function(data) {
            console.log(data);
            document.getElementById("messages").innerHTML += `<div class="col-lg-12 info ml-4">
                <p>${data} Connected</p>
            </div>`;
            console.log(data);
        });

        async function CreateVideo(stream) {
            let col = document.createElement("div");
            col.id = "peerVideo";
            col.classList.add("col-lg-6");
            let video = document.createElement('video')
            video.classList.add("video-class");
            col.appendChild(video);
            document.getElementById("videos").appendChild(col);
            // let audio = stream.getAudioTracks();
            // console.log(audio);
            var mediaStream = new MediaStream(stream);
            video.srcObject = mediaStream;
            video.play();
            video.volume = 1;
            video.addEventListener('click', () => {
                if (video.volume != 0)
                    video.volume = 0;
                else
                    video.volume = 1;
            })
        }

        function createMessage(messageData, type) {
            console.log(messageData, type);
            let msgArr = messageData.split(":");
            let msgBox = "";
            if (msgArr[0] === "message") {
                if (document.getElementById("info")) {
                    document.getElementById("info").remove();
                }
                if (type === 1) {
                    msgBox = `<div class="col-lg-12 mb-2">
                    <div class="container mb-2">
                        <div class="arrow">
                            <div class="outer"></div>
                            <div class="inner"></div>
                        </div>
                        <div class="message-body">
                            <p><u>${msgArr[1]}</u></p>
                            <p>${msgArr[2]}</p>
                        </div>
                    </div>
                </div>`;
                } else {
                    msgBox = `<div class="col-lg-12 mb-2 text-right">
                <div class="container2">
                    <div class="arrow">
                        <div class="outer"></div>
                        <div class="inner"></div>
                    </div>
                    <div class="message-body">
                        <p><u>${msgArr[1]}</u></p>
                        <p>${msgArr[2]}</p>
                    </div>
                </div>
                </div>`;
                }
                document.getElementById("messages").innerHTML += msgBox;
            } else if (msgArr[0] === "info") {
                document.getElementById("info-row").style.display = "block";
                document.getElementById("info-row").innerHTML = "";
                msgBox = ` <div class="col-lg-12 info ml-4" id="info">
                <p>${msgArr[1]} ${msgArr[2]}</p>
            </div>`;
                document.getElementById("info-row").innerHTML += msgBox;
            }
            var objDiv = document.getElementById("message-container");
            objDiv.scrollTop = objDiv.scrollHeight;
            // console.log(objDiv.scrollTop, objDiv.scrollHeight)
        }

    }).catch(function(err) { console.log(err) });

} else {
    alert("WebRTC is not supported");
}