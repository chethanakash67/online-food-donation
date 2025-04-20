-- create database fooddonation;
use fooddonation;
CREATE TABLE Donor (
    DonorID INT PRIMARY KEY,
    DonorName VARCHAR(100),
    PhoneNumber VARCHAR(15),
    Address VARCHAR(255)
);

INSERT INTO Donor (DonorID, DonorName, PhoneNumber, Address)
VALUES (1, 'John Doe', '123-456-7890', '123 Elm St');
SELECT * FROM Donor;

CREATE TABLE Recipient (
    RecipientID INT PRIMARY KEY,
    Name VARCHAR(100),
    PhoneNumber VARCHAR(15),
    Address VARCHAR(255)
);

INSERT INTO Recipient (RecipientID, Name, PhoneNumber, Address)
VALUES (1, 'Jane Smith', '987-654-3210', '456 Oak St');

SELECT * FROM Recipient;

CREATE TABLE FoodItems (
    FoodItemName VARCHAR(100) PRIMARY KEY,
    Quantity INT,
    ExpiryDate DATE
);

INSERT INTO FoodItems (FoodItemName, Quantity, ExpiryDate)
VALUES ('Rice', 100, '2025-05-10');

SELECT * FROM FoodItems;

CREATE TABLE DonationDetails (
    DonationID INT PRIMARY KEY,
    DonorID INT,
    DateOfDonation DATE,
    Quantity INT,
    FOREIGN KEY (DonorID) REFERENCES Donor(DonorID)
);

INSERT INTO DonationDetails (DonationID, DonorID, DateOfDonation, Quantity)
VALUES (1, 1, '2025-03-01', 50);

SELECT * FROM DonationDetails;

CREATE TABLE DistributionDetails (
    DistributionID INT PRIMARY KEY,
    Status VARCHAR(20),
    DistributionDate DATE
);

INSERT INTO DistributionDetails (DistributionID, Status, DistributionDate)
VALUES (1, 'Completed', '2025-03-05');

SELECT * FROM DistributionDetails;

CREATE TABLE PickupRequest (
    PickupID INT PRIMARY KEY,
    PickupDate DATE,
    PickupTime TIME,
    Status VARCHAR(20)
);

INSERT INTO PickupRequest (PickupID, PickupDate, PickupTime, Status)
VALUES (1, '2025-03-07', '10:00:00', 'Pending');

SELECT * FROM PickupRequest;

CREATE TABLE StorageLocation (
    Location VARCHAR(100),
    RecipientID INT,
    Capacity INT,
    Name VARCHAR(100),
    FOREIGN KEY (RecipientID) REFERENCES Recipient(RecipientID)
);

INSERT INTO StorageLocation (Location, RecipientID, Capacity, Name)
VALUES ('Warehouse 1', 1, 200, 'Storage A');

SELECT * FROM StorageLocation;

CREATE TABLE Volunteer (
    VolunteerID INT PRIMARY KEY,
    Name VARCHAR(100),
    PhoneNumber VARCHAR(15)
);

INSERT INTO Volunteer (VolunteerID, Name, PhoneNumber)
VALUES (1, 'Emily Brown', '555-123-4567');

SELECT * FROM Volunteer;

CREATE TABLE SignupDetails (
    SignupID INT PRIMARY KEY,
    Name VARCHAR(100),
    Address VARCHAR(255),
    Email VARCHAR(100),
    PhoneNumber VARCHAR(15)
);

INSERT INTO SignupDetails (SignupID, Name, Address, Email, PhoneNumber)
VALUES (1, 'Michael Johnson', '789 Pine St', 'mjohnson@email.com', '321-654-9870');

SELECT * FROM SignupDetails;

CREATE TABLE Category (
    Veg VARCHAR(100),
    FoodItemName VARCHAR(100),
    NonVeg VARCHAR(100),
    FOREIGN KEY (FoodItemName) REFERENCES FoodItems(FoodItemName)
);

INSERT INTO Category (Veg, FoodItemName, NonVeg)
VALUES ('Vegetarian', 'Rice', 'Chicken');

SELECT * FROM Category;

CREATE TABLE Feedback (
    FeedbackID INT PRIMARY KEY,
    Rating INT,
    Comments TEXT
);

INSERT INTO Feedback (FeedbackID, Rating, Comments)
VALUES (1, 5, 'Excellent service and food quality!');

SELECT * FROM Feedback;

CREATE TABLE History (
    HistoryID INT PRIMARY KEY,
    Status VARCHAR(20)
);

INSERT INTO History (HistoryID, Status)
VALUES (1, 'Completed');

SELECT * FROM History;

CREATE TABLE Admin (
    AdminID INT PRIMARY KEY,
    Password VARCHAR(255)
);

INSERT INTO Admin (AdminID, Password)
VALUES (1, 'adminpassword123');

SELECT * FROM Admin;

CREATE TABLE Notification (
    MessageDate DATE,
    DonorID INT,
    RecipientID INT,
    AdminID INT,
    SendDate DATE,
    Status VARCHAR(20),
    FOREIGN KEY (DonorID) REFERENCES Donor(DonorID),
    FOREIGN KEY (RecipientID) REFERENCES Recipient(RecipientID),
    FOREIGN KEY (AdminID) REFERENCES Admin(AdminID)
);

INSERT INTO Notification (MessageDate, DonorID, RecipientID, AdminID, SendDate, Status)
VALUES ('2025-03-10', 1, 1, 1, '2025-03-10', 'Unread');

SELECT * FROM Notification;

CREATE TABLE Inventory (
    InventoryID INT PRIMARY KEY,
    FoodItem VARCHAR(100),
    Quantity INT,
    StorageLocation VARCHAR(100)
);

INSERT INTO Inventory (InventoryID, FoodItem, Quantity, StorageLocation)
VALUES (1, 'Rice', 50, 'Warehouse 1');

SELECT * FROM Inventory;