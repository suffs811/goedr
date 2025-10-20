import exitMenuIcon from './assets/exit-menu.svg'
import openMenuIcon from './assets/open-menu.svg'
import { useState, useEffect } from 'react'
import { Link } from "react-router-dom";
import { animate } from 'animejs';

function Header() {
    const [openMenu, setOpenMenu] = useState(false);
    const [scanStatus, setScanStatus] = useState("idle"); // idle, scanning, completed, error

    const fetchScanStatus = () => {
      fetch('/s/scanstatus')
        .then(response => response.json())
        .then(data => {
          if (data.status) {
            setScanStatus(data.status);
            if (data.status === "completed") {
              handleScanComplete();
            } else if (data.status === "idle") {
              setScanStatus("idle");
              location.reload();
            } 
          } else {
            setScanStatus("idle");
          }
        })
        .catch(err => {
          console.error('Error fetching scan status:', err);
          setScanStatus("error");
          setTimeout(() => setScanStatus("idle"), 3000); // Clear error after 3 seconds
        });
    }

    const handleScanComplete = () => {
      setScanStatus("completed");
      setTimeout(() => {
        setScanStatus("idle");
        location.reload(); // Reload to show new report
      }, 2000); // Clear success after 2 seconds
    }

    const handleStartScan = () => {
    // Fetch /s/start endpoint
    fetch('/s/start')
      .then(response => {
        if (response.ok) {
          setScanStatus("scanning");
        } else {
          console.error('Failed to start scan: ' + response.error);
          setScanStatus("error");
          setTimeout(() => {
            setScanStatus("idle");
          }, 3000); // Clear error after 3 seconds
        }
      })
      .catch(err => {
        console.error('Error starting scan:', err);
        setScanStatus("error");
        setTimeout(() => {
          setScanStatus("idle");
        }, 3000); // Clear error after 3 seconds
      });

      const interval = setInterval(fetchScanStatus, 1000); // Fetch every 1 second
        return () => clearInterval(interval); // Cleanup on unmount
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
          {scanStatus && <><p className="status">Status: <span className={scanStatus === "completed" ? "success" : "error"}>{scanStatus}</span></p></>}
        </div>
        <div className='right menuIcon' >
        <button className="start-scan-button" onClick={handleStartScan} disabled={scanStatus === "scanning"}>Start a scan</button>
        {!openMenu ?
            <img src={openMenuIcon} className={openMenu ? "logo menuIcon fade" : "logo menuIcon"}  alt="menu icon" onClick={toggleMenu} /> :
            <img src={exitMenuIcon} className={openMenu ? "logo menuIcon fade" : "logo menuIcon"} alt="exit menu icon" onClick={toggleMenu} />
        }
        </div>
      </div>
      <div className='headerMenu'>
        <ul>
          <Link to="/"><li className='menuItem menuActive' onClick={menuClicked}>Dashboard</li></Link>
          <Link to="/settings"><li className='menuItem menuActive' onClick={menuClicked}>Settings</li></Link>
          <li className='menuItem menuSep'></li>
          <a href="https://github.com/suffs811" target="_blank"><li className='menuItem'>GitHub <span style={{color: '#F8F812'}}>{'\u2197'}</span></li></a>
          <a href="https://www.virustotal.com/gui/home/search" target="_blank"><li className='menuItem'>VirusTotal <span style={{color: '#F8F812'}}>{'\u2197'}</span></li></a>
        </ul>
      </div>
    </>
  )
}
export default Header
