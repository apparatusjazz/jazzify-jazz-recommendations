import React, { Component } from 'react';
import { Slider } from '@material-ui/core';

class Filter extends Component {
    handleChange(val) {
        this.props.storeValue(this.props.id, val)
    }
    render() {
        return (
            <>
                <Slider
                    value={this.props.value}
                    aria-labelledby="continuous-slider"
                    min={0}
                    max={1}
                    onChange={(event, val) => this.handleChange(val)}
                />
            </>
        )
    }
}

export default Filter;