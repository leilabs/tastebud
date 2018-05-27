const request = require('request')
    , syncRequest = require('sync-request')
    , rp = require('request-promise')
    , buildURL = require('build-url')
    , root = require('../public/url').root


module.exports = (app, router) => {

    var keys = require('../keys');
    var traits = require('../traits');

    var scopes = 'user-top-read user-read-recently-played user-library-read playlist-modify-public';
    let authenticate_url = `https://accounts.spotify.com/authorize?client_id=${keys.public}&response_type=code&redirect_uri=http://localhost:8080/callback&scope=${scopes}`;

    function authenticated(req, res, next) {
        if (req.cookies.token) {
            next();
        } else {
            res.redirect(authenticate_url)
        }
    }

    // Index route
    // TODO: Different response depending on authenticated token present
    router
        .get('/', (req, res) => {
            if (req.cookies.token && req.cookies.username) {
                res.render('main', {token: req.cookies.token, username: req.cookies.username});   
            } else {
                res.render('index', {url: authenticate_url});
            }
        })

    // Callback for authenticating user
    router
        .get('/callback', (req, res) => {

            var options = {
                url: 'https://accounts.spotify.com/api/token',
                form: {
                    client_id: keys.public,
                    client_secret: keys.private,
                    grant_type: 'authorization_code',
                    code: req.query.code,
                    redirect_uri: root + '/callback'
                }
            }

            request.post(options, (err, r, body) => {
                if (err) throw err;

                var json = JSON.parse(body);

                var meOptions = {
                    url: 'https://api.spotify.com/v1/me',
                    headers: {
                        'Authorization': `Bearer ${json.access_token}`
                    }
                }

                request(meOptions, (e, r, b) => {
                    if (e) throw e;

                    var me = JSON.parse(b);
                    console.log(me.id);
                    
                    var cookieOptions = { maxAge: 1000 * 60 * 60 } // 1h
                    res.cookie('token', json.access_token, cookieOptions);
                    res.cookie('username', me.id, cookieOptions);

                    res.redirect('/');
                })
            })
        });

    router
        .get('/logout', authenticated, (req, res) => {
            res.clearCookie('token');
            res.clearCookie('username');
            res.redirect('/');
        })


    app.use(router);
}