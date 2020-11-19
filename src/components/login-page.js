import React, { useState, useEffect } from 'react';
import '../css/login-page.css';

const LoginPage = (props) => {
    const handleClick = () => {
        props.login();
    };

    return (
        <>
            <h2>Jazzify</h2>
            <p>
                Get jazz recommendations easily with Jazzify, powered by Spotify.
        </p>
            <a className="login-btn" href={"http://localhost:8888/login"}>
                Login with Spotify
            </a>
        </>
    )
}

export default LoginPage;