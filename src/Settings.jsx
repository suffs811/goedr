import React, { useState } from 'react';

function Settings() {
  const [inputToken, setInputToken] = useState(''); // State to hold the input token
  const [savedToken, setSavedToken] = useState(''); // State to hold the saved token from cookie
  const [tokenPresent, setTokenPresent] = useState(''); // State to check if token is present in cookie
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [csrfToken, setCsrfToken] = useState(''); // State to hold CSRF token
  const [buttonClicked, setButtonClicked] = useState(false); // State to track button click

  const jwtToken = localStorage.getItem("jwt");

  // Fetch CSRF token from the server
  React.useEffect(() => {
    fetch('/s/csrf-token')
      .then(response => response.json())
      .then(data => {
        setCsrfToken(data.csrfToken);
      })
      .catch(err => {
        console.error('Error fetching CSRF token:', err);
        setError('Failed to fetch CSRF token. Please try again later.');
      });
  }, []);

  React.useEffect(() => {
    // Fetch api token from server
    if (!jwtToken) {
      setError('No JWT found. Please log in.');
      setTokenPresent(false);
      return;
    }
    try {
      fetch('/s/token/get', {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
        credentials: 'include', // Include cookies in the request
      })
        .then(response => response.json())
        .then(data => {
          console.log('Fetched token:', data);
          if (data.token) {
            setSavedToken(data.token);
            setTokenPresent(true);
          } else {
            setTokenPresent(false);
          }
        })
        .catch(err => {
          console.error('Error fetching token:', err);
          setError('Failed to get API token. Please try again later.');
        });
    } catch (error) {
      console.error('Error loading token:', error);
      setError('Failed to load API token. Please try again later.');
    }
  }, [jwtToken]);

  // Function to handle saving token
  const handleSaveSettings = (e) => {
    e.preventDefault();
    setError('');
    if (inputToken.trim() === '') {
      setError('API Token cannot be empty.');
      return;
    }
    try {
      // Send the token to the server with CSRF protection
      fetch('/s/token/add', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`,
          'CSRF-Token': csrfToken // Include CSRF token in the request headers
        },
        credentials: 'include', // Include cookies in the request
        method: 'POST',
        body: JSON.stringify({ token: inputToken }),
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to save token');
        }
        setLoading(true);
        return response.json();
      })
      .then(data => {
        console.log('Token saved:', data);
        // Update the state with the new token
        setInputToken('');
        setTokenPresent(true);
        setSavedToken(inputToken);
        // Show success message
        setButtonClicked(true)
        setSettingsSaved(true);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error saving token:', err);
        setError('Failed to save API token. Please try again.');
        setLoading(false);
        return;
      });
      setTimeout(() => {
        setSettingsSaved(false);
        setButtonClicked(false);
      }, 3000);
      // Reset loading state
      // Clear any previous error messages
      setError('');
    } catch (error) {
      setError('Failed to save settings. Please try again.');
      console.error('Error saving settings:', error);
      setLoading(false);
    }
  };

  // Function to delete the token
  const deleteToken = () => {
    fetch('/s/token/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`,
        'CSRF-Token': csrfToken // Include CSRF token in the request headers
      },
      credentials: 'include', // Include cookies in the request
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to delete token');
        }
        return response.json();
      })
      .then(data => {
        console.log('Token deleted:', data);
        // Reset the state after deletion
        setSavedToken('');
        setTokenPresent(false);
        setInputToken('');
        setSettingsSaved(false);
        setButtonClicked(false);
        setTimeout(() => {
          setError('API Token deleted successfully.');
        }, 3000);
        setError('');
      })
      .catch(err => {
        console.error('Error deleting token:', err);
        setError('Failed to delete API token. Please try again.');
      });
  };
  
  if (tokenPresent === '' || csrfToken === '') {
    return <div className="main"><p>Fetching data</p></div>;
  }

  return (
    <>
      <div className='main'>
        <h1>Settings</h1>
        <h2>API Token</h2>
        {tokenPresent ? 
        <p className='apiToken'>API Token: {savedToken.substring(0,savedToken.length/4)}{('*'.repeat((savedToken.length/4)*3))} <span className='removeToken' onClick={() => deleteToken()}>{'\u2715'}</span></p> : 
        <p className='error'>No API Token Found</p>}
        <p>This token is used to authenticate your requests to the Pianista API.</p>
        <p>Configure your API token below:</p>
      <form className='settingsContainerToken' onSubmit={(e) => handleSaveSettings(e, inputToken)}>
      <input type="hidden" name="_csrf" value={csrfToken}></input>
        <input
          type="text"
          className="settingsInput"
          placeholder="Enter your API Token"
          value={inputToken}
          onChange={(e) => setInputToken(e.target.value)}
          disabled={loading}
        />
        <button
          type='submit'
          className={buttonClicked?"settingsButton settingsActive":"settingsButton"}
          disabled={loading}
        >
          {buttonClicked ? 'Settings Saved!' : 'Save Token'}
        </button>
        </form>
        <p className="getTokenText smallText">Need a token? Get it <a href='https://planner-apim.developer.azure-api.net/products' target='_blank' style={{color: '#F8F812aa'}}>here</a>!</p>
        {settingsSaved ? <p className='success'>API token has been saved!</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {loading ? <p>Saving token...</p> : null}

        {/* Reset password link */}
        <br />
        <h2>Reset Password</h2>
        <p className='resetPasswordText'>Need to reset your password? <a href='/reset-password' style={{color: '#F8F812aa'}}>Reset it here</a>.</p>
      </div>
    </>
  )
}

export default Settings