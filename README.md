**# Meal Planner App**



A local full-stack meal-planning application built with React, Express, MySQL and MongoDB.



The application allows users to manage recipes, ingredients, weekly meal plans, shopping lists and other food-related information through a web interface.



It uses a hybrid database architecture combining a relational SQL database and a NoSQL database. The browser communicates with the Express API, while both databases run locally.



\---



\## 1. Technologies



The application is built using the following technologies:



React 18 and Vite: frontend development and user interface.



Node.js and Express: backend server and REST API.



MySQL 8: relational database for users, recipes, ingredients, meal plans and shopping lists.



MongoDB 6: NoSQL database for reviews, shopping carts, notifications and activity logs.



bcrypt: secure password hashing.



JSON Web Tokens (JWT): user authentication and protected API access.



\---



\## 2. Requirements



Before running the application, make sure you have installed:



\- Node.js 20 or newer

\- MySQL Server 8

\- MySQL Workbench

\- Docker Desktop

\- MongoDB 6 (running locally through Docker)

\- Google Chrome or another modern web browser

\- Visual Studio Code (recommended)



> This project is designed to use locally hosted databases. It does not require a cloud database, external API or microservice.



\---



\## 3. Installation and Setup



\### Step 1 – Download the project



Clone or download this GitHub repository.



Open the project folder in Visual Studio Code.



\### Step 2 – Start MySQL



1\. Open MySQL Workbench.

2\. Connect to `Local instance MySQL80`.

3\. For the first installation, open `database/mysql\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_schema.sql`.

4\. Execute the complete SQL script.



This creates the `meal\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_planner` database and its relational tables.



The SQL database contains seven tables:



\- `users`

\- `recipes`

\- `ingredients`

\- `recipe\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_ingredients`

\- `meal\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_plans`

\- `shopping\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_list`

\- `meal\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_plan\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_confirmations`



These tables use primary keys and foreign keys to maintain relationships between records.



\### Step 3 – Start MongoDB



1\. Open Docker Desktop.

2\. Start the existing `mongodb-hybrid` container.



If the container does not exist yet, create it once using PowerShell:



```powershell

docker run -d --name mongodb-hybrid -p 27017:27017 -v mongodb\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_meal\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_planner\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_data:/data/db mongo:6.0

```



To check that the container is running:



```powershell

docker ps

```



For the initial setup, initialize the MongoDB collections and indexes from the project root:



```powershell

Get-Content .\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\database\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\mongodb\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_init.js | docker exec -i mongodb-hybrid mongosh meal\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_planner

```



The MongoDB database is named `meal\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_planner` and contains four collections:



\- `activity\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_logs`

\- `recipe\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_reviews`

\- `shopping\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_carts`

\- `notifications`



MongoDB connection:



`mongodb://127.0.0.1:27017/meal\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_planner`



\### Step 4 – Configure the backend



Open a first terminal in Visual Studio Code.



Navigate to the backend folder:



```powershell

cd backend

```



Install the dependencies:



```powershell

npm.cmd install

```



Create the local environment file:



```powershell

Copy-Item .env.example .env

```



Open `backend/.env` and configure:



\- Your local MySQL password

\- A private and sufficiently long `JWT\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_SECRET`

\- The MongoDB connection string



Keep this file private. Never upload `backend/.env` to GitHub.



\### Step 5 – Configure the frontend



Open a second terminal in Visual Studio Code.



Navigate to the frontend folder:



```powershell

cd frontend

```



Install the dependencies:



```powershell

npm.cmd install

```



\### Step 6 – Run the application



Before starting, make sure Docker Desktop and MySQL are running.



\*\*Terminal 1 – Backend\*\*



```powershell

cd backend

npm.cmd run dev

```



The backend API runs at:



`http://localhost:5000`



Health check:



`http://localhost:5000/api/health`



\*\*Terminal 2 – Frontend\*\*



```powershell

cd frontend

npm.cmd run dev

```



Vite normally makes the frontend available at:



`http://localhost:5173/`



\### Step 7 – Open the application



Open Google Chrome and visit:



`http://localhost:5173/`



Keep both terminals open while using the application. MySQL and MongoDB must also remain running.



\*\*Important:\*\* The dependency installation, environment configuration and database initialization steps are required for the first setup. For subsequent launches, start Docker Desktop and MySQL, then run the backend and frontend commands again.



\---



\## 4. Application Features



\### Authentication



\- User registration

\- User login

\- Password hashing using bcrypt

\- JWT-protected API routes



\### MySQL – Relational Database



The application provides CRUD operations for:



\- Recipes

\- Ingredients

\- Recipe and ingredient associations

\- Meal plans

\- Shopping-list items



CRUD operations include Create, Read, Update and Delete.



\### MongoDB – NoSQL Database



The application provides CRUD operations for:



\- Recipe reviews

\- Shopping carts

