# FinanceFlow 💸

FinanceFlow is a full-stack personal finance application designed for securely tracking financial records and providing dashboard analytics. It employs a monolithic architecture, unifying a robust Spring Boot backend with a modern React frontend interface.

## 🚀 Features

- **Robust Authentication:** Secure authentication and authorization using JSON Web Tokens (JWT).
- **Role-Based Access Control (RBAC):** Distinct roles (User, Admin) to manage access to endpoints and features.
- **Financial Record Management:** Full CRUD operations for tracking expenses, income, and managing transactions.
- **Dashboard Analytics:** Comprehensive data summaries for financial insights.
- **Modern UI:** Glassmorphism-inspired interface powered by Tailwind CSS 4 and Motion for smooth micro-animations.

## 💻 Technology Stack

### Frontend
- React 19
- Vite
- Tailwind CSS 4
- Motion (Animations)
- Lucide React (Icons)
- Zod (Validation)

### Backend
- Java 17
- Spring Boot
- Spring Security (JWT)
- Spring Data JPA
- SQLite Database

## 🛠️ How to Run Locally

You can run the frontend and backend separately during development, or build the frontend into the Spring Boot application.

### 1. Running the Backend (Spring Boot)
Ensure you have Java 17 installed.

```bash
cd spring-backend
./gradlew bootRun
```
The backend will start on `localhost:8080` (or as configured in `application.properties`).

### 2. Running the Frontend (React + Vite)
Ensure you have Node.js installed. In a separate terminal run:

```bash
# Return to the root directory
cd .. 

# Install dependencies
npm install

# Start the development server
npm run dev
```
The frontend will start typically on `localhost:5173`. Make sure the frontend `.env` points to your backend API.

## 📦 Deployment

This project is configured to be packaged as a single deployable artifact. The React app can be built and copied into the Spring Boot `src/main/resources/static` directory to be served by the embedded Tomcat server on a single port.

