import { Schema, model, models, Document } from 'mongoose'

export interface IUser extends Document {
  name: string | null
  email: string
  password: string
  role: 'STUDENT' | 'TEACHER' | 'ADMIN'
  classesJoined: Schema.Types.ObjectId[]
  classesTaught: Schema.Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>({
  name: String,
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['STUDENT', 'TEACHER', 'ADMIN'],
    default: 'STUDENT',
  },
  classesJoined: [{
    type: Schema.Types.ObjectId,
    ref: 'Class',
  }],
  classesTaught: [{
    type: Schema.Types.ObjectId,
    ref: 'Class',
  }],
}, {
  timestamps: true,
})

export default models.User || model<IUser>('User', UserSchema) 