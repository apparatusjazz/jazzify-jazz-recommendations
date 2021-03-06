import React from 'react';
import '../css/player.css';
import PlayArrowRoundedIcon from '@material-ui/icons/PlayArrowRounded';
import PauseCircleFilledRoundedIcon from '@material-ui/icons/PauseCircleFilledRounded';
import AlbumIcon from '@material-ui/icons/Album';


const Player = (props) => {
    const defaultAlbum = <AlbumIcon className="p-el default-album" />
    const play = !props.playing ? <PlayArrowRoundedIcon className="play" /> : <PauseCircleFilledRoundedIcon className="pause" />;
    return (
        <>
            <div className="player">
                <div className="p-container">
                    {props.img === '' ? defaultAlbum : <img className="p-el album-player" src={props.img} />}
                    <div className="p-el info-container">
                        <div className="p-el song">{props.songName}</div>
                        <div className="p-el artist">{props.artistName}</div>
                    </div>
                    <div className="p-el play-button">
                        <button onClick={() => props.togglePlay()}>{play}</button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Player;