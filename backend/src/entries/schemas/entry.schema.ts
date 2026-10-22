import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema.js';

@Schema({ timestamps: true })
export class Entry {
  @Prop({ required: true })
  date: string;

  @Prop({ required: true })
  wellbeing: number;

  @Prop({ required: true })
  sleep: number;

  @Prop({ required: true })
  energy: number;

  @Prop({ required: true })
  stress: number;

  @Prop({ type: [String], default: [] })
  symptoms: string[];

  @Prop()
  notes?: string;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
  })
  userId!: Types.ObjectId;
}

export const EntrySchema = SchemaFactory.createForClass(Entry);
