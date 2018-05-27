const request = require('request');

module.exports = (app, router) => {

    var keys = require('../keys');

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

    app.use('/tracks', router);
}