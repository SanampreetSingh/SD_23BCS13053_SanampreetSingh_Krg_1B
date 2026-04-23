const mongoose = require('mongoose');
// { _id, userId, containerId, port, status, lastActive, volumePath }
const MapSchema = new mongoose.Schema({
    userId: {
       type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true, // One user = One active IDE instance
        index: true,
    },
    containerId: {
        type: String,
        required: true,
        unique: true, 
    },
    status: {
        type: String,
       enum: ['active', 'stopped'],
        default: 'active',
    },
    lastActive: {
       type: Date,
        default: Date.now,
        index: true, // Allows the cleanup script to find old containers fast
    },
    volumePath: {
        type: String,
        required: true,
    },
});

// Add a helper method to update activity
MapSchema.methods.touch = function() {
    this.lastActive = Date.now();
    return this.save();
};

module.exports = mongoose.model('Map', MapSchema);