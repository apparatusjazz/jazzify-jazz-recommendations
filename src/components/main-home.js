import React, { Component } from 'react';
import Spotify from 'spotify-web-api-js';
import { getHashParams, shuffle } from '../helpers';
import Track from './track';
import { Container, Col, Row } from 'react-bootstrap';
import jazzCollection from '../jazz-collection';
import initalMappings from '../initial-map';
import Filter from './filters';
import AudioFilters from './audioFilters';
import { Accordion, AccordionDetails, AccordionSummary, AppBar, CircularProgress, Switch, Typography } from '@material-ui/core';
import Navigation from './navigation';
import RefreshIcon from '@material-ui/icons/Refresh';
import '../css/main-home.css';
import AddIcon from '@material-ui/icons/Add';
import LoginPage from './login-page';
import OpenInNewRoundedIcon from '@material-ui/icons/OpenInNewRounded';
import Player from './player';
import Footer from './footer';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { SpotifyApiContext } from 'react-spotify-api';
import Cookies from 'js-cookie'

import PropTypes from 'prop-types';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Box from '@material-ui/core/Box';

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`tabpanel-${index}`}
            aria-labelledby={`recs-playlist-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box>
                    <Typography component={'div'}>{children}</Typography>
                </Box>
            )}
        </div>
    );
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.any.isRequired,
    value: PropTypes.any.isRequired,
};


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
            audioSwitch: false,
            playlist: [],
            playlistIDs: [],
            genreFilters: {},
            recs: [],
            audioFeatures: {},
            genreSelector: "acoustic",
            isPlaying: false,
            currentlyPlaying: "",
            loggedIn: false,
            savedPlaylist: [],
            loading: true,
            tabValue: 0
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
        this.removeAllGenres = this.removeAllGenres.bind(this);
        this.resetFilter = this.resetFilter.bind(this);
        this.createPlaylist = this.createPlaylist.bind(this);
        this.tabChange = this.tabChange.bind(this);
    }

    toggleSwitch() {
        this.setState({ audioSwitch: !this.state.audioSwitch });
    }
    tabChange(event, newVal) {
        this.setState({ tabValue: newVal });
    }

    resetFilter(id) {
        let modified = { ...this.state.audioFeatures };
        if (id !== "tempo") {
            modified[`min_${id}`] = 0;
            modified[`max_${id}`] = 1;
        } else {
            modified[`min_${id}`] = 40;
            modified[`max_${id}`] = 300;
        }
        this.setState({ audioFeatures: modified });
    }
    togglePlay() {
        let audio = document.getElementById(this.state.currentlyPlaying);
        if (audio === null) return;
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
            }).catch(err => console.log(err))
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
                }).catch(err => console.log(err))
                for (let i in properties) {     // Get averages of audio features
                    properties[i] = properties[i] / count;
                }
                properties = this.processAnalysis(properties);
                return properties;
            }).catch(err => console.log(err))
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
            let min = val - .2 >= 0 ? val - .2 : 0;
            let max = val + .2 <= 1 ? val + .2 : 1;
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
            let genres = [];
            res.items.forEach(idx => {
                for (let i in idx.genres) {
                    let splitWords = idx.genres[i].split(" ");
                    for (let j in splitWords) {
                        genres.push(splitWords[j]);
                    }
                }
            })
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
        let idx = 0;
        // console.log(artists, scaledGenres)
        for (let i in scaledGenres) {       // delete genres that have the track count = 0
            if (genreTrackNum[idx] === 0) {
                delete scaledGenres[i];
            }
            idx++;
        }

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
                filterGenres: scaledGenres,
                loading: false
            });
        }).catch((err) => {
            console.log("There was an error...", err);
            window.location.reload();
        })
    }

    updateRecommendations() {
        let scaledGenres = this.scaleGenreStats(this.state.scaledGenres);
        let genreTrackNum = this.calcTracksPerGenre(scaledGenres);
        let collection = this.getArtistsFromCollection(scaledGenres, jazzCollection);
        this.getRecommendations(scaledGenres, collection, {}, this.state.audioFeatures, genreTrackNum);
        this.setState({ loading: true });
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

    checkCollection() {
        for (let i in jazzCollection) {
            jazzCollection[i].forEach(artist => {
                spotifyApi.getArtist(artist).then(res => { }).catch(err => console.log("not available", artist));
            })
        }
    }

    createTracks(recommendations) {
        let track = (id, album, song, artist, preview, url) => {
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
                    url={url}
                />
            )
        }
        return recommendations.map(el =>
            track(el.id, el.album.images[2].url, el.name, el.artists[0].name, el.preview_url, el.external_urls.spotify)
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
    audioFilter = (name, actualName, values, floor, ceil, func, type, reset) => {
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
            reset={reset}
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
            values.push(this.audioFilter(filterNames[i], actualNames[i], [min, max], floor, ceil, this.storeValue, "audio", this.resetFilter))
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
    removeAllGenres() {
        this.setState({
            scaledGenres: [],
            filterGenres: []
        });
    }
    createPlaylist() {
        const equals = (a, b) =>
            a.length === b.length &&
            a.every((v, i) => v === b[i]);

        if (equals(this.state.playlistIDs, this.state.savedPlaylist)) return;
        let current = [...this.state.playlistIDs.map(id => `spotify:track:${id}`)];
        if (current.length < 1) return;
        let date = Date().split(" ");
        let dateString = `${date[1]}-${date[2]}-${date[3]}`;
        spotifyApi.createPlaylist(this.displayName, {
            "name": `Jazzify: ${dateString}`,
            "description": "Playlist created by Jazzify Jazz Recommendations"
        }).then(res => {
            const playlistId = res.id;
            spotifyApi.addTracksToPlaylist(playlistId, current).then(() => {
                window.open(`https://open.spotify.com/playlist/${playlistId}`)
            })
            this.setState({ savedPlaylist: this.state.playlistIDs });
        }).catch(err => console.log(err.response))
    }
    getCurrentPlayingInfo() {
        let current = this.state.currentlyPlaying.split("-")[1];
        let recs = [...this.state.recommendations];

        for (let i = 0; i < recs.length; i++) {
            if (recs[i].id === current) {
                return [recs[i].album.images[2].url, recs[i].artists[0].name, recs[i].name];
            }
        }
        return ["", "", ""]
    }
    componentDidMount() {
        // const params = getHashParams();
        // if (params.access_token) {
        //     spotifyApi.setAccessToken(params.access_token);
        //     console.log("logged in successfully!")
        // }
        window.location.hash = '';
        const token = Cookies.get('spotifyAuthToken');
        spotifyApi.setAccessToken(token);
        spotifyApi.getMe().then(data => {
            this.country = data.country;
            this.userId = data.id;
            this.displayName = data.display_name;
            this.getSeedTracks();
            this.setState({ loggedIn: true })
        }).catch(err => this.setState({ loggedIn: false }))

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
            <AddIcon className="add-icon" onClick={() => this.addGenre()} />
        </>;

        const playingInfo = this.getCurrentPlayingInfo();
        const progressClass = this.state.loading ? "show" : "hide";
        const rowClass = !this.state.loading ? "show" : "hide";
        const audioFilterClass = this.state.audioSwitch ? 'audio-filter-container' : 'audio-filter-container-inactive';
        let login = <><Navigation loggedIn={this.state.loggedIn} /><LoginPage /></>
        let mainContent = <div>
            <Navigation loggedIn={this.state.loggedIn} />
            <Container fluid className="jazzify-main">
                <CircularProgress className={`${progressClass} loading-icon`} />
                <Col className={`${rowClass} filter-container mobile accordion`} lg={2} md={2}>
                    <Accordion className="mobile accordion">
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls="panel1a-content"
                            id="panel1a-header"
                        >
                            <Typography component={'div'}>MODIFY FILTERS
                            <button className="refresh-btn btn-style" onClick={this.updateRecommendations}>
                                    <RefreshIcon />
                                </button>
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography component={'div'}>
                                <div className={audioFilterClass}>
                                    <div className="audio-filters">
                                        Audio Filters
                                <Switch checked={this.state.audioSwitch} size="medium" onChange={this.toggleSwitch} />
                                    </div>
                                    {audioF}
                                </div>
                                <div className="genre-filter-container">
                                    Base Genres
                                <div><button className="btn-style clear-all" onClick={this.removeAllGenres}>Clear All</button></div>
                                    <div>{genres}</div>
                                    {genreFilt}
                                    <button className="refresh-btn btn-style" onClick={this.updateRecommendations}>
                                        <RefreshIcon />
                                    Refresh
                                    </button>
                                </div>

                            </Typography>
                        </AccordionDetails>
                    </Accordion>
                </Col>
                <div className={`mobile tabs ${rowClass}`}>
                    <AppBar position="static">
                        <Tabs value={this.state.tabValue} variant="fullWidth" onChange={this.tabChange} aria-label="recs-playlist-tabs">
                            <Tab label="Recommendations" />
                            <Tab label="Playlist" />
                        </Tabs>
                    </AppBar>
                    <TabPanel value={this.state.tabValue} index={0}>
                        <Col className="recs-container" lg={5} md={5} xs={12}>
                            <Row className="playlist-row-1">
                                <button onClick={this.addAllToPlaylist} className="btn-style add-all">Add All</button>
                            </Row>
                            {recs.length === 0 ? "No results found, try to adjust the filters." : recs}
                        </Col>

                    </TabPanel>
                    <TabPanel value={this.state.tabValue} index={1}>
                        <Col className="playlist-container" lg={5} md={5}>
                            <Row className="playlist-row">
                                <span>
                                    <button className="btn-style add-playlist" onClick={this.createPlaylist}>Create Playlist</button>
                                </span>
                                {this.state.playlistIDs.length > 0 ? <button onClick={this.clearPlaylist} className="btn-style remove-all">Remove All</button> : ""}
                            </Row>
                            {playlist}
                        </Col>
                    </TabPanel>
                </div>
                <Row className={`${rowClass}`}>
                    <Col className="recs-container desktop" lg={5} md={5} xs={12}>
                        <Row className="playlist-row-1">
                            <button onClick={this.addAllToPlaylist} className="btn-style add-all">Add All</button>
                        </Row>
                        {recs.length === 0 ? "No results found, try to adjust the filters." : recs}
                    </Col>
                    <Col className="filter-container desktop" lg={2} md={2} xs={12}>

                        <div className={audioFilterClass}>
                            <div>
                                Audio Filters
                                <Switch checked={this.state.audioSwitch} size="small" onChange={this.toggleSwitch} />
                            </div>
                            {audioF}
                        </div>
                        <div className="genre-filter-container">
                            Base Genres
                                <div><button className="btn-style clear-all" onClick={this.removeAllGenres}>Clear All</button></div>
                            <div>{genres}</div>
                            {genreFilt}
                            <button className="btn-style" onClick={this.updateRecommendations}>
                                <RefreshIcon />
                                    Refresh
                                    </button>
                        </div>

                    </Col>
                    <Col className="playlist-container desktop" lg={5} md={5}>
                        <Row className="playlist-row">
                            <span>
                                <button className="btn-style add-playlist" onClick={this.createPlaylist}>Create Playlist</button>
                            </span>
                            {this.state.playlistIDs.length > 0 ? <button onClick={this.clearPlaylist} className="btn-style remove-all">Remove All</button> : ""}
                        </Row>
                        {playlist}
                    </Col>
                </Row>
                <Row className={`${rowClass} footer`}>
                    <Footer />
                </Row>
            </Container>

            <Player
                playing={this.state.isPlaying}
                img={playingInfo[0]}
                artistName={playingInfo[1]}
                songName={playingInfo[2]}
                togglePlay={this.togglePlay}
            />
        </div >;
        return (
            mainContent
        )
    }
}

export default Home;