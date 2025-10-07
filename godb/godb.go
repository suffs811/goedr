package godb

import (
	"encoding/json"
	"log"
	"os"
	"runtime"
)

type SecurityReport struct {
	Timestamp string
	Ips       []string
	Hashes    []string
	Cmds      []string
}

type ScanSettings struct {
	ScannedDirs []string
	ExclDirs    []string
	ExclHashes  []string
	ScanIps     bool
	ScanHashes  bool
}

var (
	dbDir string

	reportsdb     *os.File
	dbFileReports string

	settingsdb     *os.File
	dbFileSettings string
)

func init() {
	var err error

	// Get working directory
	dbDir, err = os.Getwd()
	echeck(err)
	dbDir += "/db/"

	// Ensure /db directory exists
	if e := os.Mkdir(dbDir, 0750); e != nil && !os.IsExist(e) {
		echeck(e)
	}

	// Open or create reports.json
	dbFileReports = dbDir + "reports.json"
	reportsdb, err = os.OpenFile(dbFileReports, os.O_RDWR|os.O_CREATE, 0644)
	echeck(err)

	// Open or create settings.json
	dbFileSettings = dbDir + "settings.json"
	settingsdb, err = os.OpenFile(dbFileSettings, os.O_RDWR|os.O_CREATE, 0644)
	echeck(err)
}

func echeck(e error) {
	if e != nil {
		panic(e)
	}
}

// Reports
func FetchAll() map[string]any {
	fileStat, e := os.Stat(reportsdb.Name())
	echeck(e)
	fileSize := fileStat.Size()
	file, e := os.ReadFile(dbFileReports)
	echeck(e)

	if fileSize != 0 {
		var items map[string]any
		e = json.Unmarshal(file, &items)
		echeck(e)

		return items
	} else {
		return nil
	}
}

func Fetch(q string) any {
	items := FetchAll()
	if items == nil {
		return nil
	}
	for k, v := range items {
		if k == q {
			return v
		}
	}
	return nil
}

func Del(q string) map[string]any {
	items := FetchAll()
	for k := range items {
		if k == q {
			delete(items, k)
			data, err := json.MarshalIndent(items, "", "  ")
			echeck(err)
			err = os.WriteFile(dbFileReports, data, 0644)
			echeck(err)
			return items
		}
	}

	return nil
}

func New(r SecurityReport) bool {
	items := FetchAll()
	if items == nil {
		items = make(map[string]any)
	}

	// Convert SecurityReport to json
	items[r.Timestamp] = map[string]any{
		"timestamp": r.Timestamp,
		"ip":        r.Ips,
		"hash":      r.Hashes,
		"cmd":       r.Cmds,
	}

	// Write back to reports.json
	data, err := json.MarshalIndent(items, "", "  ")
	echeck(err)
	err = os.WriteFile(dbFileReports, data, 0644)
	echeck(err)

	return true
}

// Example call: ok, result := godb.Mod(timestamp, "ip", []string{""})
func Mod(q string, key string, value []string) (bool, any) {
	items := FetchAll()
	if items == nil {
		return false, items
	}

	// Test whether an item exists with query key
	report, ok := items[q].(map[string]any)
	if !ok {
		return false, items
	}
	// Modify the item with new value for key
	report[key] = value
	items[q] = report

	// Write back to reports.json
	data, err := json.MarshalIndent(items, "", "  ")
	echeck(err)
	err = os.WriteFile(dbFileReports, data, 0644)
	echeck(err)

	return true, items
}

func ClearDB() bool {
	err := os.Truncate(dbFileReports, 0)
	echeck(err)
	return true
}

func CloseDB() {
	err := reportsdb.Close()
	echeck(err)
	log.Println("DB Closed successfully")
}

// Settings
func FetchSettings() map[string]any {
	fileStat, e := os.Stat(settingsdb.Name())
	echeck(e)
	fileSize := fileStat.Size()
	file, e := os.ReadFile(dbFileSettings)
	echeck(e)

	if fileSize != 0 {
		var settings map[string]any
		e = json.Unmarshal(file, &settings)
		echeck(e)

		return settings
	} else {
		homeDir := os.Getenv("HOME")
		dirsToCheck := []string{homeDir, homeDir + "/Desktop", homeDir + "/Downloads", homeDir + "/Documents"}

		switch runtime.GOOS {
		case "windows":
			dirsToCheck = append(dirsToCheck, "C:/Windows/Temp")
		case "darwin":
			dirsToCheck = append(dirsToCheck, "/tmp")
		case "linux":
			dirsToCheck = append(dirsToCheck, "/tmp")
		}
		settings := map[string]any{"scannedDirs": dirsToCheck, "exclDirs": []string{}, "exclHashes": []string{}, "scanIps": true, "scanHashes": true}
		return settings
	}
}

func UpdateSettings(submittedSettings map[string]any) bool {
	settings := submittedSettings

	// Write back to settings.json
	data, err := json.MarshalIndent(settings, "", "  ")
	echeck(err)
	err = os.WriteFile(dbFileSettings, data, 0644)
	echeck(err)

	return true
}
