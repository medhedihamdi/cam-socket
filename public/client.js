const socket = io.connect('http://localhost:5000');

const username = document.getElementById('username');
const room = document.getElementById('room');
const message = document.getElementById('message');
const send = document.getElementById('send');
const joinRoom = document.getElementById('joinRoom');
const callVideo = document.getElementById('callVideo'); // زر مكالمة الفيديو
const chat = document.getElementById('chat');
const broadcast = document.getElementById('broadcast');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let localStream;
let peerConnection;
const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
};

// الانضمام إلى غرفة
joinRoom.addEventListener('click', function() {
  socket.emit('join_room', {
    username: username.value,
    room: room.value
  });
});

// إرسال رسالة
send.addEventListener('click', function() {
  socket.emit('message', {
    username: username.value,
    message: message.value,
    room: room.value
  });
});

// استقبال رسالة جديدة
socket.on('new_msg', function(data) {
  chat.innerHTML += '<div class="container"><strong>' + data.username + ':</strong> ' + data.message + '</div>';
});

// بث عند الكتابة
message.addEventListener('keypress', function() {
  socket.emit('broadcast', {
    username: username.value,
    room: room.value
  });
});

// استقبال بث عند الكتابة
socket.on('new_broadcast', function(data) {
  broadcast.innerHTML = '<strong>' + data.username + ': </strong> is typing... <img src="/public/write.gif" style="width:25px;height:20px" />';
});

// بدء مكالمة فيديو
callVideo.addEventListener('click', async function() {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = localStream;

  peerConnection = new RTCPeerConnection(iceServers);
  peerConnection.addStream(localStream);

  peerConnection.onaddstream = function(event) {
    remoteVideo.srcObject = event.stream;
  };

  peerConnection.onicecandidate = function(event) {
    if (event.candidate) {
      socket.emit('candidate', {
        candidate: event.candidate,
        room: room.value
      });
    }
  };

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  socket.emit('offer', {
    offer: offer,
    room: room.value
  });
});

// استقبال عرض مكالمة الفيديو
socket.on('offer', async function(data) {
  if (!peerConnection) {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    peerConnection = new RTCPeerConnection(iceServers);
    peerConnection.addStream(localStream);

    peerConnection.onaddstream = function(event) {
      remoteVideo.srcObject = event.stream;
    };

    peerConnection.onicecandidate = function(event) {
      if (event.candidate) {
        socket.emit('candidate', {
          candidate: event.candidate,
          room: room.value
        });
      }
    };
  }

  await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  socket.emit('answer', {
    answer: answer,
    room: room.value
  });
});

// استقبال إجابة مكالمة الفيديو
socket.on('answer', async function(data) {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
});

// استقبال مرشح ICE
socket.on('candidate', function(data) {
  peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
});
