import React, { Component } from 'react';
import { Slider } from '@material-ui/core';
import '../css/filters.css';

class Filter extends Component {
    handleChange(val) {
        let value = this.props.name === "target_tempo" ? val : val / 100;
        this.props.storeValue(this.props.name, value, this.props.type)
    }
    render() {
        return (
            <>
                <div className="filter-name">{this.props.name}</div>
                <Slider
                    key={this.props.name}
                    value={this.props.value}
                    aria-labelledby="continuous-slider"
                    min={this.props.min}
                    max={this.props.max}
                    onChange={(event, val) => this.handleChange(val)}
                />
            </>
        )
    }
}

export default Filter;