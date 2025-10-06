package godb

import (
	"encoding/json"
	"log"
	"os"
)

type SecurityReport struct {
	Timestamp string
	Ips       []string
	Hashes    []string
	Cmds      []string
}

var (
	dir    string
	db     *os.File
	dbFile string
)

func init() {
	var err error

	// Get working directory
	dir, err = os.Getwd()
	echeck(err)
	dir += "/db/"

	// Ensure /db directory exists
	if e := os.Mkdir(dir, 0750); e != nil && !os.IsExist(e) {
		echeck(e)
	}

	// Open or create reports.json
	dbFile = dir + "reports.json"
	db, err = os.OpenFile(dbFile, os.O_RDWR|os.O_CREATE, 0644)
	echeck(err)
}

func echeck(e error) {
	if e != nil {
		panic(e)
	}
}

func FetchAll() map[string]any {
	fileStat, e := os.Stat(db.Name())
	echeck(e)
	fileSize := fileStat.Size()
	file, e := os.ReadFile(dbFile)
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
			err = os.WriteFile(dbFile, data, 0644)
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
	err = os.WriteFile(dbFile, data, 0644)
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
	err = os.WriteFile(dbFile, data, 0644)
	echeck(err)

	return true, items
}

func ClearDB() bool {
	err := os.Truncate(dbFile, 0)
	echeck(err)
	return true
}

func CloseDB() {
	err := db.Close()
	echeck(err)
	log.Println("DB Closed successfully")
}
