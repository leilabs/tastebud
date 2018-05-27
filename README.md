# notes

#routes

# GET `/` root


# user object

example

```json
{
    "username": "nulljosh",
    "info": {
        "client_id": "123",
        "client_secret": "123",
        "token": "456"
    },
    "listen_history": [
        "song": [
            "title", "release", "artist"
        ]
    ]
}
```

 - str:username
 - json:authentication info
    - str:client_id
    - str:client_secret
    - str:user_token
 - json:listen history
    - track object
    - track object
    - ...
 - functions
    - get_most_popular_artists(time_scope, amount_of_results)
    - get_most_popular_songs(time_scope, amount_of_results)
    - get_most_popular_albums(time_scope, amount_of_results)
 - array:str:playlist (playlist_ids)
 - json:saved music
    - track object
    - track object
    - ...

# track object
 - name
 - track_id
 - album
 - artist
 - genre
 - advanced_track_data
    - dancablility
    - tempo
    - valence
    - ...


# listen history

| "song"    | "album"   | "artist"     | "song_id" | "num_listens" | "time of listen" |
| str       | str       | str          | str       | int           | str array        |
| "Bonfire" | "Camp     | "Childish.." | "asdfasdg"| 13            | [epoch time, epoch time]|

# Track information
 - Track data : "https://beta.developer.spotify.com/documentation/web-api/reference/tracks/get-track/"
 - Track details (tempo, etc.) : "https://beta.developer.spotify.com/documentation/web-api/reference/tracks/get-audio-features/"

# Album information
 - Album data : 