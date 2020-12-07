import React, { useState } from 'react';
import { Navbar, Nav } from 'react-bootstrap';
import '../css/navigation.css';

const Navigation = (props) => {
    const logout = () => {
        window.location.hash = '';
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
                    {props.loggedIn ? <a target="_blank" rel="noopener noreferrer" className="btn logout" onClick={() => logout()} id="logout-btn" href={"https://www.spotify.com/logout"}>
                        Logout
                        </a> : ''}
                </Nav>
            </Navbar>
        </>
    )

}

export default Navigation;