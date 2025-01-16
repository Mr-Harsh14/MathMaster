# Math Master

A comprehensive learning platform for mathematics education, featuring role-based access control and interactive learning tools.

## Features

### For Students
- Join classes with class codes
- Take quizzes and assessments
- Track progress and view scores
- View class materials and resources
- Compete on the leaderboard

### For Teachers
- Create and manage classes
- Create and assign quizzes
- Monitor student progress
- View analytics and performance metrics
- Manage student roster

### For Administrators
- User Management
  - View all users in the system
  - Create teacher accounts
  - Delete user accounts (except admins)
  - Reset user passwords
- Search functionality to find users
- Role-based access control

## Getting Started

1. Clone the repository
```bash
git clone https://github.com/your-username/math-master.git
cd math-master
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env.local` file with the following variables:
```
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

4. Run the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **Authentication**: NextAuth.js
- **UI Components**: Headless UI, Heroicons
- **Styling**: Tailwind CSS

## Authentication and Authorization

The application implements role-based access control with three user types:
- **Student**: Default role for new registrations
- **Teacher**: Created by administrators
- **Admin**: System administrators with full access

## Development

### Prerequisites
- Node.js 18+
- MongoDB database
- npm or yarn

### Environment Setup
1. Copy `.env.example` to `.env.local`
2. Update the environment variables with your values

### Creating an Admin User
1. Register a new user through the application
2. Using MongoDB Compass or Shell:
   - Connect to your database
   - Find the user document
   - Update the role field to "ADMIN"

## License

[MIT License](LICENSE) 
