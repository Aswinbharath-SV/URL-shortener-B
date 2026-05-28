import mongoose from 'mongoose';

const clickSchema = new mongoose.Schema(
  {
    urlId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Url',
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    ip: {
      type: String,
      trim: true,
    },
    browser: {
      type: String,
      default: 'Unknown',
      trim: true,
    },
    device: {
      type: String,
      default: 'Desktop', // Desktop, Mobile, Tablet
      trim: true,
    },
    os: {
      type: String,
      default: 'Unknown',
      trim: true,
    },
    country: {
      type: String,
      default: 'Unknown',
      trim: true,
    },
    region: {
      type: String,
      default: 'Unknown',
      trim: true,
    },
    city: {
      type: String,
      default: 'Unknown',
      trim: true,
    },
    timezone: {
      type: String,
      default: 'Unknown',
      trim: true,
    },
    isp: {
      type: String,
      default: 'Unknown',
      trim: true,
    },
    referer: {
      type: String,
      default: 'Direct',
      trim: true,
    },
    utmSource: {
      type: String,
      default: 'Direct',
      trim: true,
    },
    utmMedium: {
      type: String,
      default: 'None',
      trim: true,
    },
    utmCampaign: {
      type: String,
      default: 'None',
      trim: true,
    },
    isSuspicious: {
      type: Boolean,
      default: false,
    },
    threatType: {
      type: String,
      default: 'none',
      enum: ['none', 'bot', 'ip_spam'],
    },
    isQrScan: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: false, // timestamps not needed as we have `timestamp`
  }
);

import { mockClick, createModelProxy } from '../utils/mockDb.js';

const MongooseClick = mongoose.model('Click', clickSchema);
const Click = createModelProxy('Click', MongooseClick, mockClick);
export default Click;
