import { Schema, model, models, Document, Types } from 'mongoose'
import { IClass } from './Class'

interface IQuestion {
  question: string
  options: string[]
  answer: string
  explanation?: string
}

export interface IQuiz extends Document {
  title: string
  description?: string
  class: IClass['_id']
  questions: Types.DocumentArray<IQuestion & Document>
  timeLimit?: number
  createdAt: Date
  updatedAt: Date
}

const QuestionSchema = new Schema<IQuestion>({
  question: {
    type: String,
    required: true,
  },
  options: [{
    type: String,
    required: true,
  }],
  answer: {
    type: String,
    required: true,
  },
  explanation: String,
})

const QuizSchema = new Schema<IQuiz>({
  title: {
    type: String,
    required: true,
  },
  description: String,
  class: {
    type: Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  questions: [QuestionSchema],
  timeLimit: Number,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})

// Virtual for getting scores
QuizSchema.virtual('scores', {
  ref: 'Score',
  localField: '_id',
  foreignField: 'quiz',
})

export default models.Quiz || model<IQuiz>('Quiz', QuizSchema) 