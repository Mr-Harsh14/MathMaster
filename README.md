# MathMaster Learning Platform

A modern web application for learning mathematics through interactive quizzes and competitive learning.

## Features

- User authentication (Students and Teachers) .
- Class management with join codes
- Interactive quiz creation and participation
- Real-time leaderboards
- Modern, responsive UI

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- MongoDB with Mongoose
- NextAuth.js for authentication

## Project Structure

- `/src/app` - Next.js app router pages
- `/src/components` - Reusable React components
- `/src/lib` - Utility functions and shared logic
- `/src/models` - MongoDB schema definitions

## Deployment to Vercel

1. Create a MongoDB Atlas account and database:
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a new cluster (free tier is fine)
   - Create a database user
   - Get your MongoDB connection string
   - Add your IP address to the IP whitelist (or allow access from anywhere for development)

2. Set up your project on Vercel:
   - Fork this repository to your GitHub account
   - Go to [Vercel](https://vercel.com)
   - Create a new project
   - Import your forked repository
   - Add the following environment variables in Vercel:
     ```
     MONGODB_URI=your-mongodb-atlas-uri
     NEXTAUTH_SECRET=your-secret-key
     NEXTAUTH_URL=https://your-vercel-domain.vercel.app
     ```
   - Deploy!

3. Update your MongoDB connection string:
   - Replace `your-mongodb-atlas-uri` with your actual MongoDB Atlas connection string
   - Make sure to replace `<password>` in the connection string with your actual database user password

4. Generate a secure NEXTAUTH_SECRET:
   - You can generate one by running `openssl rand -base64 32` in your terminal
   - Or use any other secure random string generator

5. Update NEXTAUTH_URL:
   - After your first deployment, update this to your actual Vercel domain
   - Format: `https://your-app-name.vercel.app`

## Local Development

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
   - Update the variables with your values

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License. 
