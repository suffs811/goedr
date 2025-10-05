# Working with godb

### Close the DB on program exit
```go
defer godb.CloseDB()
```

### Create example SecurityReport struct item
```go
timestamp := strconv.FormatInt(time.Now().UTC().UnixMilli(), 10)
var report godb.SecurityReport
var ip, hash, cmd []string
report.Timestamp = timestamp
report.Ip = ip
report.Hash = hash
report.Cmd = cmd
```

### Add the new item to the db
```go
ok = godb.New(report)
okcheck(ok)
```

### Fetch all items
```go
items := godb.FetchAll()
if items != nil {
    log.Println(items)
}
```

### Fetch one item (parameter = key search query (timestamp))
```go
item := godb.Fetch(timestamp)
```

### Delete an item
```go
items := godb.Del(timestamp)
```

### Modify an item
```go
// godb.Mod(<keyToFindItem>, <attributeToChange>, <newValueForAttribute>)
ok, result := godb.Mod(timestamp, "ip", []string{""})
```

### Delete all items from DB
```go
ok = godb.ClearDB()
okcheck(ok)
```