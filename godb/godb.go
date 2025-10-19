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
	Procs     []string
}

type ScanSettings struct {
	ScannedDirs []string
	ExclDirs    []string
	ExclHashes  []string
	ExclProcs   []string
	ScanIps     bool
	ScanHashes  bool
	ScanProcs   bool
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
	// If reports is empty, add empty {}
	emptyReports := isEmptyFile(reportsdb)
	if emptyReports {
		// Write back to settings.json
		defaultReport := make(map[string]string)
		data, err := json.MarshalIndent(defaultReport, "", "  ")
		echeck(err)
		err = os.WriteFile(dbFileReports, data, 0644)
		echeck(err)
	}

	// Open or create settings.json
	dbFileSettings = dbDir + "settings.json"
	settingsdb, err = os.OpenFile(dbFileSettings, os.O_RDWR|os.O_CREATE, 0644)
	echeck(err)

	// If settings is empty, add defaults
	emptySettings := isEmptyFile(settingsdb)
	if emptySettings {
		// if settings file is empty, set defaults
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
		settings := ScanSettings{ScannedDirs: dirsToCheck, ExclDirs: []string{}, ExclHashes: []string{}, ExclProcs: []string{}, ScanIps: true, ScanHashes: true, ScanProcs: true}
		// Write back to settings.json
		data, err := json.MarshalIndent(settings, "", "  ")
		echeck(err)
		err = os.WriteFile(dbFileSettings, data, 0644)
		echeck(err)
	}
}

func echeck(e error) {
	if e != nil {
		panic(e)
	}
}

func isEmptyFile(file *os.File) bool {
	fileStat, e := os.Stat(file.Name())
	echeck(e)
	fileSize := fileStat.Size()
	return fileSize == 0
}

// Reports
func FetchAll() map[string]any {
	var items map[string]any
	fileStat, e := os.Stat(reportsdb.Name())
	echeck(e)
	fileSize := fileStat.Size()
	file, e := os.ReadFile(dbFileReports)
	echeck(e)

	if fileSize != 0 {
		e = json.Unmarshal(file, &items)
		echeck(e)
	} else {

	}

	return items
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
		"proc":      r.Procs,
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
func FetchSettings() ScanSettings {
	fileStat, e := os.Stat(settingsdb.Name())
	echeck(e)
	fileSize := fileStat.Size()
	file, e := os.ReadFile(dbFileSettings)
	echeck(e)

	if fileSize != 0 {
		var settings ScanSettings
		e = json.Unmarshal(file, &settings)
		echeck(e)

		if len(settings.ScannedDirs) == 0 {
			log.Println("ScannedDirs is empty. Adding default directories.")
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

			settings.ScannedDirs = dirsToCheck
		}
		return settings
	} else {
		// if settings file is empty, set defaults
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
		settings := ScanSettings{ScannedDirs: dirsToCheck, ExclDirs: []string{}, ExclHashes: []string{}, ExclProcs: []string{}, ScanIps: true, ScanHashes: true, ScanProcs: true}
		return settings
	}
}

func UpdateSettings(submittedSettings map[string]any) bool {
	settings := submittedSettings

	if len(settings["ScannedDirs"].([]any)) == 0 {
		log.Println("ScannedDirs is empty. Adding default directories.")
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
		settings["ScannedDirs"] = dirsToCheck
	}

	// Write back to settings.json
	data, err := json.MarshalIndent(settings, "", "  ")
	echeck(err)
	err = os.WriteFile(dbFileSettings, data, 0644)
	echeck(err)

	return true
}
