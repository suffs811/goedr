<img alt="gitleaks badge" src="https://img.shields.io/badge/protected%20by-gitleaks-blue">

> Just a fun project I'm working on to practice Go

# GoEDR
#### Simple cross-platform, single-host EDR written in Go

### Functionalities
1. Checks temp, downloads, desktop, document folders against a list of malicious file hashes
2. Tests network connections against list of malicious IPs
3. Analyzes running processes against known suspicious processes
4. Runs on-demand scans and provides a report in the user interface
5. Exports the results to CSV

### Tech Stack
- React/Vite frontend
- Go/Gin backend server
- Custom nosql ORM written in Go

### Usage
Find the correct executable for your computer in the /app/ folder and run it.

> If your build is not present, you can build the app yourself with Go:
```bash
go tool dist list

GOOS=freebsd GOARCH=arm go build goedr.go
```

### Coming soon
- Continuous monitoring
- Response actions


<img width="2864" height="1504" alt="GoEDR Dashboard" src="https://github.com/user-attachments/assets/773ec949-0972-4845-a5c6-42913fd0ee01" />
