import About from './about';
import React, { useState } from 'react';
import GitHubIcon from '@material-ui/icons/GitHub';

const Footer = (props) => {
    const [modalShow, setModalShow] = useState(false);

    return (
        <>
            Project created by Maui Arcuri
            <GitHubIcon />
            <a onClick={() => setModalShow(true)}>
                About Jazzify
                        </a>
            <About
                show={modalShow}
                onHide={() => setModalShow(false)}
            />
        </>
    )
}

export default Footer;
