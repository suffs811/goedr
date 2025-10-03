package main

import (
	"fmt"

	"github.com/suffs811/godb"
)

type SecurityReport struct {
	Timestamp string
	B_ips     bool
	D_ips     []string
	B_hash    bool
	D_hash    []string
	B_cmd     bool
	D_cmd     []string
}

func main() {
	fmt.Println("Welcome to Goedr!")

}
