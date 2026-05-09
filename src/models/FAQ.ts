import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IFAQ extends Document {
  question: string;
  answer: string;
  order: number;
  domain: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FAQSchema: Schema<IFAQ> = new Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    order: { type: Number, default: 0 },
    domain: { 
      type: String, 
      required: [true, 'Domain is required'], 
      index: true,
      trim: true,
      lowercase: true,
      default: 'mibd.shop'
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Optimize queries that filter by domain and active status
FAQSchema.index({ domain: 1, isActive: 1 });

const FAQ: Model<IFAQ> = mongoose.models.FAQ || mongoose.model<IFAQ>('FAQ', FAQSchema);

export default FAQ;
