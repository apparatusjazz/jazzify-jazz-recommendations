import React, { Component } from 'react'
import { Row, Col } from 'react-bootstrap';
import '../css/track.css';

class Track extends Component {

    render() {
        return (
            <Row>
                <Col lg={2}>
                    <img className="album-art" src={this.props.album} alt="Album Cover" />
                </Col>

                <Col lg={5}>
                    <Row className="song text">
                        {this.props.song}
                    </Row>
                    <Row className="artist text">
                        {this.props.artist}
                    </Row>
                </Col>

                <Col lg={1}>
                    <button className="btn" onClick={() => { this.props.addToPlaylist(this.props.id) }}>+</button>
                </Col>
            </Row>

        )
    }
}

export default Track;