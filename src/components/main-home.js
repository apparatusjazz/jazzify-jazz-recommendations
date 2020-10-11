import React, { Component } from 'react';
import Spotify from 'spotify-web-api-js';
import { getHashParams, shuffle } from '../helpers';
import Track from './track';

const NUMOFTRACKS = 30;
const spotifyApi = new Spotify();

class Home extends Component {
    constructor(props) {
        super(props);
        this.state = {
            recommendations: [],
            playlist: [],
            genreFilters: {},
            recs: []

        }
    }

    getTopArtists() {
        spotifyApi.getMyTopArtists({ "time_range": "short_term" }).then(res => {
            let genres = [];
            let count = 0;
            res.items.forEach(idx => {              // Count genres of top artists
                for (let i in idx.genres) {
                    let splitWords = idx.genres[i].split(" ");
                    for (let j in splitWords) {
                        genres.push(splitWords[j]);
                        // if (!genres[splitWords[j]]) {
                        //     genres[splitWords[j]] = 1;
                        // } else genres[splitWords[j]]++
                        // count++;
                    }
                }
            });
            this.mapInitialGenres(genres, { "jazz": ["jazz"], "pop": ["pop", "rock"] });

            // for (let i in genres) {  // normalize data
            //     genres[i] = (genres[i] / count).toFixed(3);
            // }
            console.log(genres);
        })

        // spotifyApi.getArtist("3Nrfpe0tUJi4K4DXYWgMUX").then(res => console.log(res));
    }

    analyzeTracks() {   // Analyze and return average of properties of top tracks
        let ids = [];
        spotifyApi.getMyTopTracks({ "time_range": "medium_term" }).then(res => {
            ids = res.items.map(item => item.id);
        }).then(() => {
            spotifyApi.getAudioFeaturesForTracks(ids).then(res => {
                let properties = {};
                let count = 0;
                res.audio_features.forEach(el => {
                    for (let i in el) {
                        if (!isNaN(el[i])) {    // Only process properties with numeric values
                            if (!properties[i]) {
                                properties[i] = el[i];
                            } else properties[i] += el[i];
                        }
                    }
                    count++;
                });
                for (let i in properties) {     // Get averages of audio features
                    properties[i] = properties[i] / count;
                }
                console.log(properties)
                return properties;
            });
        })
    }

    scaleGenreStats(genres) {       // Scale genre percentages to correct percentage ex. genre: 0.28 >> 0.36
        let sum = 0;
        for (let i in genres) sum += genres[i];
        for (let i in genres) {
            genres[i] = genres[i] / sum;
        }
        return genres;
    }

    getArtistsFromCollection(genres, collection) {  // Returns a jazz collection with only target genres
        let artists = {};                           // ex. { "pop": [artistis0, 2, 1], "rock": [3, 5, 6]}
        for (let i in genres) {
            artists[i] = [];
            if (collection[i]) {
                shuffle(collection[i]);
                let ids = [];
                for (let j = 0; j < 5 && j < collection[i].length; j++) {
                    ids.push(collection[i][j]);
                }
                artists[i] = ids;
            }
        }
        // console.log(artists);
        return artists;
    }

    getSeedTracks(artistCollection) {       // Return track ids by genre to feed into recommendation
        let tracks = {};                    // ex. {"pop": [trackid1, trackid2, ...], ...}
        let requests = [];
        for (let i in artistCollection) {
            tracks[i] = [];
            for (let j = 0; j < artistCollection[i].length; j++) {
                requests.push(spotifyApi.getArtistTopTracks(artistCollection[i][j], "US"));
            }
        }
        Promise.all(requests).then(data => {
            let idx = 0;
            for (let i in artistCollection) {
                for (let j = 0; j < artistCollection[i].length; j++) {
                    let d = data[idx++];
                    let songIds = shuffle(d.tracks.map(el => el.id));
                    tracks[i].push(songIds[0]);
                }
            }

            // this.saveRecommendations(
            this.getRecommendations(
                artistCollection,
                tracks,
                {},
                this.calcTracksPerGenre(this.scaleGenreStats({ "pop": 0.34, "rock": 0.54 }))
            )

            return tracks;
        });
    }
    saveRecommendations(recommendations) {
        this.setState({
            recommendations: recommendations
        });

        let recs = this.createTracks(recommendations);
        console.log(recs)
    }
    getRecommendations(artists, tracks, audioProperties, genreTrackNum) {
        let recommendations = [];
        let requests = [];
        for (let i in artists) {
            requests.push(
                spotifyApi.getRecommendations({
                    "limit": 10,
                    "market": "US",
                    "seed_artists": artists[i],
                    "seed_tracks": tracks[i],
                    "seed_genres": "jazz"
                })
            )
        }

        Promise.all(requests).then(data => {
            let idx = 0;
            data.forEach(el => {
                for (let i = 0; i < genreTrackNum[idx]; i++) {
                    if (el.tracks[i] !== undefined)
                        recommendations.push(el.tracks[i]);
                }
                idx++;
            });
            this.saveRecommendations(recommendations)
        })
    }

    calcTracksPerGenre(scaledGenres) {  // Input scaled genre stats
        let genreTrackNum = [];
        let idx = 0;
        for (let i in scaledGenres) {
            genreTrackNum[idx++] = Math.round(scaledGenres[i] * NUMOFTRACKS);
        }
        return genreTrackNum;
    }

    mapInitialGenres(genres, mapping) { // maps list of genres to a mapping ex. "house" > "house": ["electronic"]
        let count = 0;
        let genreList = [];
        for (let i in genres) {
            if (genres[i] in mapping) {
                for (let j in mapping[genres[i]]) {
                    let item = mapping[genres[i]][j];
                    if (!genreList[item]) genreList[item] = 1;
                    else genreList[item]++;
                    count++;
                }
            }
        }
        return genreList;
    }

    createTracks(recommendations) {
        let track = (id, album, song, artist) => {
            return (
                <Track
                    key={id}
                    album={album}
                    song={song}
                    artist={artist}
                />
            )
        }
        return recommendations.map(el =>
            track(el.id, el.album.images[2].url, el.name, el.artists[0].name)
        )
    }

    // addToPlaylist(key) {
    //     let playlist = this.state.playlist;
    //     playlist
    // }

    componentDidMount() {
        const params = getHashParams();
        if (params.access_token) {
            spotifyApi.setAccessToken(params.access_token);
            console.log("logged in successfully!")
        }
        // this.getTopArtists();
        // this.analyzeTracks();
        this.getSeedTracks(
            this.getArtistsFromCollection(
                { "pop": 0.34, "rock": 0.54 },
                {
                    "pop": ["1FC0psUheo5L2kUtj53MF9", "3uoY3Ibj2qOK3bb47cpKs6"],
                    "rock": ["1W8TbFzNS15VwsempfY12H", "6ra4GIOgCZQZMOaUECftGN"]
                }
            ))
    }
    render() {
        let recs = this.createTracks(this.state.recommendations)
        return (
            <div>
                <h1>Jazzify</h1>
                {recs}
                <div>
                    <a id="login-btn" href={"http://localhost:8888/login"}>Login</a>
                </div>
            </div>
        )
    }
}

export default Home;