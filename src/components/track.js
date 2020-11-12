import React, { Component } from 'react'
import { Row, Col } from 'react-bootstrap';
import '../css/track.css';
import PlayArrowRoundedIcon from '@material-ui/icons/PlayArrowRounded';
import PauseCircleFilledRoundedIcon from '@material-ui/icons/PauseCircleFilledRounded';
import AddRoundedIcon from '@material-ui/icons/AddRounded';
import BlockIcon from '@material-ui/icons/Block';
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';

class Track extends Component {
    togglePlay() {
        let audio = `audio-${this.props.id}`;
        if (this.props.currentlyPlaying !== audio) {
            this.props.updateCurrent(audio);
        } else
            this.props.togglePlay();
    }
    componentDidMount() {
        this.playing = false;
    }
    addRemovefromPlaylist(inPlaylist) {
        this.props.addRemoveFromPlaylist(this.props.id, inPlaylist);
    }
    render() {
        let play = this.props.isPlaying && this.props.currentlyPlaying == `audio-${this.props.id}` ? <PauseCircleFilledRoundedIcon /> : <PlayArrowRoundedIcon />;
        let inPlaylist = (id) => {
            let playlist = this.props.playlist;
            if (playlist.includes(this.props.id))
                return <RemoveCircleOutlineIcon onClick={() => this.addRemovefromPlaylist(true)} />;
            else
                return <AddCircleOutlineIcon onClick={() => this.addRemovefromPlaylist(false)} />;
        };
        let addRemove = inPlaylist(this.props.id);
        return (
            <Row>
                <Col className="play-container" md="auto" lg="auto" sm="auto" xs="auto" onClick={() => this.togglePlay()}>
                    <audio src={this.props.preview} id={`audio-${this.props.id}`}></audio>
                    {this.props.preview !== null ? play : <BlockIcon />}
                </Col>
                <Col md="auto" lg="auto" sm="auto" xs="auto">
                    <img className="album-art" src={this.props.album} alt="Album Cover" />
                </Col>

                <Col lg={6} md={6} sm={6} xs={6}>
                    <Row className="song text">
                        {this.props.song}
                    </Row>
                    <Row className="artist text">
                        {this.props.artist}
                    </Row>
                </Col>

                <Col md="auto" lg="auto" sm="auto" xs="auto">
                    {addRemove}
                </Col>
            </Row>

        )
    }
}

export default Track;