package reporter

import (
	"crypto/md5"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/shirou/gopsutil/v4/net"
	"github.com/suffs811/goedr/godb"
)

var (
	// IPs and hashes from CTI feeds
	ctiIps    []string
	ctiHashes []string

	// Remote IPs from netstat
	localIps []string

	// Malicious IPs and hashes
	malIps    []string
	malHashes []string
)

func echeck(e error) {
	if e != nil {
		panic(e)
	}
}

func logg(s any) {
	log.Println(s)
}

// Get malicious IPs and file hashes
func init() {

}

func Start() godb.SecurityReport {
	FetchAssets()
	CheckHashes()
	CheckIps()
	// CheckCmds()

	// Create new SecurityReport struct
	timestamp := strconv.FormatInt(time.Now().UTC().UnixMilli(), 10)
	var report godb.SecurityReport
	var ips, hashes, cmds []string
	report.Timestamp = timestamp
	report.Ips = ips
	report.Hashes = hashes
	report.Cmds = cmds

	return report
}

func FetchAssets() {
	var body []byte
	var ipsRaw []string
	var hashesRaw []string
	// Get IPs
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

	// Get hashes
	resp, err = http.Get("https://bazaar.abuse.ch/export/txt/md5/recent/")
	if err != nil {
		logg("Error fetching recent hashes... Using previous list.")
		// Get working directory
		dir, err := os.Getwd()
		echeck(err)
		dir += "/data/"
		file, e := os.ReadFile(dir + "full_hashes.txt")
		echeck(e)
		hashesRaw = strings.Split(string(file), "\n")
	} else {
		defer resp.Body.Close()
		body, err = io.ReadAll(resp.Body)
		echeck(err)
		hashesRaw = strings.Split(string(body), "\n")
	}
	for _, h := range hashesRaw {
		if !strings.Contains(h, "#") && h != "" {
			ctiHashes = append(ctiHashes, h)
		}
	}
}

func getFileHash(localFile string) string {
	f, err := os.Open(localFile)
	echeck(err)
	defer f.Close()
	h := md5.New()
	_, err = io.Copy(h, f)
	echeck(err)
	localHash := string(h.Sum(nil))
	return localHash
}

func CheckHashes() {
	dirsToCheck := []string{"~/Desktop", "~/Downloads", "~/Documents", "C:/Windows/Temp"}

	var filesToCheck []string

	for _, dir := range dirsToCheck {
		filesFound, err := os.ReadDir(dir)
		echeck(err)
		for _, file := range filesFound {
			if !file.IsDir() {
				filesToCheck = append(filesToCheck, file.Name())
			}
		}
	}
	for _, localFile := range filesToCheck {
		localHash := getFileHash(localFile)
		for _, ctiHash := range ctiHashes {
			if ctiHash == localFile {
				malHashes = append(malHashes, localHash)
			}
		}
	}
}

func CheckCmds() {

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
