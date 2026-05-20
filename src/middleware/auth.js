const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const ApiError = require('../utils/ApiError');
const config = require('../config');

exports.protect = async (req, res, next) => {
  try {
    // 1. Extract token
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) throw new ApiError(401, 'Not authenticated');

    // 2. Verify JWT signature + expiry
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch {
      throw new ApiError(401, 'Invalid or expired token');
    }

    // 3. Check token still exists in sessions (revocation check)
    const session = await Session.findOne({ token });
    if (!session) {
      throw new ApiError(401, 'Session has been revoked. Please log in again.');
    }

    // 4. Update lastActive timestamp
    session.lastActive = new Date();
    await session.save();

    // 5. Attach user — JWT is signed with { id: userId }
    const user = await User.findById(decoded.id);
    if (!user) throw new ApiError(401, 'User no longer exists');

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    next(err);
  }
};

const Prd = require('../models/Prd');
const UserStory = require('../models/UserStory');
const QualityIssue = require('../models/QualityIssue');

exports.checkPrdAccess = async (req, res, next) => {
  try {
    let prdId = req.params.prdId || req.body.prdId || req.query.prdId;

    // 1. Direct PRD endpoint check
    if (!prdId && req.baseUrl.endsWith('/prd') && req.params.id) {
      prdId = req.params.id;
    }

    // 2. Story endpoint check
    if (!prdId && req.baseUrl.endsWith('/stories') && req.params.id) {
      const story = await UserStory.findById(req.params.id);
      if (!story) throw new ApiError(404, 'User story not found');
      prdId = story.prdId;
    }

    // 3. Quality issue endpoint check
    if (!prdId && req.baseUrl.endsWith('/analysis') && req.params.id) {
      const issue = await QualityIssue.findById(req.params.id);
      if (!issue) throw new ApiError(404, 'Quality issue not found');
      prdId = issue.prdId;
    }

    if (prdId) {
      const prd = await Prd.findById(prdId);
      if (!prd) throw new ApiError(404, 'PRD not found');
      
      if (prd.createdBy && prd.createdBy !== req.user._id.toString()) {
        throw new ApiError(403, 'You do not have access to this PRD');
      }
    }

    next();
  } catch (err) {
    next(err);
  }
};

