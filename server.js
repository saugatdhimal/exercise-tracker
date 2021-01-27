const mongo = require('mongodb')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(bodyParser.urlencoded({extended:false}))
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const Schema = mongoose.Schema;
let exerciseSchema = new Schema({
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: String
});
let userSchema = new Schema({
  username: {type: String, require: true},
  log: [exerciseSchema]
})
let Exercise = mongoose.model("Exercise",exerciseSchema);
let User = mongoose.model("User",userSchema);

app.post('/api/exercise/new-user',(req,res)=>{
  let newUser = new User({username: req.body.username});
  newUser.save((error,savedData)=>{
    if(error){return console.log(error)}
    res.json({
      username: savedData.username,
      _id: savedData.id
    })
  })
})

app.get('/api/exercise/users',(req,res)=>{
  User.find({},(error,data)=>{
    if(error){return console.log(error)}
    res.json(data)
  })
})

app.post('/api/exercise/add',(req,res)=>{
  let newExercise = new Exercise({
    description: req.body.description,
    duration: req.body.duration,
    date: req.body.date
  })
  if(newExercise.date === ''){
    newExercise.date = new Date().toISOString().substring(0,10)
  }
  User.findByIdAndUpdate(
  req.body.userId,
  {$push: {log: newExercise}},
  {new: true},
  (error,updatedData)=>{
    if(error){console.log(error)}
    res.json({
      _id: updatedData.id,
      username: updatedData.username,
      date: new Date(newExercise.date).toDateString(),
      duration: newExercise.duration,
      description: newExercise.description
    })
  })
})

app.get('/api/exercise/log',(req,res)=>{
  User.findById({_id: req.query.userId},(error,data)=>{
    if(error){return console.log(error)}
    let resObj = data;
    if(req.query.from || req.query.to){
      let fromDate = new Date(0);
      let toDate = new Date();
      if(req.query.from){
        fromDate = new Date(req.query.from)
      }
      if(req.query.to){
        toDate = new Date(req.query.to)
      }
      fromDate = fromDate.getTime();
      toDate = toDate.getTime();
      resObj.log = resObj.log.filter((x)=>{
        let exerciseDate = new Date(x.date).getTime();
        return exerciseDate >= fromDate && exerciseDate <= toDate
      })
    }
    if(req.query.limit){
      resObj.log = resObj.log.slice(0,req.query.limit)
    }
    res.json({
      _id: data.id,
      username: data.username,
      count: resObj.log.length,
      log: resObj.log
    })
  })
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
