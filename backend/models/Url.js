import mongoose from 'mongoose';

const urlSchema = new mongoose.Schema(
  {
    originalUrl: {
      type: String,
      required: [true, 'Original URL is required'],
      trim: true,
    },
    shortCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customAlias: {
      type: String,
      unique: true,
      sparse: true, // Allows null or empty values to bypass duplicate checks
      trim: true,
    },
    qrCodeDataUrl: {
      type: String,
    },
    title: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User association is required'],
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    clicksCount: {
      type: Number,
      default: 0,
    },
    qrClicksCount: {
      type: Number,
      default: 0,
    },
    qrBrandLogo: {
      type: String,
      default: '',
    },
    qrColor: {
      type: String,
      default: '#6366f1',
    },
    password: {
      type: String,
      default: '',
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    clickLimit: {
      type: Number,
      default: null,
    },
    fallbackUrl: {
      type: String,
      default: '',
    },
    utmSource: {
      type: String,
      default: '',
    },
    utmMedium: {
      type: String,
      default: '',
    },
    utmCampaign: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

import { mockUrl, createModelProxy } from '../utils/mockDb.js';

const MongooseUrl = mongoose.model('Url', urlSchema);
const Url = createModelProxy('Url', MongooseUrl, mockUrl);
export default Url;
