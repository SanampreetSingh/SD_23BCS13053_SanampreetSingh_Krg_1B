const OAuth2Client = require('google-auth-library').OAuth2Client;
const jwt = require('jsonwebtoken');
const User = require('../models/user.model.js');
const Map = require('../models/map.model.js');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleAuth = async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ error: "Token is required" });
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name, picture, sub: googleId } = payload;

        let user = await User.findOne({ googleId });

        if (!user) {
            user = await User.create({ name, email, googleId, picture });
        } else if (user.email !== email) {
            user.email = email;
            await user.save();
        }

        const backendToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // --- SET WILDCARD COOKIE FOR PREVIEWS ---
        const isLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
        
        res.cookie('token', backendToken, {
            httpOnly: true,
            secure: !isLocal, // True in production (HTTPS), false on localhost
            sameSite: 'Lax',
            path: '/',
            // If you use ide.test trick, use '.ide.test'. 
            // For standard localhost, 'localhost' works for subdomains in most browsers.
            // domain: isLocal ? '.localhost' : '.your-ide.com', 
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({
            token: backendToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                picture: user.picture,
            }
        });

    } catch (error) {
        console.error("Google Auth Error:", error);
        res.status(401).json({ error: "Invalid Google Token" });
    }
};

/**
 * Gatekeeper for Nginx auth_request.
 * Validates if the user in the JWT matches the user_id in the subdomain.
 */
const verifyPreview = async (req, res) => {
    try {
        console.log("Verifying preview access...");

        const token = req.cookies.token;
        console.log("Token from cookie:", token);
        const targetUserId = req.headers['x-target-user'];

        if (!token || !targetUserId) {
            return res.sendStatus(401);
        }

        // 1. Validate JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded JWT:", decoded); 
        // 2. Check Ownership
        if (decoded.userId !== targetUserId) {
            console.warn(`User ${decoded.userId} attempted to access preview for user ${targetUserId}`);
            return res.sendStatus(403); // Forbidden: Trying to access someone else's preview
        }
     // 3. Check Container Status in Database
        const mapping = await Map.findOne({ userId: targetUserId });

        if (!mapping || mapping.status !== 'active') {
            
            return res.sendStatus(404); 
        }
        
        // 4. UPDATE ACTIVITY TIMESTAMP
        // This resets the 30-minute timer in your cleanup service
        await Map.updateOne(
            { userId: targetUserId },
            { $set: { lastActive: new Date() } }
        );

        // Access Granted
        return res.sendStatus(200); 

    } catch (err) {
        console.error("Preview Verification Error:", err.message);
        res.sendStatus(401); 
    }
};

module.exports = {
    googleAuth,
    verifyPreview
};