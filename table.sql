-- CREATE DATABASE fooddonation;
USE fooddonation;

-- IMPORTANT: Before adding the UNIQUE constraint on Email in SignupDetails,
-- ensure there are no duplicate email addresses in the table.
-- Run the following query to check for duplicates:
-- SELECT Email, COUNT(*) FROM SignupDetails GROUP BY Email HAVING COUNT(*) > 1;
-- If duplicates exist, resolve them before applying the UNIQUE constraint.

-- Admin table
CREATE TABLE Admin (
    AdminID INT PRIMARY KEY AUTO_INCREMENT,
    Password VARCHAR(255) NOT NULL
);
-- Insert hashed password (generated with bcrypt, salt rounds=10)
INSERT INTO Admin (AdminID, Password)
VALUES (1, '$2b$10$UqVRJNxisXtMQaib9XIPWut6vxsxfmnbCjyeTuEvr3rZ4FeuotGHK');

-- SignupDetails table
CREATE TABLE SignupDetails (
    SignupID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(100) NOT NULL,
    Address VARCHAR(255),
    Email VARCHAR(100) NOT NULL UNIQUE, -- Added UNIQUE constraint
    PhoneNumber VARCHAR(15) NOT NULL,
    role VARCHAR(50) NOT NULL,
    Password VARCHAR(255) NOT NULL
);
-- Alternative for existing databases: Add UNIQUE constraint
-- ALTER TABLE SignupDetails ADD CONSTRAINT unique_email UNIQUE (Email);
INSERT INTO SignupDetails (SignupID, Name, Address, Email, PhoneNumber, role, Password)
VALUES (1, 'Michael Johnson', '789 Pine St', 'mjohnson@email.com', '321-654-9870', 'donor', '$2b$10$7t9Xg1b7mYbZ3Xz3j9kZ0u2y8j1k2l3m4n5o6p7q8r9s0t1u2v3w4x');

-- Donor table
CREATE TABLE Donor (
    DonorID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(100) NOT NULL,
    PhoneNumber VARCHAR(15) NOT NULL,
    Address VARCHAR(255),
    Password VARCHAR(255) NOT NULL
);
INSERT INTO Donor (DonorID, Name, PhoneNumber, Address, Password)
VALUES (1, 'John Doe', '123-456-7890', '123 Elm St', '$2b$10$7t9Xg1b7mYbZ3Xz3j9kZ0u2y8j1k2l3m4n5o6p7q8r9s0t1u2v3w4x');

-- Recipient table
CREATE TABLE Recipient (
    RecipientID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(100) NOT NULL,
    PhoneNumber VARCHAR(15) NOT NULL,
    Address VARCHAR(255),
    Password VARCHAR(255) NOT NULL
);
INSERT INTO Recipient (RecipientID, Name, PhoneNumber, Address, Password)
VALUES (1, 'Jane Smith', '987-654-3210', '456 Oak St', '$2b$10$7t9Xg1b7mYbZ3Xz3j9kZ0u2y8j1k2l3m4n5o6p7q8r9s0t1u2v3w4x');

-- Volunteer table
CREATE TABLE Volunteer (
    VolunteerID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(100) NOT NULL,
    PhoneNumber VARCHAR(15) NOT NULL,
    Address VARCHAR(255),
    Password VARCHAR(255) NOT NULL
);
INSERT INTO Volunteer (VolunteerID, Name, PhoneNumber, Address, Password)
VALUES (1, 'Emily Brown', '555-123-4567', NULL, '$2b$10$7t9Xg1b7mYbZ3Xz3j9kZ0u2y8j1k2l3m4n5o6p7q8r9s0t1u2v3w4x');

-- FoodItems table
-- DROP TABLE IF EXISTS FoodItems;
CREATE TABLE FoodItems (
    FoodItemID INT  PRIMARY KEY AUTO_INCREMENT,
    FoodItemName VARCHAR(100) NOT NULL,
    Quantity INT NOT NULL,
    ExpiryDate DATE NOT NULL,
    UNIQUE (FoodItemName, ExpiryDate)
);
INSERT INTO FoodItems (FoodItemID, FoodItemName, Quantity, ExpiryDate)
VALUES (1, 'Rice', 100, '2025-05-10');

-- Category table (redesigned)
CREATE TABLE Category (
    CategoryID INT PRIMARY KEY AUTO_INCREMENT,
    FoodItemID INT NOT NULL,
    CategoryType ENUM('Veg', 'NonVeg') NOT NULL,
    FOREIGN KEY (FoodItemID) REFERENCES FoodItems(FoodItemID)
);
INSERT INTO Category (CategoryID, FoodItemID, CategoryType)
VALUES (1, 1, 'Veg');

