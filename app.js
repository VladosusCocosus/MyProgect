const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');
const path = require('path')

var userData = path.join(__dirname + '/users.json')
var homeworkData = path.join(__dirname + '/homework.json')

let homeworkView = []

const TWOHOURS = 1000 * 60 * 60 * 2

const{
    PORT = 3000,
    NODE_ENV = 'development',

    SESS_SECRET = 'ssh!quiet,it\'asecret!',
    SESS_NAME = 'sid',
    SESS_LIFETIME = TWOHOURS
} = process.env

const app = express();

const IN_PROD = NODE_ENV === 'production'

app.use(session({
    name: SESS_NAME,
    saveUninitialized: false,
    secret: SESS_SECRET,
    resave: false,
    cookie:{
        maxAge: SESS_LIFETIME,
        sameSite: true,
        secure: IN_PROD
    }
}));
app.use(bodyParser.urlencoded({
    extended:true
}));

fs.readFile('users.json', 'utf8', function(err, data){
    if(err) throw err;
    users = JSON.parse(data)
});
fs.readFile('homework.json', 'utf8', function(err, content){
    if(err) throw err;
    homework = JSON.parse(content)
})
app.set('view engine', 'ejs')

const redirectLogin = (req, res, next) => {
    if(!req.session.userId){
        res.redirect('/auth')
    }else{
        next()
    }
};
const Admin = (req, res, next) => {
    if(req.session.userId == "0"){
        next()
    }else{
        res.redirect('/')
    }
};
app.get('/', function(req, res){
    const{userId} = req.session
    res.render('index', {userId:userId});
});
app.get('/reg', Admin, function(req,res){
    const{userId} = req.session
    res.render('reg', {userId:userId})
});
app.post('/reg', function(req, res){
    const{email, password, status, name, com} = req.body;
    users.push({email:email, password:password, id:status, name:name, com:com})
        fs.writeFile(userData, JSON.stringify(users), err => {
            if (err){
                throw new Error(err)
            }
        })
    res.redirect('/')
})
app.get('/cab', redirectLogin ,function(req, res){
    const{userStatus, userName, userId} = req.session
    res.render('cab', {userName:userName, userStatus:userStatus, userId:userId});
});
app.get('/homework', function(req, res){
    const{userName, userId} = req.session
    res.render('homework', {userName:userName, userId:userId, homeworkView});
});
app.post('/homework', (req,res) => {
    const{Check_class, Check_date, Check_class_word} = req.body
    homeworkView =  homework.filter(elem => elem.class == Check_class && elem.date == Check_date && elem.classWord == Check_class_word)
    res.redirect('/homework')
});
app.get('/auth', function(req,res){
    const{userId} = req.session
    res.render('auth', {userId:userId})
 });
app.post('/auth', (req,res) => {
    const{email, password} = req.body
    if (email && password) {
        const user = users.find(user => user.password === password && user.email === email)
        if(user){
            req.session.userId = user.id
            req.session.userName = user.name
            req.session.userStatus = user.status
            res.redirect('/')
        }else{
            console.log('wrong')
            res.redirect('/auth')
        }
    }
});
app.get('/CreatePage', function(req,res){
    const{userId} = req.session
    res.render('CreatePage', {userId:userId}) 
})
app.post('/CreatePage', (req,res) => {
    const{classNumb, hometask, date, classWord} = req.body
    homework.push({class:classNumb, homework:hometask, teacher:req.session.userName, date:date, classWord:classWord})
        fs.writeFile(homeworkData, JSON.stringify(homework), err => {
           console.log(err)
        })
    res.redirect('/')
})

app.listen(PORT)