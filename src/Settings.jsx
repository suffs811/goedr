import { useEffect, useState } from 'react'
import './App.css'

function Settings() {
  const [settings, setSettings] = useState(null)
  // settings := map[string]any{"scannedDirs": []string{}, "exclDirs": []string{}, "exclHashes": []string{}, "exclProcs": []string{}, "scanIps": true, "scanHashes": true, "scanProcs": true}
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch('/s/settings')
      .then(response => response.json())
      .then(data => {
        setSettings(data.settings);
        })
      .catch(err => {
        console.error('Error fetching reports:', err);
        setError("Error fetching settings. Please try again.");
        setTimeout(() => setError(""), 3000);
      });
  }, []);

  function updateSettings(newSettings) {
    newSettings.ScannedDirs = newSettings.ScannedDirs.filter(dir => dir !== "");
    newSettings.ExclDirs = newSettings.ExclDirs.filter(dir => dir !== "");
    newSettings.ExclHashes = newSettings.ExclHashes.filter(hash => hash !== "");
    newSettings.ExclProcs = newSettings.ExclProcs.filter(proc => proc !== "");

    fetch('/s/updatesettings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newSettings),
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        setSettings(settings);
        setError("Error updating settings. Please try again.");
        setTimeout(() => setError(""), 3000);
        return;
      }
      setSettings(data.settings);
      setSuccess("Settings updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    })
    .catch(err => {
      console.error('Error updating settings:', err);
      setError("Error updating settings. Please try again.");
      setTimeout(() => setError(""), 3000);
    });
  }

  if (!settings) {
    return <div className='main' style={{marginTop: "2rem"}}>Loading...</div>
  }

  return (
    <>
      <div className='main'>
        <h1>Settings</h1>
        <p>Configure your GoEDR instance</p>
        <div id="settings-container">
          <div>
            <h3>Directories to Scan</h3>
            <p>Directories to scan for threats</p>
            <textarea value={settings.ScannedDirs?.join('\n')} onChange={(e) => {
              const dirs = e.target.value.split('\n').map(dir => dir.trim());
              setSettings({...settings, ScannedDirs: dirs});
            }} rows={10} cols={50} />
          </div>
          <div>
            <h3>Excluded Directories</h3>
            <p>Directories to exclude from scans</p>
            <textarea value={settings.ExclDirs?.join('\n')} onChange={(e) => {
              const dirs = e.target.value.split('\n').map(dir => dir.trim());
              setSettings({...settings, ExclDirs: dirs});
            }} rows={10} cols={50} />
          </div>
          <div>
            <h3>Excluded Hashes</h3>
            <p>File hashes to exclude from scans</p>
            <textarea value={settings.ExclHashes?.join('\n')} onChange={(e) => {
              const hashes = e.target.value.split('\n').map(hash => hash.trim());
              setSettings({...settings, ExclHashes: hashes});
            }} rows={10} cols={50} />
          </div>
          <div>
            <h3>Excluded Processes</h3>
            <p>Processes to exclude from scans</p>
            <textarea value={settings.ExclProcs?.join('\n')} onChange={(e) => {
              const procs = e.target.value.split('\n').map(proc => proc.trim());
              setSettings({...settings, ExclProcs: procs});
            }} rows={10} cols={50} />
          </div>
          <div>
            <h3>Scan IPs</h3>
            <p>Whether to scan for suspicious IP addresses</p>
            <input type="checkbox" checked={settings.ScanIps} onChange={(e) => {
              setSettings({...settings, ScanIps: e.target.checked});
            }} />
          </div>
          <div>
            <h3>Scan Hashes</h3>
            <p>Whether to scan for known malicious file hashes</p>
            <input type="checkbox" checked={settings.ScanHashes} onChange={(e) => {
              setSettings({...settings, ScanHashes: e.target.checked});
            }} />
          </div>
          <div>
            <h3>Scan Processes</h3>
            <p>Whether to scan for known malicious processes</p>
            <input type="checkbox" checked={settings.ScanProcs} onChange={(e) => {
              setSettings({...settings, ScanProcs: e.target.checked});
            }} />
          </div>
        </div>
        <div style={{marginTop: "1rem", display: "flex", flexDirection: "column", alignItems: "center"}}>
          <button onClick={() => updateSettings(settings)}>Save Settings</button>
          {success && <span className='success' style={{marginTop: "2rem"}}>Settings saved successfully!</span>}
          {error && <span className='error' style={{marginTop: "2rem"}}>Error saving settings. Please try again.</span>}
        </div>
      </div>
    </>
  )
}

export default Settings;