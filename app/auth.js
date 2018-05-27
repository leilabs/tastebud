const request = require('request')
    , syncRequest = require('sync-request')
    , rp = require('request-promise')
    , buildURL = require('build-url');

module.exports = (app, router) => {

    var keys = require('../keys');
    var traits = require('../traits');

    var scopes = 'user-top-read user-read-recently-played user-library-read playlist-modify-public';
    let authenticate_url = `https://accounts.spotify.com/authorize?client_id=${keys.public}&response_type=code&redirect_uri=http://localhost:8080/callback&scope=${scopes}`;

    function getArtistIds (artists, req) {
        var ids = [];

        for (artist in artists) {
            var url = buildURL("https://api.spotify.com/v1/search", {
                queryParams: {
                    type: 'artist',
                    q: artists[artist],
                    limit: 1
                }
            })

            var options = {
                url: url,
                headers: {
                    Authorization: `Bearer ${req.cookies.token}`
                }
            }

            var res = syncRequest('GET', url, {headers: {
                Authorization: `Bearer ${req.cookies.token}`
            }});

            ids.push(JSON.parse(res.getBody()).artists.items[0].id)
        }
        return ids;
    }

    function find_songs(parameters, req, next) {
        var artists = parameters.artists;
        var artistsID = getArtistIds(artists, req);
        var keysInNumberFormat = {
            "C": 0,
            "C#": 1,
            "D": 2,
            "D#": 3,
            "E": 4,
            "F": 5,
            "F#": 6,
            "G": 7,
            "G#": 8,
            "A": 9,
            "A#": 10,
            "B": 11
        }

        console.log(keysInNumberFormat[parameters.key])

        var queryParams = {
            limit: parameters.tracks,
            seed_genres: parameters.genres.join(","),
            seed_artists: artistsID.join(","),
            target_time_signature: parameters.signature,
            target_mode: parameters.mode,
            target_key: keysInNumberFormat[parameters.key]
        }

        for (var i = 0; i < parameters.traits.length; i++) {
            var traitName = parameters.traits[i];
            var traitAttributes = traits[traitName]["attributes"]
            
            for (var j = 0; j < Object.keys(traitAttributes).length; j++) {
                var type = Object.values(traitAttributes)[j]["type"];
                var value = Object.values(traitAttributes)[j]["value"];
                var attribute = Object.keys(traitAttributes)[j]
                
                queryParams[type + "_" + attribute] = value;
            }
        }

        var queryUrl = encodeURI(buildURL("https://api.spotify.com/v1/recommendations", {
            queryParams: queryParams
        }));

        var options = {
            url: queryUrl,
            headers: {
                "Authorization": "Bearer " + req.cookies.token
            }
        }

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
            if (req.cookies.token) {
                res.render('main', {token: req.cookies.token});   
            } else {
                res.render('index', {url: authenticate_url});
            }
        })

    router
        .get('/songs', (req, res) => {
            var test_parameters = {
                traits: [],
                artists: ["Kendrick Lamar"],
                genres: ["Hip Hop"],
                signature: 4,
                key: "D",
                tracks: 10
            }

            find_songs(test_parameters, req, (result) => {
                var json = JSON.parse(result);
                var trackIDs = [];
                for (var i = 0; i < json["tracks"].length; i++) {
                    trackIDs.push(json["tracks"][i]["id"])
                }
                res.send(trackIDs);
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

            request.post(options, (err, r, body) => {
                if (err) throw err;

                var json = JSON.parse(body);

                var cookieOptions = { maxAge: 1000 * 60 * 60 } // 1h
                res.cookie('token', json.access_token, cookieOptions);

                res.redirect('/');
            })
        });

    router
        .get('/logout', authenticated, (req, res) => {
            res.clearCookie('token');
            res.redirect('/');
        })

    router
        .get('/me', (req, res) => {
            var options = {
                url: 'https://api.spotify.com/v1/me',
                headers: {
                    "Authorization": "Bearer " + req.cookies.token
                }
            }

            rp(options)
                .then(function (html) {
                    var json = JSON.parse(html);
                })

                .catch(function (err) {
                    res.send(err);
                })
        })


    app.use(router);
}