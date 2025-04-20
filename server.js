const http = require("http");
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2");

// MySQL config
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Videsh@123",
  database: "fooddonation", // database name
});

// Connect to DB
db.connect((err) => {
  if (err) throw err;
  console.log("✅ Connected to MySQL database.");
});

// Server
const server = http.createServer((req, res) => {
  // Serve HTML, CSS, JS files
  if (req.url === "/") {
    fs.readFile("./public/index.html", (err, data) => {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(data);
    });
  } else if (req.url === "/style.css") {
    fs.readFile("./public/style.css", (err, data) => {
      res.writeHead(200, { "Content-Type": "text/css" });
      res.end(data);
    });
  } else if (req.url === "/script.js") {
    fs.readFile("./public/script.js", (err, data) => {
      res.writeHead(200, { "Content-Type": "application/javascript" });
      res.end(data);
    });
  }

  // API routes to fetch data from MySQL database
  else if (req.url === "/api/donors") {
    db.query("SELECT * FROM Donor", (err, results) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "DB error" }));
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(results));
    });
  } else if (req.url === "/api/recipients") {
    db.query("SELECT * FROM Recipient", (err, results) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "DB error" }));
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(results));
    });
  } else if (req.url === "/api/fooditems") {
    db.query("SELECT * FROM FoodItems", (err, results) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "DB error" }));
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(results));
    });
  } else if (req.url === "/api/donations") {
    db.query("SELECT * FROM DonationDetails", (err, results) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "DB error" }));
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(results));
    });
  }

  // Handle 404
  else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 Not Found");
  }
});

server.listen(3000, () => {
  console.log("🚀 Server running at http://localhost:3000");
});
