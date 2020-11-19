import React, { Component } from 'react';
import { Navbar, Nav } from 'react-bootstrap';
import '../css/navigation.css';

class Navigation extends Component {

    render() {
        return (
            <>
                <Navbar className="main-nav" bg="dark" variant="dark" expand="md">
                    <Navbar.Brand className="branding" >Jazzify</Navbar.Brand>
                    <Nav className="ml-auto nav-right">
                        <a target="_blank" rel="noopener noreferrer" className="btn" id="logout-btn" href={"https://www.spotify.com/logout"}>
                            Logout
                        </a>
                    </Nav>
                </Navbar>
            </>
        )
    }
}

export default Navigation;