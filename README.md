# MathMaster Learning Platform

A modern web application for learning mathematics through interactive quizzes and competitive learning.

## Features

- User authentication (Students and Teachers)
- Class management with join codes
- Interactive quiz creation and participation
- Real-time leaderboards
- Modern, responsive UI

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- NextAuth.js for authentication

## Prerequisites

- Node.js 18+ 
- PostgreSQL
- npm or yarn

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/math-app.git
   cd math-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables:
   - Copy `.env.example` to `.env`
   - Update the database connection string and other variables

4. Set up the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `/src/app` - Next.js app router pages
- `/src/components` - Reusable React components
- `/src/lib` - Utility functions and shared logic
- `/prisma` - Database schema and migrations

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License. 
