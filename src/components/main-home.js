import React, { Component } from 'react';
import Spotify from 'spotify-web-api-js';
import { getHashParams, shuffle } from '../helpers';


const spotifyApi = new Spotify();

class Home extends Component {
    constructor(props) {
        super(props);
        this.state = {

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
        let artists = {};                           // ex. { "pop": [0, 2, 1], "rock": [3, 5, 6]}
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
        console.log(artists);
        return artists;
    }

    //getRecommendations (artists, genres, tracks, audioProperties)

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
        console.log(genreList);
        return genreList;
    }

    componentDidMount() {
        const params = getHashParams();
        if (params.access_token) {
            spotifyApi.setAccessToken(params.access_token);
            console.log("logged in successfully!")
            spotifyApi.getMyCurrentPlaybackState().then(res => {
                // console.log(res);
            })
        }
        // this.getTopArtists();
        // this.analyzeTracks();
        this.getArtistsFromCollection(
            { "pop": 0.34, "rock": 0.54 },
            { "pop": [1, 2, 3, 4, 5, 6], "rock": [1, 2, 3] }
        );
    }
    render() {
        return (
            <div>
                <h1>Jazzify</h1>
                <div>
                    <a id="login-btn" href={"http://localhost:8888/login"}>Login</a>
                </div>
            </div>
        )
    }
}

export default Home;