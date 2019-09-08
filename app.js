'use strict'
const express = require('express');
const app = express();
const port = 8080;
const server = app.listen(port, () => console.log('listening on: ' + port));
const socket = require('socket.io').listen(server);
let roomList = [];
let userLists = [];

app.use(express.static(__dirname));
app.get('/', (req, res) => res.sendFile(__dirname+'/index.html'));
app.get('/chat', (req, res) => res.send("Room created. Visit www.localhost:8080/"+createRoom()+" to connect."));
app.get('/rooms', (req, res) => res.send(roomList));
app.get('/*', (req, res) => {
    if(roomList.includes(req.url.substring(1, req.url.length)))
        res.sendFile(__dirname+'/chat.html');
    else
        res.send("No room found with that name.");
});

function createRoom(){
    let roomHash = Math.random().toString(36).replace('0.', '');
    roomHash = roomHash.substring(0, roomHash.length-4);
    roomList.push(roomHash);
    userLists.push({roomname: roomHash, userlist: []});

    return roomList[roomList.length-1];
}

socket.on('connect', (client) => {
    console.log(client.id + " has connected to the server");
    client.on('join room', (data) => {
        console.log("joining room: " + data.roomname);
        client.join(data.roomname);
        let index = 0;
        for(let i = 0; i < userLists.length; i++){
            if(userLists[i]['roomname'] === data.roomname){
                index = i;
                userLists[i]['userlist'].push({name: data.username, id: client.id})
                socket.to(data.roomname).emit('connected', data.username+" has joined.");
            }
        }
        socket.to(data.roomname).emit('user list', userLists[index]);
    });

    client.on('disconnect', () => {
        console.log(client.id + " has disconnected from the server")
        for(let i = 0; i < userLists.length; i++){
            for(let j = 0; j < userLists[i]['userlist'].length; j++){
                if(userLists[i]['userlist'][j]['id'] === client.id){
                    socket.to(userLists[i]['roomname']).emit('disconnected', userLists[i]['userlist'][j]['name']+" has disconnected.");
                    userLists[i]['userlist'].splice(j, 1);
                    socket.to(userLists[i]['roomname']).emit('user list', userLists[i]);
                }
            }
        }
    });

    client.on('message', (msg) => {
        console.log(msg);
        console.log(msg.roomname);
        socket.to(msg.roomname).emit('message', msg);
    });
});    