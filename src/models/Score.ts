import { Schema, model, models, Document } from 'mongoose'
import { IUser } from './User'
import { IQuiz } from './Quiz'

export interface IScore extends Document {
  user: IUser['_id']
  quiz: IQuiz['_id']
  score: number
  maxScore: number
  createdAt: Date
  updatedAt: Date
}

const ScoreSchema = new Schema<IScore>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  quiz: {
    type: Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  maxScore: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true,
})

// Create a compound index for user and quiz to ensure uniqueness
ScoreSchema.index({ user: 1, quiz: 1 }, { unique: true })

export default models.Score || model<IScore>('Score', ScoreSchema) 