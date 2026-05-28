import mongoose from 'mongoose';

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Workspace name is required'],
      trim: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['owner', 'editor', 'viewer'],
          default: 'editor',
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

import { mockWorkspace, createModelProxy } from '../utils/mockDb.js';

const MongooseWorkspace = mongoose.model('Workspace', workspaceSchema);
const Workspace = createModelProxy('Workspace', MongooseWorkspace, mockWorkspace);
export default Workspace;
