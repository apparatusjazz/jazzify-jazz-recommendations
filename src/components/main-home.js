import React, { Component } from 'react';
import Spotify from 'spotify-web-api-js';
import { getHashParams, shuffle } from '../helpers';
import Track from './track';
import { Container, Col, Row } from 'react-bootstrap';
import jazzCollection from '../jazz-collection';
import initalMappings from '../initial-map';
import Filter from './filters';
import AudioFilters from './audioFilters';
import { Switch } from '@material-ui/core';
import Navigation from './navigation';
import RefreshIcon from '@material-ui/icons/Refresh';
import '../css/main-home.css';
import AddIcon from '@material-ui/icons/Add';

const NUMOFTRACKS = 30;
const spotifyApi = new Spotify();
const filterNames = ["Danceability", "Energy", "Acoustics", "Instrumentalness", "Mood", "Tempo"];
const actualNames = ["danceability", "energy", "acousticness", "instrumentalness", "valence", "tempo"];
const filterParams = [
    ["Undanceable", "Pumping"],
    ["Unenergetic", "Energetic"],
    ["Digital", "Acoustic"],
    ["Vocal", "Instrumental"],
    ["Melancholy", "Cheerful"],
    ["Slow", "Fast"]
];

class Home extends Component {
    constructor(props) {
        super(props);
        this.state = {
            recommendations: [],
            scaledGenres: {},
            filterGenres: {},
            audioSwitch: true,
            playlist: [],
            playlistIDs: [],
            genreFilters: {},
            recs: [],
            audioFeatures: {},
            genreSelector: "acoustic",
            isPlaying: false,
            currentlyPlaying: ""
        }
        this.addRemoveFromPlaylist = this.addRemoveFromPlaylist.bind(this);
        this.addAllToPlaylist = this.addAllToPlaylist.bind(this);
        this.clearPlaylist = this.clearPlaylist.bind(this);
        this.storeValue = this.storeValue.bind(this);
        this.updateRecommendations = this.updateRecommendations.bind(this);
        this.togglePlay = this.togglePlay.bind(this);
        this.updateCurrentlyPlaying = this.updateCurrentlyPlaying.bind(this);
        this.toggleSwitch = this.toggleSwitch.bind(this);
        this.removeGenre = this.removeGenre.bind(this);
    }

    toggleSwitch() {
        this.setState({ audioSwitch: !this.state.audioSwitch });
    }
    togglePlay() {
        let audio = document.getElementById(this.state.currentlyPlaying);
        if (this.state.isPlaying) {
            audio.pause();
        } else audio.play();
        this.setState({ isPlaying: !this.state.isPlaying });
    }

