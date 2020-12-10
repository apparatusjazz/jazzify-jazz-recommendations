import React, { useState } from 'react';
import { Navbar, Nav } from 'react-bootstrap';
import '../css/navigation.css';
import Cookies from 'js-cookie';

const Navigation = (props) => {
    const token = Cookies.get('spotifyAuthToken');
    const logout = () => {
        Cookies.remove('spotifyAuthToken');
        window.location.reload();
    }
    return (
        <>
            <Navbar className="main-nav" bg="dark" variant="dark" expand="md">
                <Navbar.Brand className="branding" >
                    <img
                        src='jazzify-logo.png'
                        width='70'
                    />
                </Navbar.Brand>
                <Nav className="ml-auto nav-right">
                    {token ? <button target="_blank" rel="noopener noreferrer" className="btn logout" onClick={() => logout()} id="logout-btn" href={"https://www.spotify.com/logout"}>
                        Logout
                        </button> : ''}
                </Nav>
            </Navbar>
        </>
    )

}

export default Navigation;