import React from 'react';
import '../css/login-page.css';

const LoginPage = (props) => {
    const handleClick = () => {
        props.login();
    };

    return (
        <>
            <div className="login-page">
                <h2>Jazzify</h2>
                <p>
                    Get jazz recommendations easily with Jazzify, powered by Spotify.
            </p>
                <a className="login-btn btn-style" href={"http://localhost:8888/login"}>
                    Login with Spotify
            </a>
            </div>
        </>
    )
}

export default LoginPage;