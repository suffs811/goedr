import exitMenuIcon from './assets/exit-menu.svg'
import openMenuIcon from './assets/open-menu.svg'
import { useState, useEffect } from 'react'
import { Link } from "react-router-dom";
import { animate } from 'animejs';

function Header( { isLoggedIn } ) {
    const [openMenu, setOpenMenu] = useState(false);
    const [csrfToken, setCsrfToken] = useState('');

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

  // Logout function
  const logout = () => {
    fetch('/s/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CSRF-Token': csrfToken // Include CSRF token in the request headers
      },
      credentials: 'include' // Include cookies in the request
    })
    .then(response => {
      if (!response.ok) {
        console.error('Logout failed:', response);
        throw new Error(response);
      }
      console.log('Logout successful');
      // Clear localStorage and redirect to home page
    localStorage.removeItem("jwt");
    window.location.href = "/";
  })
    .catch(error => {
      console.error('Error during logout:', error);
    });
  }

    function menuClicked() {
      setOpenMenu(false); // Close the menu after clicking an item
    }

    function toggleMenu() {
      setOpenMenu(prev => !prev);
    }

    useEffect(() => {
      if (openMenu) {
        document.querySelector(".headerMenu").style.display = 'block'; // Show menu when open
        document.querySelectorAll('.menuItem').forEach(item => {
          item.style.display = 'block'; // Show items when menu is open
        });
        animate('.menuItem', {
          x: ['10rem','0rem'],
          opacity: [0, 1],
          display: 'block',
          duration: 200,
          loop: false,
          easing: 'easeInOut'
        });
      } else {
        animate('.menuItem', {
          x: ['0rem','10rem'],
          duration: 100,
          loop: false,
          easing: 'easeInOut'
        });
        setTimeout(() => {
          document.querySelectorAll('.menuItem').forEach(item => {
            item.style.display = 'none'; // Hide items when menu is closed
          });
        }, 100); // Match the duration of the animation
      }
      document.querySelector(".headerMenu").style.display = openMenu ? 'block' : 'none'; // Toggle menu visibility
    }, [openMenu]);

    const clearDatabases = () => {
      isLoggedIn && logout();
      fetch('/s/db/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CSRF-Token': csrfToken // Include CSRF token in the request headers
        },
        credentials: 'include' // Include cookies in the request
      })
      .then(response => {
        if (!response.ok) {
          console.error('Clear databases failed:', response);
          throw new Error(response);
        }
        console.log('Databases successfully cleared');
        window.alert('Databases successfully cleared');
        window.location.href = "/";
      })
      .catch(error => {
        console.error('Error during clear databases:', error);
      });
    }

  return (
    <>
      <div id="logoHeader">
        <div className='left'>
          <Link to="/">
            <h1 className='logoText'>GoEDR</h1>
          </Link>
        </div>
        <div className='right menuIcon' >
        <button onClick={clearDatabases}>Clear Databases</button>
        {!openMenu ?
            <img src={openMenuIcon} className={openMenu ? "logo menuIcon fade" : "logo menuIcon"}  alt="menu icon" onClick={toggleMenu} /> :
            <img src={exitMenuIcon} className={openMenu ? "logo menuIcon fade" : "logo menuIcon"} alt="exit menu icon" onClick={toggleMenu} />
        }
        </div>
      </div>
      <div className='headerMenu'>
        <ul>
          <Link to="/"><li className='menuItem menuActive' onClick={menuClicked}>Home</li></Link>
          <Link to="/dashboard"><li className='menuItem menuActive' onClick={menuClicked}>Dashboard</li></Link>
          <Link to="/settings"><li className='menuItem menuActive' onClick={menuClicked} value={'settings'}>Settings</li></Link>
          <li className='menuItem menuSep'></li>
          { isLoggedIn ?
            <Link to="/logout"><li className='menuItem menuActive' onClick={logout} value={'logout'}>Logout</li></Link>
            :<>
            <Link to="/login"><li className='menuItem menuActive' onClick={menuClicked} value={'login'}>Login</li></Link>
            <Link to="/register"><li className='menuItem menuActive' onClick={menuClicked} value={'register'}>Register</li></Link>
          </>}
          <li className='menuItem menuSep'></li>
          <a href="https://github.com/suffs811" target="_blank"><li className='menuItem'>GitHub <span style={{color: '#F8F812'}}>{'\u2197'}</span></li></a>
        </ul>
      </div>
    </>
  )
}

export default Header
