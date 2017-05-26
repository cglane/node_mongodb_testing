import R from 'ramda';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';

const ArchiveSchema = new mongoose.Schema({
  deletedOn: {
    type: Date,
    default: Date.now
  },
  originalId: { type: mongoose.SchemaTypes.ObjectId },
  archivedObj: {
    type: Object
  }
});

const buildArchiveObj = (oldObj) => {
  const archive = {
    originalId: oldObj._id,
    archivedObj: oldObj.toJSON()
  };
  return archive;
};

ArchiveSchema.statics = {
  bulkInsertArchive(messages) {
    const archiveObjects = R.map(buildArchiveObj)(messages);
    return this.insertMany(archiveObjects);
  }
};

export default mongoose.model('Message_Archive', ArchiveSchema);
