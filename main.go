package main

import (
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/suffs811/goedr/godb"
	"github.com/suffs811/goedr/reporter"
)

var (
	ok  bool
	err error
)

func okcheck(ok bool) {
	if !ok {
		panic(ok)
	}
}

func startGin() {
	// Create the Gin router
	r := gin.Default()
	// r.SetTrustedProxies([]string{"192.168.1.2"})

	if err != nil {
		log.Fatal(err)
	}

	// Creation endpoints
	//r.POST("/users", func(c *gin.Context) { createUser(c, db) })

	// Listing endpoints
	//r.GET("/channels", func(c *gin.Context) { listChannels(c, db) })

	// Explicitly serve index.html at the root
	r.StaticFile("/", "dist/index.html")
	// Serve static files under /static
	r.StaticFS("/static", http.Dir("dist/assets"))

	// Run the gin router
	err = r.Run(":4000")
	if err != nil {
		log.Fatal(err)
	}
}

func main() {
	// Start the gin router
	// startGin()

	//Working with godb
	defer godb.CloseDB()
	log.Println("Welcome to Goedr!")

	// Create new SecurityReport struct
	timestamp := strconv.FormatInt(time.Now().UTC().UnixMilli(), 10)
	var report godb.SecurityReport
	var ips, hashes, cmds []string
	report.Timestamp = timestamp
	report.Ips = ips
	report.Hashes = hashes
	report.Cmds = cmds

	// Add the new report to the db
	ok = godb.New(report)
	okcheck(ok)

	// Fetch all reports
	items := godb.FetchAll()
	if items != nil {
		log.Println(items)
	}

	// Start reporter
	newReport := reporter.Start()
	ok = godb.New(newReport)
	okcheck(ok)

	// Delete all reports
	ok = godb.ClearDB()
	okcheck(ok)
}
