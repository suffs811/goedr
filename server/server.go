package server

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/pkg/browser"

	"github.com/suffs811/goedr/godb"
	"github.com/suffs811/goedr/scanner"
)

var (
	err          error
	reportStatus string = "idle"
)

func Init() {
	// Create the Gin router
	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()
	r.SetTrustedProxies([]string{"127.0.0.1"})

	fmt.Print("\n\n[#] Server has started. Visit http://localhost:4000 to use the GoEDR app [#]\n\n\n")

	// Creation endpoints
	r.POST("/s/updatesettings", func(c *gin.Context) { updateSettings(c) })

	// Listing endpoints
	r.GET("/s/dashboard", func(c *gin.Context) { getReports(c) })
	r.GET("/s/delete", func(c *gin.Context) { delReport(c) })
	r.GET("/s/start", func(c *gin.Context) { startScan(c) })
	r.GET("/s/scanstatus", func(c *gin.Context) { scanStatus(c) })
	r.GET("/s/settings", func(c *gin.Context) { getSettings(c) })

	// Explicitly serve index.html at the root
	r.Static("/assets", "./dist/assets")
	// Serve static files under /assets
	r.StaticFile("/", "./dist/index.html")

	// Fallback to index.html
	r.NoRoute(func(c *gin.Context) {
		c.File("dist/index.html")
	})

	go func() {
		browser.OpenURL("http://localhost:4000/")
	}()

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
	log.Println("Starting scan...")
	report := scanner.Start()
	log.Println("report: ", report)
	if report == nil {
		reportStatus = "idle"
		c.JSON(http.StatusOK, gin.H{"message": "No scan types selected. Exiting scan..."})
		return
	}
	securityReport, ok := report.(godb.SecurityReport)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid report type"})
		return
	}
	success := godb.New(securityReport)
	if !success {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Set status to complete for 2 seconds
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

func getSettings(c *gin.Context) {
	settings := godb.FetchSettings()
	c.JSON(http.StatusOK, gin.H{"settings": settings})
}

func updateSettings(c *gin.Context) {
	// Parse JSON body and set to settings variable
	settings := make(map[string]any)

	if err := c.BindJSON(&settings); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload."})
		return
	}

	// Update settings in the database
	update := godb.UpdateSettings(settings)
	if update {
		c.JSON(http.StatusCreated, gin.H{"settings": settings})
	} else {
		c.JSON(500, gin.H{"error": "Failed to update settings."})
	}
}
