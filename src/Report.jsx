import exitMenuIcon from './assets/back.svg'
import { useEffect } from 'react';
import { animate } from 'animejs';

// Show the selected report details
function Report() {
    const { report, toggleReportSelected } =  arguments[0];

  useEffect(() => {
    report && animate('#report-details', {
        x: ['10rem','0rem'],
        opacity: [0, 1],
        duration: 200,
        loop: false,
        easing: 'easeInOut'
      });
  }, [report]);

  if (!report) {
    return <div id="reports-container">Loading report...</div>;
  }
    
  return (
    <>
        <div id="reports-container">
          <div id="reportview-header">
            <img
                src={exitMenuIcon}
                alt=" Exit Report View "
                className="exit-report-img left"
                onClick={() => toggleReportSelected(null)}
              />
            <h2>Report Details</h2>
          </div>
          <div id="report-details">
            <p><strong>Timestamp:</strong> {report.date}</p>
            <p><strong>Malicious IPs:</strong> {report.ip?.join(', ') || "No malicious IPs found"}</p>
            <p><strong>Malicious Hashes:</strong> {report.hash?.join(', ') || "No malicious hashes found"}</p>
            <p><strong>Malicious Processes:</strong> {report.proc?.join(', ') || "No malicious processes found"}</p>
          </div>
        </div>
    </>
  )
}

export default Report
