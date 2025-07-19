const http = require("http");
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
require("dotenv").config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Gca@141125",
  database: process.env.DB_NAME || "fooddonation",
});

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err);
    throw err;
  }
  console.log("✅ Connected to MySQL database.");
});

// Normalize phone number by removing non-digits
const normalizePhoneNumber = (phone) => {
  return phone.replace(/\D/g, '');
};

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const filePath = path.join(__dirname, "public", req.url === "/" ? "index.html" : req.url);
  const extname = path.extname(filePath);
  const contentTypeMap = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
  };
  const contentType = contentTypeMap[extname];

  if (contentType) {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end("Error loading file");
      } else {
        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
      }
    });
  } else if (req.url === "/login" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        const { username, password, role } = JSON.parse(body);
        const tableMap = {
          donor: "Donor",
          recipient: "Recipient",
          admin: "Admin",
          volunteer: "Volunteer",
        };
        const table = tableMap[role];

        if (!table) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ success: false, message: "Invalid role" }));
        }

        if (role === "admin") {
          db.query(
            `SELECT * FROM Admin WHERE AdminID = ?`,
            [username],
            (err, results) => {
              if (err) {
                console.error("❌ Login query error:", err);
                res.writeHead(500, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ success: false, message: "Database error" }));
              }
              if (results.length > 0 && bcrypt.compareSync(password, results[0].Password)) {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true, redirectUrl: "/admin_dashboard.html" }));
              } else {
                res.writeHead(401, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: false, message: "Invalid AdminID or password" }));
              }
            }
          );
        } else {
          db.query(
            `SELECT * FROM ${table} WHERE Name = ?`,
            [username],
            (err, results) => {
              if (err) {
                console.error("❌ Login query error:", err);
                res.writeHead(500, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ success: false, message: "Database error" }));
              }
              if (results.length === 0) {
                res.writeHead(401, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ success: false, message: "User not found" }));
              }
              if (bcrypt.compareSync(password, results[0].Password)) {
                const redirectUrl =
                  role === "donor"
                    ? "/dashboard.html"
                    : role === "recipient"
                    ? "/recipient_dashboard.html"
                    : "/volunteer_dashboard.html";
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true, redirectUrl }));
              } else {
                res.writeHead(401, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: false, message: "Incorrect password" }));
              }
            }
          );
        }
      } catch (err) {
        console.error("❌ Login parsing error:", err);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, message: "Invalid request data" }));
      }
    });
  } else if (req.url === "/signup" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        const { name, email, address, phone, password, role } = JSON.parse(body);
        if (!name || !email || !address || !phone || !password || !role) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ success: false, message: "Missing required fields" }));
        }

        // Normalize and validate role
        const normalizedRole = role.toLowerCase();
        const tableMap = {
          donor: "Donor",
          recipient: "Recipient",
          volunteer: "Volunteer",
        };
        const table = tableMap[normalizedRole];
        if (!table) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ success: false, message: "Invalid role" }));
        }

        // Normalize phone number
        const normalizedPhone = normalizePhoneNumber(phone);

        bcrypt.hash(password, 10, (err, hash) => {
          if (err) {
            console.error("❌ Password hashing error:", err);
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ success: false, message: "Password hashing error" }));
          }
          db.query(
            "INSERT INTO SignupDetails (Name, Role, Email, Address, PhoneNumber, Password) VALUES (?, ?, ?, ?, ?, ?)",
            [name, normalizedRole, email, address, normalizedPhone, hash],
            (err, results) => {
              if (err) {
                console.error("❌ Signup insertion error:", err);
                res.writeHead(500, { "Content-Type": "application/json" });
                if (err.code === "ER_DUP_ENTRY") {
                  return res.end(JSON.stringify({ success: false, message: "Email already exists" }));
                }
                if (err.code === "ER_NO_SUCH_COLUMN") {
                  return res.end(JSON.stringify({ success: false, message: "Database schema error: Invalid column" }));
                }
                return res.end(JSON.stringify({ success: false, message: `Database error: ${err.message}` }));
              }

              // Role-specific insertion queries
              let insertQuery;
              let params;
              if (table === "Donor") {
                insertQuery = "INSERT INTO Donor (Name, PhoneNumber, Address, Password) VALUES (?, ?, ?, ?)";  // donorID
                params = [name, normalizedPhone, address, hash];
              } else if (table === "Recipient") {
                insertQuery = "INSERT INTO Recipient (Name, PhoneNumber, Address, Password) VALUES (?, ?, ?, ?)";
                params = [name, normalizedPhone, address, hash];
              } else if (table === "Volunteer") {
                insertQuery = "INSERT INTO Volunteer (Name, PhoneNumber, Address, Password) VALUES (?, ?, ?, ?)";
                params = [name, normalizedPhone, address, hash];
              }

              db.query(insertQuery, params, (err) => {
                if (err) {
                  console.error("❌ Role insertion error:", err);
                  res.writeHead(500, { "Content-Type": "application/json" });
                  if (err.code === "ER_NO_SUCH_COLUMN") {
                    return res.end(JSON.stringify({ success: false, message: "Database schema error: Invalid column in role table" }));
                  }
                  return res.end(JSON.stringify({ success: false, message: `Role insertion error: ${err.message}` }));
                }
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true }));
              });
            }
          );
        });
      } catch (err) {
        console.error("❌ Signup parsing error:", err);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, message: "Invalid request data" }));
      }
    });
  } else if (req.url === "/api/donors" && req.method === "GET") {
    db.query("SELECT * FROM Donor", (err, results) => {
      if (err) {
        console.error("❌ Donors query error:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ success: false, message: "Database error" }));
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, data: results }));
    });
  } else if (req.url === "/api/recipients" && req.method === "GET") {
    db.query("SELECT * FROM Recipient", (err, results) => {
      if (err) {
        console.error("❌ Recipients query error:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ success: false, message: "Database error" }));
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, data: results }));
    });
  } else if (req.url === "/api/fooditems" && req.method === "GET") {
    db.query("SELECT * FROM FoodItems", (err, results) => {
      if (err) {
        console.error("❌ FoodItems query error:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ success: false, message: "Database error" }));
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, data: results }));
    });
  } else if (req.url === "/api/donations" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        const { donorName, foodType, quantity, pickupAddress, date } = JSON.parse(body);
        if (!donorName || !foodType || !quantity || !pickupAddress || !date) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ success: false, message: "Missing required fields" }));
        }
        db.query(
          "SELECT DonorID FROM Donor WHERE Name = ?",
          [donorName],
          (err, donorResults) => {
            if (err || donorResults.length === 0) {
              res.writeHead(400, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({ success: false, message: "Invalid donor" }));
            }
            const donorID = donorResults[0].DonorID;
            db.query(
              "INSERT INTO FoodItems (FoodItemName, Quantity, ExpiryDate) VALUES (?, ?, DATE_ADD(?, INTERVAL 30 DAY)) ON DUPLICATE KEY UPDATE Quantity = Quantity + ?",
              [foodType, quantity, date, quantity],
              (err) => {
                if (err) {
                  console.error("❌ FoodItems insertion error:", err);
                  res.writeHead(500, { "Content-Type": "application/json" });
                  return res.end(JSON.stringify({ success: false, message: "Database error" }));
                }
                db.query(
                  "SELECT FoodItemID FROM FoodItems WHERE FoodItemName = ?",
                  [foodType],
                  (err, foodItemResults) => {
                    if (err || foodItemResults.length === 0) {
                      console.error("❌ FoodItemID query error:", err);
                      res.writeHead(500, { "Content-Type": "application/json" });
                      return res.end(JSON.stringify({ success: false, message: "Food item not found" }));
                    }
                    const foodItemID = foodItemResults[0].FoodItemID;
                db.query(
                  "INSERT INTO DonationDetails (DonorID, DateOfDonation, Quantity, FoodItemID) VALUES (?, ?, ?, ?)",  
                  [donorID, date, quantity, foodItemID], 
                  (err, results) => {
                    if (err) {
                      console.error("❌ Donation insertion error:", err);
                      res.writeHead(500, { "Content-Type": "application/json" });
                      return res.end(JSON.stringify({ success: false, message: "Database error" }));
                    }
                    db.query(
                      "INSERT INTO PickupRequest (DonorID, PickupID, PickupDate, PickupTime, Status) VALUES (?, ?, ?, '10:00:00', 'Pending')",
                      [donorID, results.insertId, date],
                      (err) => {
                        if (err) {
                          console.error("❌ PickupRequest insertion error:", err);
                        }
                        res.writeHead(200, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ success: true, donationID: results.insertId }));
                      }
                    );
                  }
                );
              }
            );
          }
        );
      } 
    );
      } catch (err) {
        console.error("❌ Donation parsing error:", err);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, message: "Invalid request data" }));
      }
    });
  } else if (req.url === "/api/feedback" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        const { rating, comments } = JSON.parse(body);
        if (!rating || !comments) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ success: false, message: "Missing required fields" }));
        }
        db.query(
          "INSERT INTO Feedback (Rating, Comments) VALUES (?, ?)",
          [rating, comments],
          (err, results) => {
            if (err) {
              console.error("❌ Feedback insertion error:", err);
              res.writeHead(500, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({ success: false, message: "Database error" }));
            }
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true }));
          }
        );
      } catch (err) {
        console.error("❌ Feedback parsing error:", err);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, message: "Invalid request data" }));
      }
    });
  } else if (req.url === "/api/requests" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        const { name, phone, location } = JSON.parse(body);
        if (!name || !phone || !location) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ success: false, message: "Missing required fields" }));
        }
        db.query(
          "SELECT DonorID FROM Donor WHERE Name = ?",
          [name],
          (err, donorResults) => {
            if (err || donorResults.length === 0) {
              console.error("❌ Donor query error:", err);
              res.writeHead(400, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({ success: false, message: "Invalid donor name" }));
            }
            const donorID = donorResults[0].DonorID;
        db.query(
          "INSERT INTO PickupRequest (DonorID, PickupDate, PickupTime, Status) VALUES (?, CURDATE(), '10:00:00', 'Pending')",
          [donorID],
          (err, results) => {
            if (err) {
              console.error("❌ Request insertion error:", err);
              res.writeHead(500, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({ success: false, message: "Database error" }));
            }
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true }));
          }
        );
      }
    );
      } catch (err) {
        console.error("❌ Request parsing error:", err);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, message: "Invalid request data" }));
      }
    });
  } else if (req.url === "/api/tasks" && req.method === "GET") {
    db.query(
      "SELECT p.PickupID, p.PickupDate, p.PickupTime, p.Status, f.FoodItemName, d.Quantity, d.DonorID FROM PickupRequest p JOIN DonationDetails d ON p.PickupID = d.DonationID JOIN FoodItems f ON d.Quantity = f.Quantity",
      (err, results) => {
        if (err) {
          console.error("❌ Tasks query error:", err);
          res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ success: false, message: "Database error" }));
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, data: results }));
      }
    );
  } 
  // Fetch user profile
