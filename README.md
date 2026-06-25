# DigiBank - Enterprise Digital Banking & Loan Management System

![Project Banner](https://via.placeholder.com/1200x300?text=DigiBank+Enterprise+Portal)

## 📖 Project Overview

DigiBank is a comprehensive, full-stack digital banking and loan management platform designed to provide seamless financial services to customers while offering robust administrative controls. The system supports core banking operations, secure KYC verification using OCR, dynamic loan processing, real-time dashboard analytics, and intelligent fraud detection.

## ✨ Key Features

- **Secure Authentication & Authorization**: JWT-based security with distinct user roles (Admin & Customer).
- **Core Banking Operations**: Account creation, management, and secure intra-bank fund transfers.
- **Advanced KYC Processing**: Automated document parsing using Optical Character Recognition (Tess4j).
- **Loan Management System**: End-to-end loan application processing, approval workflows, and automated EMI scheduling.
- **Fraud Detection**: Real-time transaction monitoring and anomaly logging.
- **Interactive Dashboards**: Role-specific dashboards featuring data visualization using Chart.js.
- **Financial Reporting**: Export transaction statements and reports in PDF (jsPDF) and Excel (xlsx) formats.
- **Payment Gateway Integration**: Integrated with Razorpay for payment processing.

## 🏗️ Architecture & Tech Stack

The project follows a standard Client-Server architecture with a monolithic backend and a Single Page Application (SPA) frontend.

### Frontend
- **Framework**: React 18 with Vite
- **Styling & UI**: Material UI (MUI), Emotion CSS
- **Routing**: React Router DOM v6
- **State Management**: React Context API
- **Data Fetching**: Axios
- **Visualization & Export**: Chart.js, react-chartjs-2, jsPDF, xlsx

### Backend
- **Core Framework**: Java 21, Spring Boot 3.2.3
- **Data Access**: Spring Data JPA, Hibernate
- **Database**: H2 (In-memory, default for dev), PostgreSQL (configured)
- **Caching**: Redis
- **Security**: Spring Security, JWT (jjwt)
- **OCR Processing**: Tess4J (Tesseract OCR)
- **API Documentation**: Swagger / OpenAPI (springdoc)

## 📂 Folder Structure

```text
Digital_Banking/
├── backend/                              # Spring Boot Application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/banking/digital/
│   │   │   │   ├── config/               # App Configurations
│   │   │   │   ├── controller/           # REST API Controllers
│   │   │   │   ├── dto/                  # Data Transfer Objects
│   │   │   │   ├── entity/               # JPA Entities
│   │   │   │   ├── exception/            # Global Exception Handlers
│   │   │   │   ├── repository/           # Spring Data Repositories
│   │   │   │   ├── security/             # JWT Filters & Services
│   │   │   │   └── service/              # Business Logic & Implementations
│   │   │   └── resources/
│   │   │       ├── application.yml       # Spring config (DB, JWT, Razorpay)
│   │   │       └── data.sql              # Seed data
│   │   └── test/                         # Unit & Integration tests
│   ├── maven/                            # Bundled Maven distribution
│   ├── mvnw / mvnw.cmd                   # Maven Wrapper scripts
│   └── pom.xml                           # Maven dependencies
├── frontend/                             # React SPA
│   ├── src/
│   │   ├── components/                   # Reusable UI Components
│   │   ├── context/                      # Global State (AuthContext)
│   │   ├── layouts/                      # Page Layout Wrappers
│   │   ├── pages/                        # Route Components
│   │   ├── services/                     # Axios API client
│   │   └── utils/                        # Helper functions (currency, etc.)
│   ├── ssl/                              # mkcert local dev certificates
│   ├── public/                           # Static assets
│   ├── index.html                        # App entry point
│   ├── package.json                      # NPM dependencies
│   └── vite.config.js                    # Vite / proxy configuration
├── docker-compose.yml                    # PostgreSQL + Redis containers
├── start-dev.bat                         # Windows launcher (CMD)
├── start-dev.ps1                         # Windows launcher (PowerShell)
└── .gitignore
```

## 🚀 Setup & Installation

### Prerequisites
- Node.js (v18+)
- Java JDK 21
- Maven (or use the bundled wrapper in `backend/maven/`)
- Tesseract OCR (installed locally for Tess4j to work)

### ⚡ Quick Start (Recommended)

Use the bundled launcher scripts from the project root to start **both servers** with a single command:

| Shell | Command |
|-------|---------|
| **PowerShell** | Right-click `start-dev.ps1` → *Run with PowerShell* |
| **CMD** | Double-click `start-dev.bat` |

This opens two separate console windows — one titled **DigiBank-Backend** and one **DigiBank-Frontend**.

---

### Manual Setup

#### Backend
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Build and run using the bundled Maven Wrapper:
   ```bash
   # Build the project
   .\maven\apache-maven-3.9.6\bin\mvn.cmd clean install

   # Run the application
   .\mvnw.cmd spring-boot:run
   ```
   *The backend will start on `http://localhost:8080`.*

#### Frontend
1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *The frontend will be available at `https://localhost:3000`.*


## ⚙️ Configuration Details

- **Database Config**: The backend uses an in-memory H2 database by default for development purposes. You can access the H2 console at `http://localhost:8080/h2-console` (Username: `sa`, Password: `password`). To switch to PostgreSQL, modify the `datasource.url` in `backend/src/main/resources/application.yml`.
- **JWT Secret**: Configured in `application.yml` under `jwt.secret`. Ensure this is changed in a production environment.
- **Razorpay**: API Keys are located in `application.yml` under `razorpay.key-id` and `razorpay.key-secret`.

## 📡 API Endpoints (Core)

The backend provides a comprehensive REST API mapped under `/api/v1/`:

- **Auth**: `/api/v1/auth` (Login, Registration)
- **Accounts**: `/api/v1/accounts` (Create, Retrieve, Statement)
- **Transactions**: `/api/v1/transactions` (Transfers, Deposit, Withdraw)
- **Loans**: `/api/v1/loans` (Apply, Approve, EMI Schedule)
- **KYC**: `/api/v1/kyc` (Upload Documents, OCR Verification)
- **Dashboards**: `/api/v1/dashboard` (Admin & Customer Analytics)
- **Reports**: `/api/v1/reports` (Financial Data Export)
- **Fraud**: `/api/v1/fraud` (Anomaly Logs)

*Detailed API documentation is accessible via Swagger UI at `http://localhost:8080/swagger-ui.html` when the server is running.*

## 👥 User Roles & Workflows

1. **Customer**:
   - Registers and logs into the platform.
   - Uploads KYC documents for automated approval.
   - Creates checking/savings accounts and performs transfers.
   - Applies for loans and views auto-generated EMI schedules.
   - Views personal transaction history and account dashboard.
2. **Administrator**:
   - Monitors overall system health and transaction volumes.
   - Reviews flagged/fraudulent transactions.
   - Manually reviews complex KYC submissions or loan applications.
   - Generates system-wide financial reports.

## 🖼️ Screenshots

| Customer Dashboard | Loan Management |
| :---: | :---: |
| ![Customer Dashboard](https://via.placeholder.com/400x250?text=Customer+Dashboard) | ![Loan Dashboard](https://via.placeholder.com/400x250?text=Loan+Management) |

| KYC Upload & OCR | Admin Analytics |
| :---: | :---: |
| ![KYC Upload](https://via.placeholder.com/400x250?text=KYC+OCR+Upload) | ![Admin Analytics](https://via.placeholder.com/400x250?text=Admin+Analytics) |

## 🚢 Deployment Instructions

1. **Backend**: Package the Spring Boot application into a `.jar` file using `mvn package`. Deploy the jar to a server (e.g., AWS EC2, Heroku) or containerize it using Docker (a `docker-compose.yml` is included in the project root for reference).
2. **Frontend**: Build the production bundle using `npm run build`. Serve the generated `dist` folder using a web server like Nginx or deploy to services like Vercel, Netlify, or AWS S3.
3. **Environment Variables**: Ensure all secrets (JWT, Database URLs, Razorpay keys) are injected securely via environment variables on the production server.

## 🔮 Future Enhancements

- Migration to Microservices Architecture for better scalability.
- Implementation of Kafka for asynchronous event-driven fraud detection.
- Multi-factor Authentication (MFA) via SMS/Email OTP.
- Integration with external Credit Bureau APIs for real-time credit scoring.
- Dockerizing the entire stack for simple one-click deployment.
