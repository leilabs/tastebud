const request = require('request')
    , buildURL = require('build-url');

module.exports = (app, router) => {

    var keys = require('../keys');
    var traits = require('../traits');

    var scopes = 'user-top-read user-read-recently-played user-library-read playlist-modify-public';
    let authenticate_url = `https://accounts.spotify.com/authorize?client_id=${keys.public}&response_type=code&redirect_uri=http://localhost:8080/callback&scope=${scopes}`;

    function find_songs(parameters, req, next) {
        var body = buildURL("https://api.spotify.com/v1/recommendations", {
            queryParams: {
                
            }
        });

        request(options, (err, r, body) => {
            next(body);
        })
    }

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
            if (!req.cookies.token) {
                res.redirect(authenticate_url);
            }

            res.send(req.cookies.token);
        })

    router
        .get('/songs', (req, res) => {
            var test_parameters = {
                traits: ["sad", "hype"],
                artists: ["Kendrick Lamar", "Johnny Cash"],
                exclusive_artists: false,
                genres: ["Country", "Hip Hop"],
                signature: 4,
                key: "D",
                mode: "0",
                tracks: 10
            }

            console.log(test_parameters)

            find_songs(test_parameters, req, (result) => {
                res.send(result);
            })
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
                    redirect_uri: 'http://localhost:8080/callback'
                }
            }

            console.log(options);

            request.post(options, (err, r, body) => {
                if (err) throw err;

                var json = JSON.parse(body);

                var cookieOptions = { maxAge: 1000 * 60 * 60 } // 1h
                res.cookie('token', json.access_token, cookieOptions);

                res.redirect('/');
            })
        });

    router
        .get('/me', (req, res) => {
            var me = 'https://api.spotify.com/api/me';

            var options = {
                url: me,
                form: {
                    "Authorization": "Bearer " + req.cookies.token
                }
            }

            request(options, (err, r, body) => {
                console.log(body);
                var user = JSON.parse(body);
                res.send(user);
            })
        })

    // router
    //     .get('*', (req, res) => {
    //         res.send('404 bro');
    //     })


    app.use(router);
}