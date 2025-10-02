import React, { useState } from 'react';

export default function ResetPassword() {
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
        const email = formData.get("email");

        // Post reset password data to the server
        fetch('/s/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken,
            },
            body: JSON.stringify({ email }),
        })
        .then((response) => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then((data) => {
            console.log('Reset password request successful:', data);
            setSuccess('Reset password link sent to your email!');
            setError(null);
            setLoading(false);
        })
        .catch((error) => {
            console.error('Error during reset password:', error);
            setError('Reset password failed. Please try again.');
            setSuccess(null);
            setLoading(false);
        });
    };

    return (
        <div className="main resetPasswordContainer">
            <h2>Reset Password</h2>
            <form onSubmit={handleSubmit}>
                <label htmlFor="email">Email:</label>
                <input type="email" id="email" name="email" required />
                <button type="submit" className="resetButton">Send Reset Link</button>
            </form>
            {error && <p className="error">{error}</p>}
            {success && <p className="success">{success}</p>}
            {loading && <p>Loading...</p>}
        </div>
    );
}