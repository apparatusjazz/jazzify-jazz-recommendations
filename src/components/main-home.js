import React, { Component } from 'react';
import Spotify from 'spotify-web-api-js';
import { getHashParams, shuffle } from '../helpers';
import Track from './track';
import { Container, Col, Row } from 'react-bootstrap';
import jazzCollection from '../jazz-collection';
import initalMappings from '../initial-map';

const NUMOFTRACKS = 30;
const spotifyApi = new Spotify();

class Home extends Component {
    constructor(props) {
        super(props);
        this.state = {
            recommendations: [],
            genres: {},
            playlist: [],
            genreFilters: {},
            recs: [],
            audioFeatures: {}
        }
        this.addToPlaylist = this.addToPlaylist.bind(this);
        this.addAllToPlaylist = this.addAllToPlaylist.bind(this);
        this.clearPlaylist = this.clearPlaylist.bind(this);
    }

    getTopArtists() {       // Return array of genre tags ex. ["indie", "soul", "funk", "sould"...]
        // final value returns scaled genre stats
        spotifyApi.getMyTopArtists({ "time_range": "medium_term" }).then(res => {
            let genres = [];
            res.items.forEach(idx => {
                for (let i in idx.genres) {
                    let splitWords = idx.genres[i].split(" ");
                    for (let j in splitWords) {
                        genres.push(splitWords[j]);
                    }
                }
            });
            let a = this.mapInitialGenres(genres, initalMappings);
            let scaledGenres = this.scaleGenreStats(a);
        })

    }

