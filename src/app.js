const express = require("express");
const app = express();

app.get("/",(req,res)=>{
    res.send("Hello World! ");
})

app.get("/lara",(req,res)=>{
    res.send("Hello Lara!");
})

app.get("/vaidya",(req,res)=>{
    res.send("Hello Vaidya");
})


app.listen(7777,()=>{
    console.log('Server is running on port 7777');
});