// Fetch user profile
else if (req.url === '/api/profile' && req.method === "GET") {
  const urlParams = new URLSearchParams(req.url.split('?')[1] || '');
  const userName = urlParams.get('userName');

  const query = `
    SELECT up.*
    FROM UserProfile up
    JOIN User u ON up.UserID = u.UserID
    WHERE u.Name = ?
  `;
  db.query(query, [userName], (err, results) => {
    if (err) {
      console.error("❌ Profile fetch error:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ success: false, message: err.message }));
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true, data: results }));
  });
}

// Save or update user profile with duplicate name check
else if (req.url === '/api/profile' && req.method === "POST") {
  let body = '';
  req.on("data", (chunk) => { body += chunk; });
  req.on("end", () => {
    try {
      const { userName, bio, contactMethod, notifications } = JSON.parse(body);

      // Check for duplicate name
      db.query("SELECT COUNT(*) AS count FROM User WHERE Name = ?", [userName], (err, results) => {
        if (err) {
          console.error("❌ Duplicate check error:", err);
          res.writeHead(500, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ success: false, message: "Database error" }));
        }
        if (results[0].count > 0) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ success: false, message: "Name already exists. Please use a different name." }));
        }

        // If no duplicate, proceed to save or update profile
        db.query("SELECT UserID FROM User WHERE Name = ?", [userName], (err, results) => {
          if (err || results.length === 0) {
            console.error("❌ User not found:", err);
            res.writeHead(404, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ success: false, message: "User not found" }));
          }

          const userId = results[0].UserID;

          db.query("SELECT * FROM UserProfile WHERE UserID = ?", [userId], (err, results) => {
            if (err) {
              console.error("❌ Profile check error:", err);
              res.writeHead(500, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({ success: false, message: "Database error" }));
            }

            if (results.length > 0) {
              const updateQuery = `
                UPDATE UserProfile
                SET Bio = ?, PreferredContactMethod = ?, NotificationPreference = ?
                WHERE UserID = ?
              `;
              db.query(updateQuery, [bio, contactMethod, notifications, userId], (err) => {
                if (err) {
                  console.error("❌ Profile update error:", err);
                  res.writeHead(500, { "Content-Type": "application/json" });
                  return res.end(JSON.stringify({ success: false, message: "Database error" }));
                }
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true }));
              });
            } else {
              const insertQuery = `
                INSERT INTO UserProfile (UserID, Bio, PreferredContactMethod, NotificationPreference)
                VALUES (?, ?, ?, ?)
              `;
              db.query(insertQuery, [userId, bio, contactMethod, notifications], (err) => {
                if (err) {
                  console.error("❌ Profile insert error:", err);
                  res.writeHead(500, { "Content-Type": "application/json" });
                  return res.end(JSON.stringify({ success: false, message: "Database error" }));
                }
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true }));
              });
            }
          });
        });
      });
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError);
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ success: false, message: "Invalid JSON data" }));
    }
  });
}
// Fetch food items for the dropdown
else if (req.url === '/api/food_items' && req.method === "GET") {
  db.query("SELECT FoodItemID, FoodItemName FROM FoodItems", (err, results) => {
    if (err) {
      console.error("❌ Food items fetch error:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ success: false, message: "Database error" }));
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true, data: results }));
  });
}

