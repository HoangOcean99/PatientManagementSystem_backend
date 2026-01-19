## 🏥 Patient Management System – Backend
The backend of the Patient Management System, built with Node.js and Express.
It uses Supabase as the primary platform for database management and authentication, providing secure and scalable RESTful APIs for the frontend.

## 🚀 Technologies Used
```bash
- Node.js
- Express.js
- Supabase (PostgreSQL & Authentication)
- dotenv
- cors
- express-validator
- jsonwebtoken
- nodemon
```

## 📁 Project Structure
```bash
src/
├─ config/
│  └─ supabase.js     # Supabase client configuration
├─ routes/            # API routes
├─ controllers/       # Business logic
├─ middlewares/       # Authentication & validation
├─ app.js             # Express app configuration
└─ server.js          # Server entry point
```

## ⚙️ Installation & Running the Backend
### Install dependencies
```bash
npm install
```
### Create .env file
```bash
cp .env.example .env
```

### Run the server
```bash
npm run dev
```
👉 API will be available at: http://localhost:5000

## 🔐 Security & Authentication
```bash
- User authentication handled by Supabase Auth
- Backend uses Supabase Service Role Key for secure operations
- Row Level Security (RLS) is applied at the database level
```

## 📡 API Design
```bash
- RESTful API architecture
- JSON-based request and response
- Input validation using express-validator
```

## 👨‍💻 Development Team
```bash
Course project: SWP391
University: FPT University
```