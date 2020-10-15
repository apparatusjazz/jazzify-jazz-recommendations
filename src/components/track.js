import React, { Component } from 'react'
import { Container, Row, Col } from 'react-bootstrap';

class Track extends Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <Row>
                <Col lg={1}>
                    <img src={this.props.album} alt="Album Cover" />
                </Col>
                <Col lg={5}>

                    {this.props.song}
                </Col>
                <Col lg={5}>
                    {this.props.artist}
                </Col>
                <Col lg={1}>
                    <button className="btn" onClick={() => { this.props.addToPlaylist(this.props.id) }}>+</button>
                </Col>
            </Row>

        )
    }
}

export default Track;