// Submit donation request
else if (req.url === '/api/request_donation' && req.method === "POST") {
  let body = '';
  req.on("data", (chunk) => { body += chunk; });
  req.on("end", () => {
    try {
      const { recipientName, foodItemId, quantity } = JSON.parse(body);

      db.query("SELECT UserID FROM User WHERE Name = ?", [recipientName], (err, results) => {
        if (err || results.length === 0) {
          console.error("❌ Recipient not found:", err);
          res.writeHead(404, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ success: false, message: "Recipient not found" }));
        }

        const recipientId = results[0].UserID;
        const insertQuery = "INSERT INTO DonationRequests (RecipientID, FoodItemID, Quantity) VALUES (?, ?, ?)";
        db.query(insertQuery, [recipientId, foodItemId, quantity], (err) => {
          if (err) {
            console.error("❌ Request insertion error:", err);
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ success: false, message: "Database error" }));
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        });
      });
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError);
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ success: false, message: "Invalid JSON data" }));
    }
  });
}

// Fetch pending requests for recipient
else if (req.url.match(/^\/api\/pending_requests/) && req.method === "GET") {
  const urlParams = new URLSearchParams(req.url.split('?')[1] || '');
  const recipientName = urlParams.get('recipientName');

  const query = `
    SELECT dr.RequestID, f.FoodItemName, dr.Quantity, dr.Status, dr.RequestDate
    FROM DonationRequests dr
    JOIN User u ON dr.RecipientID = u.UserID
    JOIN FoodItems f ON dr.FoodItemID = f.FoodItemID
    WHERE u.Name = ? AND dr.Status IN ('pending', 'approved')
  `;
  db.query(query, [recipientName], (err, results) => {
    if (err) {
      console.error("❌ Pending requests fetch error:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ success: false, message: "Database error" }));
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true, data: results }));
  });
}

