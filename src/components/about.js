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
            <Modal.Body>
                <p>
                    Jazzify was made to provide highly customizable jazz recommendations based on your top Spotify genres.
                </p>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={props.onHide}>Close</Button>
            </Modal.Footer>
        </Modal>
    );
}

export default About;