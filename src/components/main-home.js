import React, { Component } from 'react';
import Spotify from 'spotify-web-api-js';
import { getHashParams } from '../helpers';


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
        spotifyApi.getMyTopTracks({ "time_range": "short_term" }).then(res => {
            ids = res.items.map(item => item.id);
        }).then(() => {
            spotifyApi.getAudioFeaturesForTracks(ids).then(res => {
                // let total = tracks.length;
                let properties = {};
                let count = 0;
                res.audio_features.forEach(el => {
                    for (let i in el) {
                        if (!isNaN(el[i])) {
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
                return properties;
            });
        })
    }

    mapInitialGenres(genres, mapping) {
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
        this.getTopArtists();
        this.analyzeTracks();
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