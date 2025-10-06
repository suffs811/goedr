package server

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/suffs811/goedr/godb"
	"github.com/suffs811/goedr/reporter"
)

var (
	err          error
	reportStatus string = "idle"
)

func Init() {
	// Create the Gin router
	r := gin.Default()

	// Creation endpoints
	//r.POST("/users", func(c *gin.Context) { createUser(c, db) })

	// Listing endpoints
	r.GET("/s/", func(c *gin.Context) { getReports(c) })
	r.GET("/s/delete", func(c *gin.Context) { delReport(c) })
	r.GET("/s/start", func(c *gin.Context) { startScan(c) })
	r.GET("/s/scanstatus", func(c *gin.Context) { scanStatus(c) })

	// Explicitly serve index.html at the root
	r.Static("/assets", "./dist/assets")
	// Serve static files under /assets
	r.StaticFile("/", "./dist/index.html")

	// Fallback to index.html
	r.NoRoute(func(c *gin.Context) {
		c.File("dist/index.html")
	})

	// Run the gin router
	err = r.Run(":4000")
	if err != nil {
		log.Fatal(err)
	}
}

func SetStatus(s string) {
	reportStatus = s
}

func getReports(c *gin.Context) {
	items := godb.FetchAll()

	// Return items
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func delReport(c *gin.Context) {
	timestamp := c.Query("timestamp")

	if timestamp == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error no timestamp provided": err.Error()})
		return
	}

	items := godb.Del(timestamp)
	log.Println(items)
	if items == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error deleting report from db": err.Error()})
		return
	}

	// Send new items
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func startScan(c *gin.Context) {
	reportStatus = "scanning"
	report := reporter.Start()
	log.Println(report)
	ok := godb.New(report)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Set status to complete for 5 seconds
	go func() {
		reportStatus = "completed"
		// After 2 seconds, set back to idle
		time.Sleep(2 * time.Second)
		reportStatus = "idle"
	}()

	// Send success message
	c.JSON(http.StatusOK, gin.H{"message": "Scan successful!"})
}

func scanStatus(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": reportStatus})
}