    updateCurrentlyPlaying(id) {
        let audio = document.getElementById(this.state.currentlyPlaying);
        if (audio !== null) audio.pause();
        this.setState({
            currentlyPlaying: id,
            isPlaying: true
        });
        document.getElementById(id).play();
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
            return scaledGenres;
        })

    }

    analyzeTracks() {   // Analyze and return average of properties of top tracks
        let ids = [];   // return val {danceability: 0.5746500000000001, energy: 0.57945, …}
        spotifyApi.getMyTopTracks({ "time_range": "medium_term" }).then(res => {
            ids = res.items.map(item => item.id);
        }).then(
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
            })
        )

    }

    processAnalysis(properties) {
        delete properties["duration_ms"];
        delete properties["key"];
        delete properties["mode"];
        delete properties["speechiness"];
        delete properties["time_signature"];
        delete properties["liveness"];
        delete properties["loudness"];

        let newProps = {};
        for (let key in properties) {
            let val = properties[key];
            let min = val - .15 >= 0 ? val - .15 : 0;
            let max = val + .15 <= 1 ? val + .15 : 1;
            if (key === "tempo") {
                min = 30;
                max = 300;
            }
            newProps[`min_${key}`] = min;
            newProps[`max_${key}`] = max;
        }
        this.setState({
            audioFeatures: newProps
        })
        return newProps;
    }

    // return value ex. {"pop": 0.6, "rock": 0.4}
    scaleGenreStats(genres) {       // Scale genre percentages to correct percentage ex. genre: 0.28 >> 0.36
        let sum = 0;
        for (let i in genres) sum += genres[i];
        for (let i in genres) {
            genres[i] = genres[i] / sum;
        }
        this.setState({ scaledGenres: genres });
        return genres;
    }

    getArtistsFromCollection(genres, collection) {  // Returns a jazz collection with only target genres
        let artists = {};
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
        return artists;
        /* return example
        {
        pop: (2) ["3uoY3Ibj2qOK3bb47cpKs6", "1FC0psUheo5L2kUtj53MF9"]
        rock: (2) ["6ra4GIOgCZQZMOaUECftGN", "1W8TbFzNS15VwsempfY12H"]
        }
        */
    }

    getSeedTracks() {       // Return track ids by genre to feed into recommendation
        let scaledGenres, artistCollection, audioProperties, ids = [];

        spotifyApi.getMyTopArtists({ "time_range": "medium_term" }).then(res => {
            let genres = {};
            res.items.forEach(idx => {
                for (let i in idx.genres) {
                    let splitWords = idx.genres[i].split(" ");
                    for (let j in splitWords) {
                        genres[i] = splitWords[j];
                    }
                }
            });
            let a = this.mapInitialGenres(genres, initalMappings);
            scaledGenres = this.scaleGenreStats(a);
            artistCollection = this.getArtistsFromCollection(scaledGenres, jazzCollection);
        }).then(() =>
            spotifyApi.getMyTopTracks({ "time_range": "medium_term" })
        )
            .then(res => {
                ids = res.items.map(item => item.id);
            }).then(
                () => spotifyApi.getAudioFeaturesForTracks(ids)
            ).then(res => {
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
                audioProperties = this.processAnalysis(properties);
            })
            .then(() => {
                let tracks = {};
                let requests = [];
                for (let i in artistCollection) {
                    tracks[i] = [];
                    for (let j = 0; j < artistCollection[i].length; j++) {
                        requests.push(spotifyApi.getArtistTopTracks(artistCollection[i][j], this.country));
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
                        scaledGenres,
                        artistCollection,
                        tracks,
                        audioProperties,
                        this.calcTracksPerGenre(scaledGenres)
                    );
                })
            })
    }
    getRecommendations(scaledGenres, artists, tracks, audioProperties, genreTrackNum) {
        let recommendations = [], trackIds = [];
        let requests = [];
        console.log(artists)

        for (let i in artists) {
            let params = {
                "limit": 30,
                "market": this.country,
                "seed_artists": artists[i],
                // "seed_tracks": tracks[i],
                // "seed_genres": "jazz"
            };
            if (this.state.audioSwitch) {
                for (let key in audioProperties) {
                    params[key] = audioProperties[key];
                }
            }
            requests.push(
                spotifyApi.getRecommendations(params)
            )
        }

        Promise.all(requests).then(data => {
            let idx = 0;
            data.forEach(el => {
                for (let i = 0; i < genreTrackNum[idx]; i++) {
                    if (el.tracks[i] !== undefined && !trackIds.includes(el.tracks[i].id)) {
                        trackIds.push(el.tracks[i].id);
                        recommendations.push(el.tracks[i]);
                    }
                }
                idx++;
            });
            shuffle(recommendations);
            this.setState({
                recommendations: recommendations,
                scaledGenres: scaledGenres,
                filterGenres: scaledGenres
            });
        })
    }

    updateRecommendations() {
        let genreTrackNum = this.calcTracksPerGenre(this.state.scaledGenres);
        let collection = this.getArtistsFromCollection(this.state.scaledGenres, jazzCollection);
        this.getRecommendations(this.state.scaledGenres, collection, {}, this.state.audioFeatures, genreTrackNum);
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
        let genreList = {};
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
        let track = (id, album, song, artist, preview) => {
            return (
                <Track
                    key={id}
                    id={id}
                    addRemoveFromPlaylist={this.addRemoveFromPlaylist}
                    album={album}
                    song={song}
                    artist={artist}
                    preview={preview}
                    isPlaying={this.state.isPlaying}
                    currentlyPlaying={this.state.currentlyPlaying}
                    togglePlay={this.togglePlay}
                    updateCurrent={this.updateCurrentlyPlaying}
                    playlist={this.state.playlistIDs}
                />
            )
        }
        return recommendations.map(el =>
            track(el.id, el.album.images[2].url, el.name, el.artists[0].name, el.preview_url)
        )
    }

    addRemoveFromPlaylist(id, inPlaylist) {
        let playlist = [...this.state.playlist];
        let playlistIds = [...this.state.playlistIDs];
        if (!inPlaylist) playlistIds.push(id);
        else {
            playlistIds.splice(playlistIds.indexOf(id), 1);
        }
        let recs = [...this.state.recommendations];
        let track;
        if (inPlaylist) {
            for (let i = 0; i < playlist.length; i++) {
                if (playlist[i].id === id) {
                    playlist.splice(i, 1);
                    break;
                }
            }
        } else {
            for (let i = 0; i < recs.length; i++) {
                if (recs[i].id === id) {
                    track = recs[i];
                    playlist.push(track);
                    break;
                }
            }
        }
        this.setState({
            playlist: playlist,
            playlistIDs: playlistIds
        })
    }

    addAllToPlaylist() {
        let recs = this.state.recommendations;
        let playlistIds = this.state.recommendations.map(el => el.id);
        this.setState({
            playlist: recs,
            playlistIDs: playlistIds
        });
    }

    clearPlaylist() {
        this.setState({
            playlist: [],
            playlistIDs: []
        });
    }
    filter = (name, value, func, type) => {
        let min = name === "target_tempo" ? 30 : 0;
        let max = name === "target_tempo" ? 350 : 100;
        let val = name === "target_tempo" ? value : value * 100;
        return (<Filter
            key={name}
            value={val}
            name={name}
            type={type}
            min={min}
            max={max}
            storeValue={func}
            removeGenre={this.removeGenre}
        />)
    }
    audioFilter = (name, actualName, values, floor, ceil, func, type) => {
        let param = filterParams[filterNames.indexOf(name)];

        return <AudioFilters
            key={name}
            value={values}
            actualName={actualName}
            name={name}
            type={type}
            min={floor}
            max={ceil}
            param={param}
            storeValue={func}
        />
    }
    generateFilters(input, type) {
        let arr = [];
        for (let key in input) {
            arr.push(this.filter(key, input[key], this.storeValue, type));
        }
        return arr;
    }
    generateAudioFilters(input) {
        let values = [];
        for (let i = 0; i < filterNames.length; i++) {
            let min = input[`min_${actualNames[i]}`] * 100;
            let max = input[`max_${actualNames[i]}`] * 100;
            let floor = 0;
            let ceil = 100;
            if (filterNames[i] === "Tempo") {
                min = input[`min_${actualNames[i]}`];
                max = input[`max_${actualNames[i]}`];
                floor = 40;
                ceil = 300;
            }
            values.push(this.audioFilter(filterNames[i], actualNames[i], [min, max], floor, ceil, this.storeValue, "audio"))
        }
        return values;
    }
    generateGenreFilters(genres) {
        let arr = [];
        for (let i in genres) {
            let string = i;
            // string = string.charAt(0).toUpperCase() + string.slice(1);
            arr.push(this.filter(string, genres[i], this.storeValue, "genre"));
        }
        return arr;
    }
    storeValue(id, val, type) {  // adjust filters
        if (type === "genre") {
            let modified = { ...this.state.filterGenres };
            modified[id] = val;
            let filterGenres = { ...this.state.filterGenres };
            filterGenres[id] = val;
            modified = this.scaleGenreStats(modified);
            this.setState({
                scaledGenres: modified,
                filterGenres: filterGenres
            });
        } else {    // type == "audio"
            let modified = { ...this.state.audioFeatures };
            if (id !== "tempo") {
                modified[`min_${id}`] = val[0] / 100;
                modified[`max_${id}`] = val[1] / 100;
            } else {
                modified[`min_${id}`] = val[0];
                modified[`max_${id}`] = val[1];
            }
            this.setState({ audioFeatures: modified });
        }
    }
    handleChangeGenre(event) {
        event.preventDefault();
        this.setState({ genreSelector: event.target.value });
    }
    addGenre() {
        let scaledGenres = { ...this.state.scaledGenres };
        scaledGenres[this.state.genreSelector] = 0;
        let filterGenres = { ...this.state.filterGenres };
        filterGenres[this.state.genreSelector] = 0;
        this.setState({
            scaledGenres: scaledGenres,
            filterGenres: filterGenres
        });
    }
    removeGenre(name) {
        let scaledGenres = { ...this.state.scaledGenres };
        delete scaledGenres[name];
        let filterGenres = { ...this.state.filterGenres };
        delete filterGenres[name];
        this.setState({
            scaledGenres: scaledGenres,
            filterGenres: filterGenres
        });
    }
    componentDidMount() {
        const params = getHashParams();
        if (params.access_token) {
            spotifyApi.setAccessToken(params.access_token);
            console.log("logged in successfully!")
        }
        spotifyApi.getMe().then(data => {
            this.country = data.country;
            this.getSeedTracks();
        })
    }
    render() {
        let recs = this.createTracks(this.state.recommendations);
        let playlist = this.createTracks(this.state.playlist);
        let audioF = this.generateAudioFilters(this.state.audioFeatures);
        let genreFilt = this.generateGenreFilters(this.state.filterGenres);
        let options = [];
        for (let key in jazzCollection) {
            if (this.state.scaledGenres[key] === undefined) {
                options.push(key);
            }
        }
        let genres = <>
            <select className="selector" name="genres" onChange={(event) => this.handleChangeGenre(event)}>
                {options.map(el => <option key={el} value={el}>{el}</option>)}
            </select>
            <AddIcon onClick={() => this.addGenre()} />
        </>

        return (
            <div>
                <Navigation />
                <Container fluid>
                    <Row>
                        <Col id="recs-container" lg={5} md={5} xs={12}>
                            <Row>
                                <Col >
                                </Col>
                                <Col lg={6} md={6} sm={6} xs={6}>
                                    Song & Artist
                                </Col>
                                <Col md="auto" lg="auto" sm="auto" xs="auto">
                                    <button onClick={this.addAllToPlaylist} className="btn">Add All</button>
                                </Col>
                            </Row>
                            {recs}
                        </Col>
                        <Col id="filter-container" lg={2} md={2}>
                            <div className="audio-filter-container">
                                <div>
                                    Audio Filters
                                <Switch checked={this.state.audioSwitch} size="small" onChange={this.toggleSwitch} />
                                </div>
                                {audioF}
                            </div>
                            <div className="genre-filter-container">
                                Genres
                                <div>{genres}</div>
                                {genreFilt}
                                <button className="refresh-btn btn" onClick={this.updateRecommendations}>
                                    <RefreshIcon />
                                    Refresh
                                    </button>
                            </div>
                        </Col>
                        <Col id="playlist-container" lg={5} md={5}>
                            <Row>
                                <Col lg={2} md={2}>
                                </Col>
                                <Col lg={6} md={6} sm={6} xs={6}>
                                    Song & Artist
                                </Col>
                                <Col md="auto" lg="auto" sm="auto" xs="auto">
                                    <button onClick={this.clearPlaylist} className="btn">Remove All</button>
                                </Col>
                            </Row>
                            {playlist}
                        </Col>
                    </Row>
                </Container>
                <div>
                    <a id="login-btn" href={"http://localhost:8888/login"}>Login</a>
                    <a target="_blank" rel="noopener noreferrer" id="logout-btn" href={"https://www.spotify.com/logout"}>Logout</a>
                </div>
            </div>
        )
    }
}

export default Home;