import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import '../css/about.css';

function About(props) {
    return (
        <Modal
            {...props}
            size="lg"
            aria-labelledby="contained-modal-title-vcenter"
            centered
            className="about-modal"
        >
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                    About Jazzify
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="modal-body">
                <p>
                    Jazzify was made to provide highly customizable jazz recommendations based on your top Spotify genres.
                    <br></br><br></br>
                    The audio filters section, turned off by default, allows you to tune the recommendations to your tastes based
                    on audio qualities. The default values given are based on an analysis of your most listened to music.
                    <br></br><br></br>
                    The genre filters section adds genres based on your most listened to genres, however, this may not always reflect
                    your actual most listened to genres as Jazzify may add extra genres in processing. You can add and remove genres
                    and the amount of recommendations based on those genres with the sliders. The jazz music recommendations are based on
                    these genres. Ideally, the songs and artists in the recommendations will have similar elements to the genres listed.
                    <br></br><br></br>
                    Short audio previews are available for many of the recommendations. Don't sleep on the songs with no previews though,
                    as an avid jazz fan, some of the recommendations with no previews are truly great jazz music.
                    <br></br><br></br>
                    Jazzify is not an official Spotify application, however it uses Spotify's developer API to process your info and get recommendations.
                </p>
            </Modal.Body>
            <button className="close-modal" onClick={props.onHide}>Close</button>
        </Modal>
    );
}

export default About;