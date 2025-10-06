import exitMenuIcon from './assets/exit-menu.svg'
import openMenuIcon from './assets/open-menu.svg'
import { useState, useEffect } from 'react'
import { Link } from "react-router-dom";
import { animate } from 'animejs';

function Header() {
    const [openMenu, setOpenMenu] = useState(false);
    const [scanStatus, setScanStatus] = useState("idle"); // idle, scanning, completed
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [buttonText, setButtonText] = useState("Start a scan");

    const fetchScanStatus = () => {
      fetch('/s/scanstatus')
        .then(response => response.json())
        .then(data => {
          if (data.status) {
            setScanStatus(data.status);
            if (data.status === "completed") {
              handleScanComplete();
            }
          } else {
            setScanStatus("idle");
          }
        })
        .catch(err => {
          console.error('Error fetching scan status:', err);
          setScanStatus("error");
          setError('Error fetching scan status.');
          setTimeout(() => setError(null), 5000); // Clear error after 5 seconds
        });
    }

    useEffect(() => {
      fetchScanStatus(); // Initial fetch
      const interval = setInterval(fetchScanStatus, 1000); // Fetch every 1 second
      return () => clearInterval(interval); // Cleanup on unmount
    });

    const handleScanComplete = () => {
      setScanStatus("completed");
      setButtonText("Scan completed!");
      setSuccess('Scan completed successfully! Report is ready.');
      setTimeout(() => {
        setSuccess(null);
        setButtonText("Start a scan");
      }, 5000); // Clear success after 5 seconds
    }

    const handleStartScan = () => {
    // Fetch /s/start endpoint
    fetch('/s/start')
      .then(response => {
        if (response.ok) {
          setScanStatus("scanning");
          setButtonText("Scanning");
          setSuccess('Scan started successfully! Report will appear in the dashboard shortly.');
          setTimeout(() => setSuccess(null), 5000); // Clear success after 5 seconds
        } else {
          setError('Failed to start scan: ' + response.error);
          setTimeout(() => {
            setError(null);
            setButtonText("Start a scan");
          }, 5000); // Clear error after 5 seconds
        }
      })
      .catch(err => {
        console.error('Error starting scan:', err);
        setError('Error starting scan.');
        setTimeout(() => {
          setError(null);
          setButtonText("Start a scan");
        }, 5000); // Clear error after 5 seconds
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

  return (
    <>
      <div id="logoHeader">
        <div className='left'>
          <Link to="/">
            <h1 className='logoText'>GoEDR</h1>
          </Link>
        </div>
        <div className='right menuIcon' >
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        {scanStatus === "idle" && <button className="start-scan-button" onClick={handleStartScan}>{buttonText}</button>}
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
          <li className='menuItem menuSep'></li>
          <a href="https://github.com/suffs811" target="_blank"><li className='menuItem'>GitHub <span style={{color: '#F8F812'}}>{'\u2197'}</span></li></a>
        </ul>
      </div>
    </>
  )
}

export default Header
