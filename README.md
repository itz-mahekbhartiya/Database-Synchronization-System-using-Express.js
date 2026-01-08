# Database Synchronization System (Express.js)

This project implements a fault-tolerant Data Synchronization Service using Node.js, Express, and MySQL. It ensures that data written to a local "Offline" database (db_a) is eventually synchronized with a central "Online" database (db_b) using a background Cron job.

## Installation

### Clone the repository
```bash
git clone https://github.com/itz-mahekbhartiya/Database-Synchronization-System-using-Express.js.git
```

### Install Dependencies
```bash
npm install
```

### Environment Configuration
Create a `.env` file in the root directory:
```
PORT=3000

# Database Credentials
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password

# Database Names
DB_OFFLINE_DB=db_a
DB_CENTRAL_DB=db_b

# Sync Configuration
IS_ONLINE=true
```

## Database Setup

Create two databases: db_a (Local) and db_b (Central).

### Setup Database A (Local)
```sql
CREATE DATABASE IF NOT EXISTS db_a;
USE db_a;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE sync_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id INT NOT NULL,
    operation ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    sync_status ENUM('PENDING', 'SYNCED', 'FAILED') DEFAULT 'PENDING',
    retry_count INT DEFAULT 0
);
```

### Setup Database B (Central)
```sql
CREATE DATABASE IF NOT EXISTS db_b;
USE db_b;

CREATE TABLE users (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id INT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);
```

## Usage

Start the server:
```bash
node server.js
```

## API Endpoints

### Create User
```http
POST /users
Content-Type: application/json

{
    "name": "Jane Doe",
    "email": "jane@example.com"
}
```

### Update User
```http
PUT /users/jane@example.com
Content-Type: application/json

{
    "name": "Jane Smith"
}
```

### Create Order
```http
POST /orders
Content-Type: application/json

{
    "user_id": 1,
    "amount": 250.00,
    "status": "pending"
}
```

### Check Sync Status
```http
GET /sync/status
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## Author

Mahek Bhartiya