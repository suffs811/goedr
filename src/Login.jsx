import React, { useState } from 'react';

export default function Login() {
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(false);
    const [csrfToken, setCsrfToken] = useState('');

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

    const handleSubmit = (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
    const username = formData.get("username");
    const password = formData.get("password");

    // Post login data to the server
    fetch('/s/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CSRF-Token': csrfToken // Include CSRF token in the request headers
      },
      body: JSON.stringify({ username, password }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data) => {
        // Store data.user.jwt in localStorage
        localStorage.setItem("jwt", data.user.jwt);
        setSuccess('Login successful! Redirecting to home...');
        setTimeout(() => {
          window.location.href = "/";
        }, 2000); // Redirect after 2 seconds
        setError(null);
        setLoading(false);
        // Redirect to home page or another page
        window.location.href = "/";
      })
      .catch((error) => {
        console.error('Error during login:', error);
        setError('Login failed. Please check your credentials and try again.');
        setSuccess(null);
        setLoading(false);
      });
  };

  return (
    <div className="main loginContainer">
      <h2>Login Page</h2>
      <form onSubmit={handleSubmit}>
          <label htmlFor="username">Username:</label>
          <input type="text" id="username" name="username" required />
          <label htmlFor="password">Password:</label>
          <input type="password" id="password" name="password" required />
        <button type="submit" className='loginButton'>Login</button>
      </form>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        {loading && <p>Loading...</p>}
        <p>Don't have an account? <a href="/register">Register here</a>.</p>
        <p><a href="/reset-password">Forgot your password?</a></p>
    </div>
  );
}