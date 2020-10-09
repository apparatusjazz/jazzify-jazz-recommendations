import React, { Component } from 'react'

class Track extends Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <div>
                <img src={this.props.album} alt="Album Cover" />
                {this.props.song}
                {this.props.artist}
            </div>
        )
    }
}

export default Track;