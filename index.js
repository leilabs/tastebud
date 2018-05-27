const morgan = require('morgan')
    , express = require('express')
    , bodyParser = require('body-parser')
    , session = require('express-session')
    , cookie = require('cookie-parser')
    , expbhs = require('express-handlebars');

var app = express()
    , router = express.Router()
    , PORT = process.env.PORT || 8080;

// Set handlebars as rendering engine
app.engine('handlebars', expbhs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use(session({
    secret: 'hunter2',
    resave: false,
    saveUninitialized: true
}));

app.set('trust proxy', 1)

app.use(cookie());

// Expose /public as static
app.use(express.static('public'));

// BodyParser settings for taking info via POST
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(morgan('dev')); /// cute logging hehe xd

// Include everything in app/
require('./app/auth')(app, router)
require('./app/music')(app, router)

// router
//     .get('*', (req, res) => {
//         res.send('404 bro');
//     })

app.listen(PORT);