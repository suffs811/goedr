<img alt="gitleaks badge" src="https://img.shields.io/badge/protected%20by-gitleaks-blue">

> Just a fun project I'm working on to learn Go

# GoEDR
#### Simple cross-platform, single-host EDR written in Go

### Functionalities
1. Checks temp, downloads, desktop, document folders against a list of malicious file hashes
2. Tests network connections against list of malicious IPs
3. Runs daily scans and provides a report in the user interface

### Tech Stack
- React/Vite frontend
- Go/Gin backend server
- Custom nosql ORM written in Go

### Setup
1. npm i
2. npm run build
3. go build main.go
4. ./main

### Coming soon
- Analyze command-line history for malicious stuff
- Continuous monitoring
- Response actions
- Export reports as csv
- View details for single report


<img width="2864" height="1504" alt="GoEDR Dashboard" src="https://github.com/user-attachments/assets/773ec949-0972-4845-a5c6-42913fd0ee01" />
