import React from 'react'
import { SpotifyApiContext } from 'react-spotify-api';
import Cookies from 'js-cookie'
import { SpotifyAuth, Scopes } from 'react-spotify-auth';
import 'react-spotify-auth/dist/index.css'
import Home from './components/main-home';
import Navigation from './components/navigation';
import './App.css';

const App = () => {
  const token = Cookies.get('spotifyAuthToken')
  return (
    <div className='app'>
      {token ? (
        <SpotifyApiContext.Provider value={token}>
          <Home />
        </SpotifyApiContext.Provider>
      ) : (
          // Display the login page
          <>
            <Navigation />
            <div className="login-page">
              <h2>Jazzify</h2>
              <p>
                Get jazz recommendations easily with Jazzify, powered by Spotify.
            </p>
            </div>
            <div>
              <SpotifyAuth
                title='Login with Spotify'
                redirectUri='http://localhost:3001/'
                onAccessToken={() => window.location.reload()}
                clientID='7f6f4b0793024b7691ba39cad03291cb'
                scopes={[Scopes.userReadPrivate,
                  'user-read-private user-top-read user-read-email user-read-playback-state streaming playlist-modify-public playlist-modify-private']} // either style will work
              />
            </div>
          </>
        )}
    </div>
  )
}
export default App