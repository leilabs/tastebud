const request = require('request')
    , syncRequest = require('sync-request')
    , rp = require('request-promise')
    , buildURL = require('build-url');

module.exports = (app, router) => {

    var keys = require('../keys')
        , traits = require('../traits');

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

            var res = syncRequest('GET', url, {
                headers: {
                    Authorization: `Bearer ${req.cookies.token}`
                }
            });

            ids.push(JSON.parse(res.getBody()).artists.items[0].id)
        }
        return ids;
    }

    function find_songs(parameters, req, next) {
        var artists = parameters.artists;
        var artistsID = getArtistIds(artists, req);

        var queryParams = {
            limit: parameters.tracks,
            seed_genres: parameters.genres.join(","),
            seed_artists: artistsID.join(","),
            target_time_signature: parameters.signature,
            target_key: parameters.key
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

        if (parameters.mode) {
            queryParams["target_mode"] = parameters.mode;
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
            if (err) throw err;

            next(body);
        })

    }

    function populate_playlist(songs, req, params) {
        if (!songs) {
            next();
        }

        // date title
        var dateObj = new Date();
        var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "November", "December"];
        var datePlain = months[dateObj.getMonth()] + " " + dateObj.getDate() + ", " + dateObj.getFullYear();
        var playlistTitle = `${params.traits[0]} ${params.artists[0]} • TasteBud, ${datePlain}`

        var playlist = syncRequest("POST", "https://api.spotify.com/v1/users/" + req.cookies.username + "/playlists", {headers: {
            "Authorization": "Bearer " + req.cookies.token},
            "json": {
                name: playlistTitle
            }
        });

        var id = JSON.parse(playlist.getBody('utf8')).id;
        var songURIs = songs;
        for (var i = 0; i < songURIs.length; i++) {
            songURIs[i] = "spotify:track:" + songURIs[i];
        }
        var songsPlainText = decodeURI(songURIs.join(","))

        var playlistAddSongs = syncRequest("POST", `https://api.spotify.com/v1/users/${req.cookies.username}/playlists/${id}/tracks?uris=${songsPlainText}`, {headers: {
            "Authorization": "Bearer " + req.cookies.token},
        });

        return `https://open.spotify.com/user/${req.cookies.username}/playlist/${id}`
    }

    router
        .get('/playlist', (req, res, next) => {
            var test_parameters = {
                traits: decodeURI(req.query["traits"]).split(","),
                artists: decodeURI(req.query["artists"]).split(","),
                genres: decodeURI(req.query["genres"]).split(","),
                signature: decodeURI(req.query["signature"]),
                tracks: req.query["tracks"]
            }

            if (req.query["modecontrol"] !== "0") {
                test_parameters["key"] = decodeURI(req.query["key"])
                test_parameters["mode"] = decodeURI(req.query["mode"])
            }

            find_songs(test_parameters, req, (result) => {
                var json = JSON.parse(result);
                var trackIDs = [];
                if (json["tracks"]) {
                    for (var i = 0; i < json["tracks"].length; i++) {
                        trackIDs.push(json["tracks"][i]["id"])

                    }
                    var playlist_link = populate_playlist(trackIDs, req, test_parameters);
                    res.send({url: playlist_link})
                } else {
                    res.send({error: "nothing found", result: result})
                }
            })
    })

    router.get('/data/:id', (req, res) => {
        var options = {
            url: `https://api.spotify.com/v1/tracks/${req.params.id}`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${req.cookies.token}`,
                'Accept': 'application/json'
            }
        }

        request(options, (err, r, body) => {
            res.send(JSON.parse(body))
        })
    })

    router.get('/features/:id', (req, res) => {
        var options = {
            url: `https://api.spotify.com/v1/audio-features/${req.params.id}`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${req.cookies.token}`,
                'Accept': 'application/json'
            }
        }

        request(options, (err, r, body) => {
            res.send(JSON.parse(body))
        })
    })

    router.get('/tracks', (req, res) => {
        var options = {
            url: 'https://api.spotify.com/v1/me/tracks',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${req.cookies.token}`,
                'Accept': 'application/json'
            }
        }

        var tracks = { tracks: [] }
        request(options, (err, r, body) => {
            data = (JSON.parse(body)).items

            tracks = []
            for (index in data) {
                var feature_options = {
                    url: 'https://api.spotify.com/v1/audio-features/' + data[index].track.id,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${req.cookies.token}`,
                        'Accept': 'application/json'
                    }
                }

                features = {}
                request(feature_options, (err, r, body) => {
                    features = JSON.parse(body)
                    var track = {
                        'name': data[index].track.name,
                        'album': data[index].track.album.name,
                        'artist': data[index].track.artists[0].name,
                        'id': data[index].track.id,
                        'features': features
                    }
                    tracks.push(track)
                })
            }
            res.send(tracks)
        })
    })

    app.use('/music', router);
}
