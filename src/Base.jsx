import React, { useEffect, useState } from 'react';

function Base( { isLoggedIn } ) {
  const [userData, setUserData] = useState(null);
  const [csrfToken, setCsrfToken] = useState('');
  const jwtToken = localStorage.getItem("jwt");


  // Fetch CSRF token from the server
  useEffect(() => {
      fetch('/s/csrf-token')
          .then(response => response.json())
          .then(data => {
              setCsrfToken(data.csrfToken);
          })
          .catch(err => {
              console.error('Error fetching CSRF token:', err);
          });
  }, []);

  // Get user info from the server at /user
  useEffect(() => {
    isLoggedIn &&
      fetch('/s/user', {
          method: 'GET',
          headers: {
              'Content-Type': 'application/json',
              'CSRF-Token': csrfToken,
              'Authorization': `Bearer ${jwtToken}`
          },
          credentials: 'include'
      })
      .then(response => {
          if (!response.ok) {
              throw new Error('Failed to fetch user info');
          }
          return response.json();
      })
      .then(data => {
        console.log('Fetched user info:', data);
          setUserData(data);
      })
      .catch(err => {
          console.error('Error fetching user info:', err);
      });
  }, [csrfToken, isLoggedIn, jwtToken]);

  return (
    <>
      <div className='main'>
      { isLoggedIn && userData ? (<>
        <br/>
        <p className='success'>Welcome, {userData.username}!</p>
      </>) : (
        null
      )}
      <h1>GoEDR</h1>
        <p>An endpoint detection & response tool written in Go</p>
      </div>
    </>
  )
}

export default Base