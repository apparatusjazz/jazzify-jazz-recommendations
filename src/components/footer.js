import About from './about';
import React, { useState } from 'react';
import GitHubIcon from '@material-ui/icons/GitHub';
import '../css/footer.css';

const Footer = (props) => {
    const [modalShow, setModalShow] = useState(false);

    return (
        <div className="footer">
            Project created by Maui Arcuri:
            <a
                href="https://github.com/apparatusjazz/jazzify-jazz-recommendations"
                target="_blank"
                rel="noopener noreferrer"
                title="Open in Spotify"
            >
                <GitHubIcon className="github" />
            </a>
            <button className="about-tag" onClick={() => setModalShow(true)}>
                About Jazzify
                        </button>
            <About
                show={modalShow}
                onHide={() => setModalShow(false)}
            />
        </div>
    )
}

export default Footer;
