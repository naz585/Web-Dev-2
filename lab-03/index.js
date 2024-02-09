const express = require('express');
const path = require('path');
const gm = require('gm')

const app = express(); 
const port = 3000;
app.use(express.static('public'));

app.get('/data',(req,res)=>{
    res.json({message:"Hello, this is JSON data!"});
});

app.get('/ascii-image',(req,res)=>{
    const imagePath = path.join(__dirname,'public/img/flower.jpg');
    gm(imagePath,(err,converted)=>{
        if(err) return res.send("Failed to convert image.");
        res.send("<pre>" + converted + "</pre>");
    });
});
//starting the server
app.listen(port, () => {
console.log(`Server running at http://localhost:${port}/`);
})