package main

import (
	"github.com/suffs811/goedr/godb"
	"github.com/suffs811/goedr/server"
)

func init() {
	// Run gin server
	server.Init()
}

func InitSetStatus(s string) {
	server.SetStatus(s)
}

func main() {

	// Working with godb
	defer godb.CloseDB()
}