    analyzeTracks() {   // Analyze and return average of properties of top tracks
        let ids = [];   // return val {danceability: 0.5746500000000001, energy: 0.57945, …}
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
                properties = this.processAnalysis(properties);
                return properties;
            });
        })
    }

    processAnalysis(properties) {
        delete properties["duration_ms"];
        delete properties["key"];
        delete properties["mode"];
        delete properties["speechiness"];
        delete properties["time_signature"];
        delete properties["liveness"];

        let newProps = {};
        for (let key in properties) {
            newProps[`target_${key}`] = properties[key];
        }
        this.setState({
            audioFeatures: newProps
        })
        return newProps;
    }

    scaleGenreStats(genres) {       // Scale genre percentages to correct percentage ex. genre: 0.28 >> 0.36
        let sum = 0;                // return value ex. {"pop": 0.6, "rock": 0.4}
        for (let i in genres) sum += genres[i];
        for (let i in genres) {
            genres[i] = genres[i] / sum;
        }
        this.setState({
            genres: genres
        })
        return genres;
    }

    getArtistsFromCollection(genres, collection) {  // Returns a jazz collection with only target genres
        let artists = {};
        for (let i in genres) {
            artists[i] = [];
            if (collection[i]) {
                shuffle(collection[i]);
                let ids = [];
                for (let j = 0; j < 4 && j < collection[i].length; j++) {
                    ids.push(collection[i][j]);
                }
                artists[i] = ids;
            }
        }
        return artists;
        /* return example
        {
        pop: (2) ["3uoY3Ibj2qOK3bb47cpKs6", "1FC0psUheo5L2kUtj53MF9"]
        rock: (2) ["6ra4GIOgCZQZMOaUECftGN", "1W8TbFzNS15VwsempfY12H"]
        }
        */
    }

    getSeedTracks() {       // Return track ids by genre to feed into recommendation
        let scaledGenres, artistCollection;
        spotifyApi.getMyTopArtists({ "time_range": "medium_term" }).then(res => {
            let genres = [];
            res.items.forEach(idx => {
                for (let i in idx.genres) {
                    let splitWords = idx.genres[i].split(" ");
                    for (let j in splitWords) {
                        genres.push(splitWords[j]);
                    }
                }
            });
            let a = this.mapInitialGenres(genres, initalMappings);
            scaledGenres = this.scaleGenreStats(a);
            artistCollection = this.getArtistsFromCollection(scaledGenres, jazzCollection);
        }).then(() => {
            let tracks = {};
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
                this.getRecommendations(
                    artistCollection,
                    tracks,
                    this.analyzeTracks(),
                    this.calcTracksPerGenre(scaledGenres)
                );
            })
        })
    }
    saveRecommendations(recommendations) {
        this.setState({
            recommendations: recommendations
        });
    }
    getRecommendations(artists, tracks, audioProperties, genreTrackNum) {
        let recommendations = [];
        let requests = [];

        for (let i in artists) {
            let params = {
                "limit": 30,
                "market": "US",
                "seed_artists": artists[i],
                // "seed_tracks": tracks[i],
                "seed_genres": "jazz"
            };
            for (let key in audioProperties) {
                params[key] = audioProperties[key];
            }
            requests.push(
                spotifyApi.getRecommendations(params)
            )
        }

        Promise.all(requests).then(data => {
            let idx = 0;
            data.forEach(el => {
                for (let i = 0; i < genreTrackNum[idx]; i++) {
                    if (el.tracks[i] !== undefined && !recommendations.includes(el.tracks[i]))
                        recommendations.push(el.tracks[i]);
                }
                idx++;
            });
            this.saveRecommendations(recommendations)
        })
    }

    calcTracksPerGenre(scaledGenres) {  // Input scaled genre stats
        let genreTrackNum = [];         // ex return [12, 18]
        let idx = 0;
        for (let i in scaledGenres) {
            genreTrackNum[idx++] = Math.round(scaledGenres[i] * NUMOFTRACKS);
        }
        return genreTrackNum;
    }

    mapInitialGenres(genres, mapping) { // maps list of genres to a mapping ex. "house" > "house": ["electronic"]
        // return value ex. [pop: 2, rock: 3, jazz: 75]
        let genreList = [];
        for (let i in genres) {
            if (genres[i] in mapping) {
                for (let j in mapping[genres[i]]) {
                    let item = mapping[genres[i]][j];
                    if (!genreList[item]) genreList[item] = 1;
                    else genreList[item]++;
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
                    id={id}
                    addToPlaylist={this.addToPlaylist}
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

    addToPlaylist(id) {
        let playlist = this.state.playlist;
        let recs = this.state.recommendations;

        let track;
        recs.forEach(el => {
            if (el.id === id) track = el;
        })
        playlist.push(track);
        this.setState({
            playlist: playlist
        })
    }

    addAllToPlaylist() {
        let recs = this.state.recommendations;
        this.setState({
            playlist: recs
        });
    }

    clearPlaylist() {
        this.setState({
            playlist: []
        });
    }

    componentDidMount() {
        const params = getHashParams();
        if (params.access_token) {
            spotifyApi.setAccessToken(params.access_token);
            console.log("logged in successfully!")
        }
        this.getSeedTracks();
    }
    render() {
        let recs = this.createTracks(this.state.recommendations);
        let playlist = this.createTracks(this.state.playlist);
        return (
            <div>
                <h1>Jazzify</h1>
                <Container fluid>
                    <Row>
                        <Col id="recs-container" lg={5}>
                            <Row>
                                <Col lg={2}>
                                </Col>
                                <Col lg={7}>
                                    Song & Artist
                                </Col>
                                <Col lg={1}>
                                    <button onClick={this.addAllToPlaylist} className="btn">Add</button>
                                </Col>
                            </Row>
                            {recs}
                        </Col>
                        <Col id="filter-container" lg={2}>
                            <Row>
                                Filters
                            </Row>
                        </Col>
                        <Col id="playlist-container" lg={5}>
                            <Row>
                                <Col lg={2}>
                                </Col>
                                <Col lg={7}>
                                    Song & Artist
                                </Col>
                                <Col lg={1}>
                                    <button onClick={this.clearPlaylist} className="btn">Remove</button>
                                </Col>
                            </Row>
                            {playlist}
                        </Col>
                    </Row>
                </Container>
                <div>
                    <a id="login-btn" href={"http://localhost:8888/login"}>Login</a>
                </div>
            </div>
        )
    }
}

export default Home;