const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/member");

const conn = mongoose.connect;
if(conn){
    console.log("Connected Successful");
}else{
    console.log("ERROR");
}