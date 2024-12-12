import { User as PrismaUser, UserRole } from '@prisma/client'
import 'next-auth'

declare module 'next-auth' {
  interface User extends PrismaUser {}

  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: UserRole
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    email: string
    name?: string | null
    role: UserRole
  }
} 