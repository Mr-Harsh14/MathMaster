import { Schema, model, models, Document } from 'mongoose'
import { IUser } from './User'

export interface IClass extends Document {
  name: string
  code: string
  teacher: IUser['_id']
  students: IUser['_id'][]
  createdAt: Date
  updatedAt: Date
}

const ClassSchema = new Schema<IClass>({
  name: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
  },
  teacher: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  students: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})

// Virtual for getting quiz count
ClassSchema.virtual('quizzes', {
  ref: 'Quiz',
  localField: '_id',
  foreignField: 'class',
  count: true,
})

export default models.Class || model<IClass>('Class', ClassSchema) 