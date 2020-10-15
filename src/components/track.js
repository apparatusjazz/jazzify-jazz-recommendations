import React, { Component } from 'react'
import { Container, Row, Col } from 'react-bootstrap';

class Track extends Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <Row>
                <Col lg={2}>
                    <img src={this.props.album} alt="Album Cover" />
                </Col>
                <Col lg={5}>

                    {this.props.song}
                </Col>
                <Col lg={5}>
                    {this.props.artist}
                </Col>
            </Row>

        )
    }
}

export default Track;