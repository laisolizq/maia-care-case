import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

import { User } from '../../users/schemas/user.schema.js';
import { Entry } from '../../entries/schemas/entry.schema.js';

@Schema({ timestamps: true })
export class Insight {
  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
  })
  userId!: Types.ObjectId;

  @Prop({
    type: [{ type: Types.ObjectId, ref: Entry.name }],
    required: true,
  })
  entryIds!: Types.ObjectId[];

  @Prop({ required: true })
  summary!: string;

  @Prop({ type: [String], default: [] })
  patterns!: string[];

  @Prop({ type: [String], default: [] })
  topicsToDiscuss!: string[];

  @Prop({ required: true })
  entriesKey!: string;
}

export const InsightSchema = SchemaFactory.createForClass(Insight);
InsightSchema.index({ userId: 1, entriesKey: 1 }, { unique: true });