-- DonationDetails table
CREATE TABLE DonationDetails (
    DonationID INT PRIMARY KEY AUTO_INCREMENT,
    DonorID INT NOT NULL,
    DateOfDonation DATE NOT NULL,
    Quantity INT NOT NULL,
    FoodItemID INT NOT NULL,
    FOREIGN KEY (DonorID) REFERENCES Donor(DonorID),
    FOREIGN KEY (FoodItemID) REFERENCES FoodItems(FoodItemID)
);
INSERT INTO DonationDetails (DonationID, DonorID, DateOfDonation, Quantity, FoodItemID)
VALUES (1, 1, '2025-03-01', 50, 1);

-- DistributionDetails table
CREATE TABLE DistributionDetails (
    DistributionID INT PRIMARY KEY AUTO_INCREMENT,
    RecipientID INT NOT NULL,
    Status VARCHAR(20) NOT NULL,
    DistributionDate DATE NOT NULL,
    FoodItemID INT NOT NULL,
    FOREIGN KEY (RecipientID) REFERENCES Recipient(RecipientID),
    FOREIGN KEY (FoodItemID) REFERENCES FoodItems(FoodItemID)
);
INSERT INTO DistributionDetails (DistributionID, RecipientID, Status, DistributionDate, FoodItemID)
VALUES (1, 1, 'Completed', '2025-03-05', 1);

-- PickupRequest table
CREATE TABLE PickupRequest (
    PickupID INT PRIMARY KEY AUTO_INCREMENT,
    DonorID INT NOT NULL,
    PickupDate DATE NOT NULL,
    PickupTime TIME NOT NULL,
    Status VARCHAR(20) NOT NULL,
    VolunteerID INT,
    FOREIGN KEY (DonorID) REFERENCES Donor(DonorID),
    FOREIGN KEY (VolunteerID) REFERENCES Volunteer(VolunteerID)
);
INSERT INTO PickupRequest (PickupID, DonorID, PickupDate, PickupTime, Status, VolunteerID)
VALUES (1, 1, '2025-03-07', '10:00:00', 'Pending', 1);

-- StorageLocation table
CREATE TABLE StorageLocation (
    LocationID INT PRIMARY KEY AUTO_INCREMENT,
    Location VARCHAR(100) NOT NULL,
    RecipientID INT NOT NULL,
    Capacity INT NOT NULL,
    Name VARCHAR(100) NOT NULL,
    FOREIGN KEY (RecipientID) REFERENCES Recipient(RecipientID)
);
INSERT INTO StorageLocation (LocationID, Location, RecipientID, Capacity, Name)
VALUES (1, 'Warehouse 1', 1, 200, 'Storage A');

-- Feedback table
CREATE TABLE Feedback (
    FeedbackID INT PRIMARY KEY AUTO_INCREMENT,
    Rating INT NOT NULL,
    Comments TEXT,
    DonorID INT,
    RecipientID INT,
    FOREIGN KEY (DonorID) REFERENCES Donor(DonorID),
    FOREIGN KEY (RecipientID) REFERENCES Recipient(RecipientID)
);
INSERT INTO Feedback (FeedbackID, Rating, Comments, DonorID, RecipientID)
VALUES (1, 5, 'Excellent service and food quality!', 1, 1);

-- History table
CREATE TABLE History (
    HistoryID INT PRIMARY KEY AUTO_INCREMENT,
    Status VARCHAR(20) NOT NULL,
    DonationID INT,
    DistributionID INT,
    FOREIGN KEY (DonationID) REFERENCES DonationDetails(DonationID),
    FOREIGN KEY (DistributionID) REFERENCES DistributionDetails(DistributionID)
);
INSERT INTO History (HistoryID, Status, DonationID, DistributionID)
VALUES (1, 'Completed', 1, 1);

-- Notification table
CREATE TABLE Notification (
    NotificationID INT PRIMARY KEY AUTO_INCREMENT,
    MessageDate DATE NOT NULL,
    DonorID INT,
    RecipientID INT,
    AdminID INT,
    SendDate DATE NOT NULL,
    Status VARCHAR(20) NOT NULL,
    FOREIGN KEY (DonorID) REFERENCES Donor(DonorID),
    FOREIGN KEY (RecipientID) REFERENCES Recipient(RecipientID),
    FOREIGN KEY (AdminID) REFERENCES Admin(AdminID)
);
INSERT INTO Notification (NotificationID, MessageDate, DonorID, RecipientID, AdminID, SendDate, Status)
VALUES (1, '2025-03-10', 1, 1, 1, '2025-03-10', 'Unread');

-- Inventory table
CREATE TABLE Inventory (
    InventoryID INT PRIMARY KEY AUTO_INCREMENT,
    FoodItemID INT NOT NULL,
    Quantity INT NOT NULL,
    StorageLocationID INT NOT NULL,
    FOREIGN KEY (FoodItemID) REFERENCES FoodItems(FoodItemID),
    FOREIGN KEY (StorageLocationID) REFERENCES StorageLocation(LocationID)
);
INSERT INTO Inventory (InventoryID, FoodItemID, Quantity, StorageLocationID)
VALUES (1, 1, 50, 1);

