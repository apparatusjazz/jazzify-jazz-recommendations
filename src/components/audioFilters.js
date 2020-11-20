import React, { Component } from 'react';
import { Slider } from '@material-ui/core';
import '../css/filters.css';
import RotateLeftIcon from '@material-ui/icons/RotateLeft';

class AudioFilters extends Component {
    handleChange(val, key) {
        this.props.storeValue(key, val, this.props.type);
    }
    handleClick() {
        this.props.reset(this.props.actualName);
    }
    render() {
        let display = this.props.actualName === "tempo" ? "auto" : "off";
        return (
            <>
                <div className="filter-name">{this.props.name}</div>
                <RotateLeftIcon className="reset remove-genre" onClick={() => this.handleClick()} />
                <Slider
                    key={this.props.name}
                    value={this.props.value}
                    valueLabelDisplay={display}
                    min={this.props.min}
                    max={this.props.max}
                    onChange={(event, val) => this.handleChange(val, this.props.actualName)}
                />
                <span className="filter-name-left">{this.props.param[0]}</span>
                <span className="filter-name-right">{this.props.param[1]}</span>
                <hr></hr>
            </>
        )
    }
}

export default AudioFilters;