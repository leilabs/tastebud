const request = require('request');

module.exports = (app, router) => {

    var keys = require('../keys');

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
            data = JSON.parse(body)
            console.log(data)
            tracks = []
            for (index in data.items) {
                var sub_options = {
                    url: 'https://api.spotify.com/v1/audio-features/' + data.items[index].track.id,
                    headers: {
                        'Content-Type': 'application/json', 
                        'Authorization': `Bearer ${req.cookies.token}`,
                        'Accept': 'application/json'
                    }
                }

                rp(sub_options)
                    .then(function(res) {
                        feature = JSON.parse(body);

                        var track = {
                            name:       data.items[index].track.name,
                            album:      data.items[index].track.album.name,
                            artist:     data.items[index].track.artists[0].name,
                            id:         data.items[index].track.id,
                            features:   feature
                        }

                        tracks.push(track)
                    })
            }
            res.send(tracks)
        })
    })

    app.use('/user', router);
}