import React from 'react';
import '../css/player.css';
import PlayArrowRoundedIcon from '@material-ui/icons/PlayArrowRounded';
import PauseCircleFilledRoundedIcon from '@material-ui/icons/PauseCircleFilledRounded';


const Player = (props) => {

    const play = !props.playing ? <PlayArrowRoundedIcon className="play" /> : <PauseCircleFilledRoundedIcon className="pause" />;

    return (
        <>
            <div className="player">
                <img className="album-player" src={props.img} />
                <div className="info-container">
                    <div>{props.songName}</div>
                    <div>{props.artistName}</div>
                </div>
                <div className="play-button">
                    {play}
                </div>
            </div>
        </>
    )
}

export default Player;