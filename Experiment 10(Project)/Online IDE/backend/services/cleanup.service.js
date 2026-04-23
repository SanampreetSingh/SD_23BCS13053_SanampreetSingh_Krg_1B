const cron = require('node-cron');
const Map = require('../models/map.model');
const Docker = require('dockerode');

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

const manageContainerLifecycle = async () => {
    const now = new Date();
    // 30 mins for hibernation, 10 days for total deletion
    const thirtyMinsAgo = new Date(now - 30 * 60 * 1000);
    const tenDaysAgo = new Date(now - 10 * 24 * 60 * 60 * 1000);

    try {
        // --- STAGE 1: HIBERNATE (Stop Container) ---
        // Find containers that are "active" but haven't been touched in 30 mins
        const toStop = await Map.find({
            status: 'active',
            lastActive: { $lt: thirtyMinsAgo }
        });

        for (const entry of toStop) {
            try {
                const container = docker.getContainer(entry.containerId);
                
                // 1. Stop the container to free up RAM/CPU
                await container.stop().catch(() => {});
                
                // 3. Update status in DB
                await Map.updateOne(
                    { _id: entry._id }, 
                    { $set: { status: 'inactive' } } // Changed from 'stopped' to match your schema
                );
                
                console.log(`[Lifecycle] 💤 Hibernated user ${entry.userId}`);
            } catch (err) {
                // If container doesn't exist anymore, mark it as inactive anyway
                if (err.statusCode === 404) {
                    await Map.updateOne({ _id: entry._id }, { $set: { status: 'inactive' } });
                }
                console.error(`Failed to hibernate ${entry.containerId}:`, err.message);
            }
        }

        // --- STAGE 2: PURGE (Full Deletion) ---
        const toDelete = await Map.find({
            lastActive: { $lt: tenDaysAgo }
        });

        for (const entry of toDelete) {
            try {
                const container = docker.getContainer(entry.containerId);
                
                // Force remove deletes the container AND its metadata (RW layer)
                // v: true also removes associated non-named volumes
                await container.remove({ force: true, v: true }).catch(() => {});

                await Map.findByIdAndDelete(entry._id);
                
                console.log(`[Lifecycle] 🔥 Purged user ${entry.userId}`);
            } catch (err) {
                console.error(`Failed to purge ${entry.userId}:`, err.message);
            }
        }
    } catch (err) {
        console.error("Critical Lifecycle Error:", err);
    }
};

// Run every 15 minutes
cron.schedule('*/15 * * * *', () => {
    manageContainerLifecycle();
});