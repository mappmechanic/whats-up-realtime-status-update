var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var expressSession = require('express-session');
var cookieParser = require('cookie-parser');


var Pusher = require('pusher');

var pusher = new Pusher({
    appId: '<your-app-id>',
    key: '<your-api-key>',
    secret: '<your-app-secret>',
    encrypted: true
});

var app = express();

// must use cookieParser before expressSession
app.use(cookieParser());

app.use(expressSession({secret:'<some-secret-token-here>',resave: true, saveUninitialized: true}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/register', function(req, res){
  console.log(req.body);
  if(req.body.username && req.body.status){
    var newMember = {
      username: req.body.username,
      status: req.body.status
    }
    req.session.user = newMember;
    res.json({  
      success: true,
      error: false
    });
  }else{
    res.json({  
      success: false,
      error: true,
      message: 'Incomplete information: username and status are required'
    });
  }
});

app.post('/usersystem/auth', function(req, res) {
  var socketId = req.body.socket_id;
  var channel = req.body.channel_name;
  var currentMember = req.session.user;
  var presenceData = {
    user_id: currentMember.username,
    user_info: {
      status: currentMember.status,
    }
  };
  var auth = pusher.authenticate(socketId, channel, presenceData);
  res.send(auth);
});

app.get('/isLoggedIn', function(req,res){
  if(req.session.user){
    res.send({ 
      authenticated: true 
    });
  }else{
    res.send({ authenticated: false });
  }
});

app.get('/logout', function(req,res){
  if(req.session.user){
    req.session.user = null;
  }
  res.redirect('/');
});

// Error Handler for 404 Pages
app.use(function(req, res, next) {
    var error404 = new Error('Route Not Found');
    error404.status = 404;
    next(error404);
});

module.exports = app;

app.listen(9000, function(){
  console.log('Example app listening on port 9000!')
});