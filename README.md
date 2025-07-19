FoodBridge is a web application that connects food donors with recipients to reduce food waste and support communities in need. Recipients can request food donations, which are automatically mapped to available donors and sent to admins for approval. Volunteers assist with logistics, and admins oversee operations.

Features
User Roles: Supports donors, recipients, volunteers, and admins.
Donation Requests: Recipients request food, mapped to donors based on availability.
Admin Oversight: Admins approve/reject donation requests and manage users.
Volunteer Tasks: Volunteers view and accept pickup/delivery tasks.
Feedback System: Users can submit feedback to improve the platform.
Dashboards: Role-specific dashboards for donors, recipients, volunteers, and admins.

Tech Stack
Backend: Node.js, Express (implied), MySQL
Frontend: HTML, CSS, JavaScript (served from public directory)
Dependencies: mysql2, bcrypt, dotenv

Prerequisites
Node.js (v16 or higher)
MySQL (v8 or higher)
Git

Setup Instructions:

Step1: Clone the ropo
"git clone https://github.com/your-repo/foodbridge.git
cd foodbridge"

step2: Install dependencies
"npm install"

step3: create an .env file in root directory , and paste the below info
"DB_HOST=localhost
DB_USER=root
DB_PASSWORD= <your_password> // this is the one , you'll fix, when you install mysql , for root user
DB_NAME=fooddonation"

step4: setup MySQL database
"mysql -u root -p
< enter your password >

show databases; // after entering mysql shell
 drop database if exists foodbridge; // if there is already any database with same name
 create database foodbridge;
exit;

step5: paste the below command
for normal powershell: mysql -u root -p foodbridge < table.sql
for other unix-type shell : Get-Content .\table.sql | mysql -u root -p foodbridge  // if the above one doesnt work

step6: start the server "node server.js"
To View and access the website using http://localhost:3000 

Usage
Access the App: Open http://localhost:3000 in a browser to view index.html (login page).
Sign Up: Register as a donor, recipient, or volunteer via the /signup endpoint.
Login: Log in with your credentials and role to access role-specific dashboards.
Donate: The user can Donate the food , that they have, and that they want to donate.
Request Donation: Recipients can request food via the recipient dashboard, specifying receiverName, foodType, quantity, deliveryAddress, and date.
Volunteering: A volunteer can control the process the mapping of a donor to some recipients.
Admin Actions: Admins approve/reject donations and view notifications on the admin dashboard.

API Endpoints
POST /login: Authenticate users (donors, recipients, volunteers, admins).
POST /signup: Register new users.
POST /api/donations: Submit donation requests (recipient-driven).
GET /api/donors: List all donors (admin access).
GET /api/recipients: List all recipients (admin access).
GET /api/fooditems: View food inventory.
GET /api/notifications: Fetch admin notifications.
GET /api/donation_history: View donor donation history.
GET /api/received_donations: View recipient received donations.

Contributions are welcome!!!
To contribute:
Fork the repository.
Create a feature branch (git checkout -b feature/your-feature).
Commit changes (git commit -m "Add your feature").
Push to the branch (git push origin feature/your-feature).
Open a pull request.

License
MIT License. See LICENSE for details.

Contact
For questions or support, contact saividesh4@gmail.com.

This is a test branch change