\- Notifications

\- Activity logs



Transaction-related events are also recorded automatically in the activity logs.



\---



\## 5. Hybrid Database Transaction and Synchronization



The application demonstrates a multi-operation SQL transaction combined with MongoDB synchronization.



The endpoint:



`POST /api/meal-plans/:id/confirm`



performs the following operations:



1\. Locks and checks the selected meal plan.

2\. Updates the meal plan status to `confirmed`.

3\. Inserts a confirmation record into the SQL database.

4\. Commits the MySQL transaction.

5\. Creates an activity log and a notification in MongoDB after a successful commit.



\### Successful transaction



When the SQL transaction succeeds:



\- The meal plan status becomes `confirmed`.

\- A confirmation record is inserted into MySQL.

\- An activity log is created in MongoDB.

\- A notification is created in MongoDB.



\### Rollback demonstration



The application also includes a controlled failure scenario to demonstrate transaction rollback.



Use a meal plan that is still `planned` and send:



```http

POST /api/meal-plans/ID/confirm?forceRollback=true

```



Replace `ID` with the meal plan ID.



The forced error occurs before the SQL commit.



As a result:



\- The SQL transaction is rolled back.

\- The meal plan status remains `planned`.

\- No confirmation is committed.

\- A rollback event is recorded in MongoDB.



If MongoDB synchronization fails after the SQL commit, the application records a `MONGO\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_SYNC\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_FAILED` event instead of incorrectly describing the committed SQL transaction as rolled back.



\---



\## 6. API Overview



Protected endpoints require:



`Authorization: Bearer <token>`



\### Authentication



\- `POST /api/auth/register`

\- `POST /api/auth/login`



\### SQL endpoints



\- `/api/recipes`

\- `/api/ingredients`

\- `/api/recipe-ingredients`

\- `/api/meal-plans`

\- `/api/shopping-list`



\### MongoDB endpoints



\- `/api/reviews`

\- `/api/carts`

\- `/api/notifications`

\- `/api/activity-logs`



\### Transaction



\- `POST /api/meal-plans/:id/confirm`



\### Health check



\- `GET /api/health`



For collection routes, list and create operations use `GET` and `POST`. Individual records use `GET`, `PUT` and `DELETE`, as implemented in the API.



\---



\## 7. Project Structure



```text

meal-planner-app/

│

├── backend/

│   ├── db.js

│   ├── middleware.js

│   ├── server.js

│   ├── package.json

│   ├── package-lock.json



│   ├── README.md

│   └── .env.example

│

├── frontend/

│   ├── index.html

│   ├── package.json

│   ├── package-lock.json



│   ├── README.md

│   └── src/

│       ├── App.jsx

│       ├── main.jsx

│       └── style.css

│

├── database/

│   ├── mysql\\\\\\\\\\\\\\\_schema.sql

│   ├── mongodb\\\\\\\\\\\\\\\_init.js

│   └── mongodb\\\\\\\\\\\\\\\_schema.md

│

├── docs/

│   ├── architecture.md

│   ├── er-diagram.md

│   ├── nosql-schema.md

│   └── screenshots/

│       ├── README.md

│       └── \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\[application screenshots]

│



├── .gitignore

└── README.md

```



\---



\## 8. Documentation and Screenshots



The `docs/` directory contains the technical documentation for the project:



\- `architecture.md`: application architecture and communication between components.

\- `er-diagram.md`: SQL entity relationship diagram.

\- `nosql-schema.md`: MongoDB collection structure and document examples.

\- `screenshots/README.md`: screenshot evidence checklist.



The `docs/screenshots/` directory contains screenshots captured from the running application, demonstrating its main features, database operations and transaction behavior.



\---



\## 9. Project Presentation



\### Presentation Video



The video presents the application, its architecture, the main features, database operations and transaction demonstrations.



\*\***Video link:**\*\* https://drive.google.com/file/d/1ZC897_O1y7OWNXmsv2hwmuZ-alVvQgiN/view?usp=sharing



\### Canva Presentation



The Canva presentation contains the slides used to introduce the project and explain its technical implementation.



\*\***Canva link:**\*\* https://canva.link/mjyfz3jlp4kxju6





\---



\## 10. Security and Version Control



\- Passwords are hashed using bcrypt.

\- Protected API routes use JSON Web Tokens.

\- Database credentials and JWT secrets are stored in a local `.env` file.

\- Never upload `backend/.env` or any real credentials to GitHub.

\- `backend/.env.example` provides a template for local configuration.

\- Do not upload `node\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_modules`, build output or private personal information.



\---



\## 11. Author



\*\*Project:\*\* Meal Planner App

\*\*Type:\*\* Full-stack application – Hybrid SQL and NoSQL Database

\*\*Authors:\*\* 6910040619 - 6910040341 - 6910040457 - 6910040309 - 6910040678 - 6910040694

