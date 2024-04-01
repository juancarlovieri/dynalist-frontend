package main

import (
   "fmt"
   "log"
   "os"
	 "database/sql" 
	 _ "github.com/lib/pq" 
	 "github.com/joho/godotenv"

   "github.com/gofiber/fiber/v2" 
	 "github.com/gofiber/fiber/v2/middleware/cors"
)

type Node struct {
	Id				int `json:"id"`
	Info 			string `json:"info"`
	Parent 		int `json:"parent"`
	Prev			int `json:"prev"`
	Next			int `json:"next"`
}

func getEnv(key string) string {

  // load .env file
  err := godotenv.Load(".env")

  if err != nil {
    log.Fatalf("Error loading .env file")
  }

  return os.Getenv(key)
}

var DB =  getEnv("DB")

func parseRow(rows *sql.Rows) Node {
	var a int
	var b string
	var c int
	var d int
	var e int
	rows.Scan(&a, &b, &c, &d, &e)
	return Node{Id: a, Info: b, Parent: c, Prev: d, Next: e}
}

func rootHandler(c *fiber.Ctx, db *sql.DB) error {
	rows, err:= db.Query("SELECT * FROM " + DB)
	defer rows.Close()
	if err != nil {
		log.Fatalln(err)
		c.JSON("an unexpected error occured")
	}

	var nodes []Node
	for rows.Next() {
		nodes = append(nodes, parseRow(rows));
	}

	return c.JSON(nodes)
}

func createHandler(c *fiber.Ctx, db *sql.DB) error {
	newNode:= Node{}
	{
		err := c.BodyParser(&newNode)
		if err != nil {
			log.Printf("An error occured: %v", err)
			return c.SendString(err.Error())
		}
	}

	rows, err := db.Query("INSERT into " + DB + " (info, parent, prev, next) VALUES ($1, $2, $3, $4) RETURNING *", newNode.Info, newNode.Parent, newNode.Prev, newNode.Next)

	if err != nil {
		log.Fatalf("An error occured while executing query: %v", err)
	}
	defer rows.Close()
	rows.Next();

	ret := parseRow(rows);

	return c.JSON(ret);
}

func updateHandler(c *fiber.Ctx, db *sql.DB) error {
	id:= c.Query("id")
	newNode:= Node {}
	{
		err:= c.BodyParser(&newNode)
		if err != nil {
			log.Printf("An error occured: %v", err)
			return c.SendString(err.Error())
		}
	}

	rows, err := db.Query("UPDATE " + DB + " SET info=$1, parent=$2, prev=$3, next=$4 WHERE id=$5 RETURNING *", newNode.Info, newNode.Parent, newNode.Prev, newNode.Next, id)
	if err != nil {
		log.Fatalf("An error occured while executing query: %v", err)
	}
	defer rows.Close()
	rows.Next()

	ret := parseRow(rows)

	return c.JSON(ret)
}

func updateInfoHandler(c *fiber.Ctx, db *sql.DB) error {
	id:= c.Query("id")
	newNode:= Node {}
	{
		err:= c.BodyParser(&newNode)
		if err != nil {
			log.Printf("An error occured: %v", err)
			return c.SendString(err.Error())
		}
	}

	rows, err := db.Query("UPDATE " + DB + " SET info=$1 WHERE id=$2 RETURNING *", newNode.Info, id)
	if err != nil {
		log.Fatalf("An error occured while executing query: %v", err)
	}
	defer rows.Close()
	rows.Next()

	ret := parseRow(rows)

	return c.JSON(ret)
}

func getHandler(c *fiber.Ctx, db *sql.DB) error {
	id := c.Query("id")
	
	rows, err:= db.Query("SELECT * FROM " + DB + " WHERE ID=" + id)
	defer rows.Close()
	if err != nil {
		log.Fatalln(err)
		c.JSON("an unexpected error occured")
	}

	rows.Next()
	node := parseRow(rows)

	return c.JSON(node)
}

func deleteHelper(id string, db *sql.DB) {
	rows, err:= db.Query("SELECT * FROM " + DB + " WHERE parent=" + id)
	defer rows.Close()
	if err != nil {
		log.Fatalln(err)
	}

	for rows.Next() {
		tmp := parseRow(rows)
		deleteHelper(fmt.Sprintf("%v", tmp.Id), db)
	}

	db.Exec("DELETE FROM " + DB + " WHERE id=" + id)
}

func deleteHandler(c *fiber.Ctx, db *sql.DB) error {
	id := c.Query("id")
	
	deleteHelper(id, db);
	return c.SendStatus(200);
}


func main() {
	uri := getEnv("POSTGRES_URL")
	db, err := sql.Open("postgres", uri)

	if err != nil {
		log.Fatal(err)
	}
   
	app := fiber.New()
	app.Use(cors.New(cors.Config{
		AllowOrigins: "http://localhost:3000, http://dynalist-trial.ddnsfree.com, https://dynalist-trial.ddnsfree.com",
		AllowHeaders: "Origin, Content-Type, Accept",
	}))
   
	 
	app.Get("/", func(c *fiber.Ctx) error {
		return rootHandler(c, db)
	})

	app.Post("/create", func(c *fiber.Ctx) error {
		return createHandler(c, db)
	})

	app.Put("/update", func(c *fiber.Ctx) error {
		return updateHandler(c, db)
	})

	app.Put("/update/info", func(c *fiber.Ctx) error {
		return updateInfoHandler(c, db)
	})

	app.Get("/node", func(c *fiber.Ctx) error {
		return getHandler(c, db)
	})


	app.Delete("/delete", func (c *fiber.Ctx) error {
		return deleteHandler(c, db)
	})

  	 
	port := os.Getenv("PORT")
	if port == "" {
		port = "5000"
	}
	log.Fatalln(app.Listen(fmt.Sprintf(":%v", port)))
}