const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');
const redis = require('redis');
const jwt = require('jsonwebtoken');
const { isArray } = require('util');

// Create en express application
const app = express();

//Create Redis Client
const client = redis.createClient({
    host: '127.0.0.1'
});

// Gets the value of cookie with inp key value, else returns undefined.
function ParseCookie(cookie,key){
    var token = undefined;
    cookie.split('; ').forEach((str) => {
        var kvpair = str.split('=');
        if(kvpair[0] === key){
            token = kvpair[1]
        }
    });
    return token;
}

//Connect to redis Database
client.on('connect', () => {
    console.log('Redis Connected');
    client.lrange('tasks',0 , -1, (err,result) => {
        if(err || (result.length === 0)){
            client.rpush('tasks' , 'buying vegetable' , (err,final) =>{

            })
        }
    });
    client.hgetall('call',(err,result) => {
        if(err || result === null || result === {} ){
            client.hmset('call', ['name', 'Prabhjyot', 'company', 'Boeing',
            'phone', '123456789', 'time', '22-02-1994'], (err,final) =>{

            });
        }
    });
});

// Set Views folder to be  hosted
app.set('views', path.join(__dirname, 'views'));
// Set view engine to host the web pages
app.set('view engine', 'ejs');

app.use(logger('dev'));
// Set middleware to read data from body of request
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Set middleware to serve static resources like css
app.use(express.static(path.join(__dirname, 'public')));


// Routes
app.get('/login',(req,res,next) => {
    res.render('login');
})

app.post('/signin',(req,res,next) => {
    console.log('here');
    // get token from the credentials
    var token =  jwt.sign({
        name : req.body.name,
        password : req.body.password
    },
    'secret_key',
    {expiresIn : 24*60});
    //Set cookie with security
    res.cookie('token',token,{ httpOnly : true , secure : true });
    res.redirect('/');
})

// middleware to auth the user using coookie token
app.use((req,res,next) => {
    //gets the token from the cookie
    var token = ParseCookie(req.headers.cookie,'token');
    
    // verify the token, if fails goto login
    if(token !== undefined){
        jwt.verify(token,'secret_key',(err,user) => {
            if(!err){
                if(user.password.length === 0){
                    res.redirect('/login');
                }
            }else{
                res.redirect('/login');
            }
        });
        next();
    }else{
        res.send('Error');
    }
})

app.get('/', (req, res, next) => {
    var title = 'Task List';
    client.lrange('tasks', 0, -1, (err, reply) => {
        client.hgetall('call', (err, call) => {
            if (!err)
                res.render('index', {
                    title: title,
                    tasks: reply,
                    call: call
                });
        })
    });
})

app.post('/task/add', (req, res, next) => {
    client.rpush('tasks', req.body.task, (err, reply) => {
        if (!err) {
            console.log('Task Added ....');
            res.redirect('/');
        }
    })
})

app.post('/task/delete', (req, res, next) => {
    if (isArray(req.body.tasks)) {
        req.body.tasks.forEach(element => {
            client.LREM('tasks', 1, element, (err, reply) => {
                if (!err)
                    console.log(element + ' is romoved....');
            });
        });
    }
    else{
        client.LREM('tasks', 1, req.body.tasks, (err, reply) => {
            if (!err)
                console.log(req.body.tasks + ' is romoved....');
        });
    }
    res.redirect('/');
})

app.post('/call/edit', (req, res, next) => {
    client.hmset('call', ['name', req.body.name, 'company', req.body.company,
        'phone', req.body.phone, 'time', req.body.time], (err, call) => {
            if (!err) {
                console.log('Call is Edited.....');
            }
        });
    res.redirect('/');
})

module.exports = app;