// Fetch received donations for recipient
else if (req.url.match(/^\/api\/received_donations/) && req.method === "GET") {
  const urlParams = new URLSearchParams(req.url.split('?')[1] || '');
  const recipientName = urlParams.get('recipientName');

  const query = `
    SELECT f.FoodItemName, rd.Quantity, rd.ReceivedDate
    FROM ReceivedDonations rd
    JOIN User u ON rd.RecipientID = u.UserID
    JOIN FoodItems f ON rd.FoodItemID = f.FoodItemID
    WHERE u.Name = ?
  `;
  db.query(query, [recipientName], (err, results) => {
    if (err) {
      console.error("❌ Received donations fetch error:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ success: false, message: "Database error" }));
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true, data: results }));
  });
}

// Admin/Volunteer endpoint to view all pending requests (example)
else if (req.url === '/api/all_pending_requests' && req.method === "GET") {
  const query = `
    SELECT u.Name AS RecipientName, f.FoodItemName, dr.Quantity, dr.Status, dr.RequestDate
    FROM DonationRequests dr
    JOIN User u ON dr.RecipientID = u.UserID
    JOIN FoodItems f ON dr.FoodItemID = f.FoodItemID
    WHERE dr.Status IN ('pending', 'approved')
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error("❌ All pending requests fetch error:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ success: false, message: "Database error" }));
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true, data: results }));
  });
}

// Mark donation as received (to be called by admin/volunteer)
else if (req.url === "/api/mark_received" && req.method === "POST") {
  let body = '';
  req.on("data", (chunk) => { body += chunk; });
  req.on("end", () => {
    try {
      const { requestId, recipientName } = JSON.parse(body);

      db.query("SELECT UserID FROM User WHERE Name = ?", [recipientName], (err, results) => {
        if (err || results.length === 0) {
          console.error("❌ Recipient not found:", err);
          res.writeHead(404, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ success: false, message: "Recipient not found" }));
        }

        const recipientId = results[0].UserID;
        db.query("SELECT * FROM DonationRequests WHERE RequestID = ? AND RecipientID = ?", [requestId, recipientId], (err, results) => {
          if (err || results.length === 0) {
            console.error("❌ Request not found:", err);
            res.writeHead(404, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ success: false, message: "Request not found" }));
          }

          const { FoodItemID, Quantity } = results[0];
          db.query("INSERT INTO ReceivedDonations (RequestID, RecipientID, FoodItemID, Quantity) VALUES (?, ?, ?, ?)", 
            [requestId, recipientId, FoodItemID, Quantity], (err) => {
            if (err) {
              console.error("❌ Received donation insert error:", err);
              res.writeHead(500, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({ success: false, message: "Database error" }));
            }
            db.query("UPDATE DonationRequests SET Status = 'fulfilled' WHERE RequestID = ?", [requestId], (err) => {
              if (err) {
                console.error("❌ Status update error:", err);
                res.writeHead(500, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ success: false, message: "Database error" }));
              }
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: true }));
            });
          });
        });
      });
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError);
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ success: false, message: "Invalid JSON data" }));
    }
  });
}  
else if (req.url === "/api/opportunities" && req.method === "GET") {
    const opportunities = [
      { name: "Food Sorting", location: "Warehouse A", description: "Help sort donated food items." },
      { name: "Delivery Driver", location: "City Center", description: "Deliver food to recipients." },
    ];
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true, data: opportunities }));
  } else if (req.url === "/api/notifications" && req.method === "GET") {
    db.query("SELECT MessageDate, Status FROM Notification", (err, results) => {
      if (err) {
        console.error("❌ Notifications query error:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ success: false, message: "Database error" }));
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, data: results }));
    });
  }else if (req.url.startsWith('/api/donation_history') && req.method === "GET") {
    let body = '';
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      // Parse query parameters (e.g., ?donorName=John%20Doe)
      const urlParams = new URLSearchParams(req.url.split('?')[1] || '');
      const donorName = urlParams.get('donorName');
  
      let query = `
        SELECT d.DonationID, d.DateOfDonation, d.Quantity, f.FoodItemName, p.Status
        FROM DonationDetails d
        JOIN FoodItems f ON d.FoodItemID = f.FoodItemID
        JOIN PickupRequest p ON d.DonationID = p.PickupID
        WHERE d.DonorID IN (
          SELECT DonorID FROM Donor WHERE Name = ?
        )
      `;
      db.query(query, [donorName], (err, results) => {
        if (err) {
          console.error("❌ Donation history query error:", err);
          res.writeHead(500, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ success: false, message: "Database error" }));
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, data: results }));
      });
    });
  } else if (req.url === "/api/received_donations" && req.method === "GET") {
    db.query(
      "SELECT d.DonationID, d.DonorID, d.DateOfDonation, d.Quantity, f.FoodItemName, c.CategoryType, p.Status FROM DonationDetails d JOIN FoodItems f ON d.Quantity = f.Quantity JOIN Category c ON f.FoodItemID = c.FoodItemID JOIN PickupRequest p ON d.DonationID = p.PickupID", // changed
      (err, results) => {
        if (err) {
          console.error("❌ Received donations query error:", err);
          res.writeHead(500, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ success: false, message: "Database error" }));
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, data: results }));
      }
    );
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 Not Found");
  }
});

server.listen(3100, () => {
  console.log("🚀 Server running at http://localhost:3100");
});