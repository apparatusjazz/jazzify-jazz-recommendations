import React, { Component } from 'react';
import { Navbar, Nav, NavDropdown, Button } from 'react-bootstrap';

class Navigation extends Component {

    render() {
        return (
            <>
                <Navbar className="main-nav" bg="dark" variant="dark" expand="md">
                    <Navbar.Brand >Jazzify</Navbar.Brand>
                </Navbar>
            </>
        )
    }
}

export default Navigation;