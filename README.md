# 🚀 Management System Pro

A comprehensive full-stack management system for inventory, smart agriculture, waste management, and construction sites.

## 📋 Features

### 🏗️ Core Modules
- **IMS (Inventory Management System)**: Stock tracking, sales, purchase orders
- **ISA (Integrated Smart Agriculture)**: Crop monitoring, land management, yield optimization
- **Waste Management**: Sustainable waste tracking and revenue generation
- **Construction Sites**: Equipment and material management

### 🔐 Authentication & Security
- Role-based access control (Super Admin, Admin, Manager, User)
- Email verification system
- JWT token authentication
- Password encryption with bcrypt
- Rate limiting and security headers

### 🎨 Modern UI/UX
- Responsive design with styled-components
- Beautiful gradients and animations
- Mobile-first approach
- Real-time notifications
- Interactive dashboards

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Nodemailer** - Email service
- **bcryptjs** - Password hashing

### Frontend
- **React.js** - UI library
- **Styled Components** - CSS-in-JS
- **React Router** - Navigation
- **Framer Motion** - Animations
- **React Hook Form** - Form handling
- **Axios** - HTTP client
- **React Hot Toast** - Notifications

## 📁 Project Structure

\`\`\`
management-system/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   ├── styles/         # Global styles and theme
│   │   ├── utils/          # Utility functions
│   │   └── App.js
│   ├── package.json
│   └── .env
├── server/                 # Node.js backend
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── scripts/           # Database scripts
│   ├── utils/             # Utility functions
│   ├── uploads/           # File uploads
│   ├── server.js
│   ├── package.json
│   └── .env
├── package.json           # Root package.json
└── README.md
\`\`\`

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Gmail account (for email service)

### Installation

1. **Clone the repository**
\`\`\`bash
git clone <your-repo-url>
cd management-system
\`\`\`

2. **Install dependencies**
\`\`\`bash
npm run install-all
\`\`\`

3. **Set up environment variables**

Create `server/.env`:
\`\`\`env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/management-system
JWT_SECRET=your-super-secret-jwt-key-here
CLIENT_URL=http://localhost:3000
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password
\`\`\`

Create `client/.env`:
\`\`\`env
REACT_APP_API_URL=http://localhost:5000/api/expenses/api
REACT_APP_APP_NAME=Management System Pro
\`\`\`

4. **Set up Gmail App Password**
- Enable 2-Factor Authentication in your Google Account
- Go to Google Account → Security → App passwords
- Generate an app password for "Mail"
- Use this password in `GMAIL_APP_PASSWORD`

5. **Seed the database**
\`\`\`bash
npm run server
# In another terminal:
cd server && npm run seed
\`\`\`

6. **Start the development servers**
\`\`\`bash
npm run dev
\`\`\`

The application will be available at:
- Frontend: http://localhost:3000
- Backend: https://c-management-system.onrender.com

### Demo Accounts
- **Super Admin**: superadmin@demo.com / Demo123!
- **Admin**: admin@demo.com / Demo123!
- **Manager**: manager@demo.com / Demo123!
- **User**: user@demo.com / Demo123!

## 📱 Usage

1. **Registration**: Create account with module selection
2. **Email Verification**: Check email and verify account
3. **Login**: Use demo accounts or your verified account
4. **Dashboard**: Access role-based dashboard
5. **Modules**: Navigate between different management modules

## 🔧 Development

### Available Scripts

\`\`\`bash
# Install all dependencies
npm run install-all

# Start development servers
npm run dev

# Start only backend
npm run server

# Start only frontend
npm run client

# Seed database with demo data
cd server && npm run seed

# Build for production
npm run build

# Start production server
npm start
\`\`\`

### Adding New Features

1. **Backend**: Add routes in `server/routes/`
2. **Frontend**: Add components in `client/src/components/`
3. **Database**: Add models in `server/models/`
4. **Styling**: Update theme in `client/src/styles/theme.js`

## 🚀 Deployment

### Production Build
\`\`\`bash
npm run build
npm start
\`\`\`

### Environment Variables for Production
Update your production environment with:
- `NODE_ENV=production`
- `MONGODB_URI=<your-production-db-url>`
- `CLIENT_URL=<your-production-domain>`
- Gmail credentials for email service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@managementsystempro.com or create an issue in the repository.
