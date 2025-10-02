import React, { useState } from 'react';

export default function Register() {
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(false);
    const [passwordsMatch, setPasswordsMatch] = useState(true);
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

    const handleSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const username = formData.get("username");
        const password = formData.get("password");

        // Post registration data to the server
        const response = await fetch('/s/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': csrfToken // Include CSRF token in the request headers
            },
        body: JSON.stringify({ username, password }),
        });
        const data = await response.json();

        if (!response.ok) {
            setError(data.message || 'Registration failed');
            throw new Error('Registration failed: ' + data.message);
        }

        setSuccess('Registration successful! Redirecting to login...');
        setError(null);
        setLoading(false);
        setPasswordsMatch(true);
        // Store data.jwt in localStorage
        localStorage.setItem("apiToken", data.jwt);
        setTimeout(() => {
            window.location.href = "/login";
        }, 2000); // Redirect after 2 seconds
    };

  return (
    <div className="main registerContainer">
      <h2>Register Page</h2>
      <form onSubmit={handleSubmit}>
          <label htmlFor="username">Username:</label>
          <input type="text" id="username" name="username" required />
          <label htmlFor="password">Password:</label>
          <input type="password" id="password" name="password" required />
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input type="password" id="confirmPassword" name="confirmPassword" required />
        <button type="submit" className="registerButton">Register</button>
      </form>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        {!passwordsMatch && <p className="error">Passwords do not match</p>}
        {loading && <p>Loading...</p>}
        <p>Already have an account? <a href="/login">Login here</a>.</p>
    </div>
  );
}