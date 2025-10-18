import { useEffect, useState } from 'react'
import ex from "./assets/ex.png"
import './App.css'

function Base() {
  const [reports, setReports] = useState(null)

  useEffect(() => {
    fetch('/s/dashboard')
      .then(response => response.json())
      .then(data => {
        const itemsArray = Object.entries(data.items).map(([timestamp, report]) => ({timestamp, ...report}));
        itemsArray.sort((a, b) => b.timestamp - a.timestamp);
        itemsArray.forEach(report => {
          const epoch = report.timestamp.slice(0, 10);
          const date = new Date(0);
          date.setUTCSeconds(epoch);
          report.date = date.toLocaleString();
        });
        setReports(itemsArray);
      })
      .catch(err => {
        console.error('Error fetching reports:', err);
      });
  }, [setReports]);

  function deleteReport(timestamp) {
    fetch('/s/delete?timestamp='+timestamp)
    .then(response => response.json())
      .then(data => {
        const itemsArray = Object.entries(data.items).map(([timestamp, report]) => ({timestamp, ...report}));
        itemsArray.sort((a, b) => b.timestamp - a.timestamp);
        itemsArray.forEach(report => {
          const epoch = report.timestamp.slice(0, 10);
          const date = new Date(0);
          date.setUTCSeconds(epoch);
          report.date = date.toLocaleString();
        });
        setReports(itemsArray);
      })
      .catch(err => {
        console.error('Error deleting report:', err);
      });
  }

    if (!reports) {
    return <div className='main' style={{marginTop: "2rem"}}>Loading...</div>
  }

  return (
    <>
      <div className='main'>
        <h1>Dashboard</h1>
        <p>An endpoint detection & response tool written in Go</p>
        <div id="reports-container">
        <table style={{ whiteSpace: "nowrap"}} id="reports-table">
            <thead>
                <tr>
                    <th>Timestamp</th>
                    <th>Ips</th>
                    <th>Hashes</th>
                    <th>Processes</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.timestamp}>
                  <td>{report.date}</td>
                  <td>{report.ip?.join(', ') || "No malicious IPs found"}</td>
                  <td>{report.hash?.join(', ') || "No malicious hashes found"}</td>
                  <td>{report.proc?.join(', ') || "No malicious processes found"}</td>
                  <td onClick={() => deleteReport(report.timestamp)}>
                    <img className="del-report-img" src={ex} alt=" X " />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        
      </div>
    </>
  )
}

export default Base;