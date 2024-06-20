# Store Manager

Store Manager is a Node.js application designed to manage inventory, users, and orders for a retail store.

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js installed on your local machine (v12.x or later)
- npm (Node Package Manager) or yarn
- MySQL server running

## Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/your-username/store-manager.git
   cd store-manager
   ```

2. Install dependencies:

   ```sh
   npm install
   ```
  or

  ```sh
  yarn install
  ```

3. Create a .env file in the root directory and add the following environment variables:
  ```PORT=3000
  NODE_ENV=development
  
  DB_HOST=localhost
  DB_USER=root
  DB_PASSWORD=
  DB_NAME=storemanager
  
  SUPER_ADMIN_USER_NAME=superadmin
  SUPER_ADMIN_PASS=superadmin
  SUPER_ADMIN_FULL_NAME=SuperAdmin
  
  JWT_SECRET=
  
  AWS_ACCESS_KEY_ID=
  AWS_SECRET_ACCESS_KEY=
  AWS_REGION=
  ```
4. Set up the database:
   Ensure your MySQL server is running and execute the following SQL script to create the required database and tables. (Include the script or mention the script file if it is part of your repository.)
   ```CREATE DATABASE storemanager;```

   
   
