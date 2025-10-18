package scanner

import (
	"crypto/md5"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"slices"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/suffs811/goedr/godb"

	gp "github.com/mitchellh/go-ps"
	"github.com/shirou/gopsutil/v4/net"
)

var (
	// IPs and hashes from CTI feeds
	ctiIps    []string
	ctiHashes []string
	ctiProcs  []string

	// IPs connections from netstat
	localIps []string

	// Malicious IPs and hashes and processes
	malIps    []string
	malHashes []string
	malProcs  []string

	// Settings
	scanSettings godb.ScanSettings
)

func echeck(e error) {
	if e != nil {
		panic(e)
	}
}

func logg(s any) {
	log.Println(s)
}

func Start() any {
	scanSettings := godb.FetchSettings()

	scanIps := scanSettings.ScanIps
	scanHashes := scanSettings.ScanHashes
	scanProcs := scanSettings.ScanProcs

	if !scanIps && !scanHashes && !scanProcs {
		logg("No scan types selected. Exiting scan...")
		return nil
	} else {
		FetchAssets()
		if scanIps {
			CheckIps()
		} else {
			logg("Skipping IP scan...")
			malIps = []string{"IP connections not scanned"}
		}
		if scanHashes {
			CheckHashes()
		} else {
			logg("Skipping hash scan...")
			malHashes = []string{"File hashes not scanned"}
		}
		if scanProcs {
			PsScan()
		} else {
			logg("Skipping process scan...")
			malProcs = []string{"Processes not scanned"}
		}
	}

	// Create new SecurityReport struct
	timestamp := strconv.FormatInt(time.Now().UTC().UnixMilli(), 10)
	var report godb.SecurityReport
	report.Timestamp = timestamp
	report.Ips = malIps
	report.Hashes = malHashes
	report.Procs = malProcs

	// Reset malIps and malHashes and malProcs for next scan
	malHashes, malIps, malProcs = []string{}, []string{}, []string{}

	return report
}

func FetchAssets() {
	var wg sync.WaitGroup
	var body []byte
	var ipsRaw []string
	var hashesRaw []string

	// Get IPs
	wg.Add(1)
	go func() {
		defer wg.Done()
		resp, err := http.Get("https://binarydefense.com/banlist.txt")
		if err != nil {
			logg("Error fetching ips... Using previous list.")
			// Get working directory
			dir, err := os.Getwd()
			echeck(err)
			dir += "/data/"
			file, e := os.ReadFile(dir + "full_ips.txt")
			echeck(e)
			ipsRaw = strings.Split(string(file), "\n")
		} else {
			defer resp.Body.Close()
			body, err = io.ReadAll(resp.Body)
			echeck(err)
			ipsRaw = strings.Split(string(body), "\n")
		}

		for _, i := range ipsRaw {
			if !strings.Contains(i, "#") && i != "" {
				ctiIps = append(ctiIps, i)
			}
		}
	}()

	// Get hashes
	wg.Add(1)
	go func() {
		defer wg.Done()
		resp, err := http.Get("https://bazaar.abuse.ch/export/txt/md5/recent/")
		if err != nil {
			logg("Error fetching recent hashes... Using previous list.")
			// Get full list of hashes
			dir, err := os.Getwd()
			echeck(err)
			dir += "/data/"
			file, e := os.ReadFile(dir + "full_hashes.txt")
			echeck(e)
			hashesRaw = strings.Split(string(file), "\n")
		} else {
			// Get full list of hashes
			dir, err := os.Getwd()
			echeck(err)
			dir += "/data/"
			file, e := os.ReadFile(dir + "full_hashes.txt")
			echeck(e)
			hashesRaw = strings.Split(string(file), "\n")

			// Add recent hashes to full list
			defer resp.Body.Close()
			body, err = io.ReadAll(resp.Body)
			echeck(err)
			forHashesRaw := strings.Split(string(body), "\n")
			for _, h := range forHashesRaw {
				if !slices.Contains(hashesRaw, h) {
					hashesRaw = append(hashesRaw, h)
				}
			}
		}
		for _, h := range hashesRaw {
			if !strings.Contains(h, "#") && h != "" {
				ctiHashes = append(ctiHashes, h)
			}
		}
	}()
	wg.Wait()
}

func getFileHash(localFile string) string {
	f, err := os.Open(localFile)
	if err != nil {
		return ""
	}
	defer f.Close()
	h := md5.New()
	_, err = io.Copy(h, f)
	echeck(err)
	localHash := string(h.Sum(nil))
	return localHash
}

func CheckHashes() {
	var wg sync.WaitGroup
	filesCh := make(chan string)
	resultCh := make(chan string)

	workers := 50
	for range workers {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for localFile := range filesCh {
				// Exclude hashes provided in Settings
				localFileHash := getFileHash(localFile)
				if slices.Contains(scanSettings.ExclHashes, localFileHash) {
					logg("Excluding file from hash scan: " + localFile)
					continue
				}

				// Compare local file hashes with hash db
				for _, ctiHash := range ctiHashes {
					if ctiHash == localFileHash {
						resultCh <- localFile
					}
				}
			}
		}()
	}

	// Wait for all goroutines to finish
	go func() {
		wg.Wait()
		close(resultCh)
	}()

	// Add dirs provided in Settings
	dirsToCheck := scanSettings.ScannedDirs

	go func() {
		defer close(filesCh)
		// Exclude dirs provided in Settings
		for _, dir := range dirsToCheck {
			if slices.Contains(scanSettings.ExclDirs, dir) {
				logg("Excluding directory from scan: " + dir)
				// Skip dir if excluded in Settings
				continue
			}
		}

		// Get each file within each dir to scan
		for _, dir := range dirsToCheck {
			filesFound, err := os.ReadDir(dir)
			if err != nil {
				logg(err)
				continue
			}
			for _, file := range filesFound {
				// Exclude hidden files
				if !file.IsDir() && file.Name()[0] != '.' {
					filesCh <- filepath.Join(dir, file.Name())
				}
			}
		}
	}()

	for file := range resultCh {
		malHashes = append(malHashes, file)
	}
}

func CheckIps() {
	conns, err := net.Connections("tcp")
	echeck(err)

	for _, c := range conns {
		localIps = append(localIps, c.Raddr.IP)
	}

	for _, localIp := range localIps {
		for _, ctiIp := range ctiIps {
			if ctiIp == localIp {
				malIps = append(malIps, localIp)
			}
		}
	}
}

// Get the list of suspicious processes from data/procs.txt
func PsScan() {
	// Get CTI processes from data/
	dir, err := os.Getwd()
	echeck(err)
	dir += "/data/"
	file, e := os.ReadFile(dir + "procs.txt")
	echeck(e)
	ctiProcs = strings.Split(string(file), "\n")

	// Get local running processes
	localProcs, err := gp.Processes()
	if err != nil {
		log.Println("Failed to get process list")
		return
	}
	for _, i := range localProcs {
		localProc := strings.ToLower(i.Executable())
		for _, ctiProc := range ctiProcs {
			if strings.Contains(localProc, ctiProc) {
				malProcs = append(malProcs, localProc)
				break
			}
		}
	}
}
