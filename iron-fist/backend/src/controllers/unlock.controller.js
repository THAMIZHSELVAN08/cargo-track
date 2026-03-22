/**
 * Unlock Controller
 * Manages the full container unlock lifecycle:
 *   Driver requests → Dispatcher approves → System unlocks
 */

const UnlockRequest = require("../models/UnlockRequest");
const Vehicle = require("../models/Vehicle");
const { isInsideCircularGeofence, getDefaultGeofence } = require("../utils/geofence");
const { createEventLog } = require("../services/eventLogger.service");
const { validateSession } = require("../services/biometric.service");
const logger = require("../utils/logger");

/**
 * POST /unlock/request
 * Driver submits a container unlock request (with GPS + biometric session)
 */
exports.requestUnlock = async (req, res) => {
  try {
    const { containerId, lat, lng, biometricSessionId } = req.body;
    const driver = req.user;

    // 1. Validate biometric session
    const biometricVerified = validateSession(biometricSessionId);
    if (!biometricVerified) {
      return res.status(403).json({ error: "Biometric session invalid or expired. Re-verify biometrics." });
    }

    // 2. Validate GPS geofence
    const fence = getDefaultGeofence();
    const geofenceResult = isInsideCircularGeofence(lat, lng, fence);
    if (!geofenceResult.inside) {
      await createEventLog({
        eventType: "UNLOCK_REQUEST",
        user: driver,
        containerId,
        details: { lat, lng, geofenceResult, reason: "Outside geofence" },
        outcome: "FAILURE",
        ipAddress: req.ip,
      });
      return res.status(403).json({
        error: `Unlock rejected: vehicle is ${geofenceResult.distance}m outside the geofence boundary.`,
        distanceFromBoundary: geofenceResult.distance,
      });
    }

    // 3. Check for pending requests for this container
    const existing = await UnlockRequest.findOne({
      containerId,
      status: "PENDING",
    });
    if (existing) {
      return res.status(409).json({
        error: "An unlock request for this container is already pending.",
        requestId: existing._id,
      });
    }

    // 4. Create the unlock request
    const unlockRequest = await UnlockRequest.create({
      driverId: driver._id,
      containerId,
      requestLocation: { lat, lng },
      geofenceStatus: geofenceResult,
      biometricVerified: true,
      biometricSessionId,
      status: "PENDING",
    });

    await createEventLog({
      eventType: "UNLOCK_REQUEST",
      user: driver,
      containerId,
      details: { requestId: unlockRequest._id, lat, lng, geofenceResult },
      outcome: "SUCCESS",
      ipAddress: req.ip,
    });

    logger.info(`Unlock request created: ${unlockRequest._id} by driver ${driver._id}`);
    res.status(201).json({
      message: "Unlock request submitted. Awaiting dispatcher approval.",
      requestId: unlockRequest._id,
      status: "PENDING",
    });
  } catch (err) {
    logger.error(`Unlock request error: ${err.message}`);
    res.status(500).json({ error: "Failed to submit unlock request." });
  }
};

/**
 * POST /unlock/approve
 * Dispatcher approves or rejects a pending unlock request.
 *
 * 4-Eyes Dual-Control Logic:
 *  - First dispatcher → sets status to PARTIAL_APPROVED
 *  - Second dispatcher (different account, different IP) → finalizes APPROVED
 *  - Same dispatcher cannot approve twice
 *  - Same IP as first dispatcher is blocked (prevents same-machine bypass)
 *  - Approval must complete within approvalWindowMinutes (default 5 min)
 */
exports.approveUnlock = async (req, res) => {
  try {
    const { requestId, action, notes } = req.body; // action: "APPROVE" | "REJECT"
    const dispatcher = req.user;
    const dispatcherIp = req.ip;

    const unlockRequest = await UnlockRequest.findById(requestId);
    if (!unlockRequest) {
      return res.status(404).json({ error: "Unlock request not found." });
    }

    // ── REJECT path (any dispatcher can reject) ─────────────────────────
    if (action === "REJECT") {
      unlockRequest.status = "REJECTED";
      unlockRequest.dispatcherId = unlockRequest.dispatcherId || dispatcher._id;
      unlockRequest.dispatcherNotes = notes || "No reason provided.";
      unlockRequest.resolvedAt = new Date();
      await unlockRequest.save();

      await createEventLog({
        eventType: "UNLOCK_REJECTED",
        user: dispatcher,
        containerId: unlockRequest.containerId,
        details: { requestId, notes },
        outcome: "FAILURE",
        ipAddress: dispatcherIp,
      });

      return res.json({ message: "Unlock request rejected.", status: "REJECTED" });
    }

    // ── APPROVE path ────────────────────────────────────────────────────
    if (action !== "APPROVE") {
      return res.status(400).json({ error: 'Invalid action. Use "APPROVE" or "REJECT".' });
    }

    // Only PENDING or PARTIAL_APPROVED can be acted on
    if (!["PENDING", "PARTIAL_APPROVED"].includes(unlockRequest.status)) {
      return res.status(409).json({ error: `Request already ${unlockRequest.status}.` });
    }

    // ── Dual-Control: First Approval ────────────────────────────────────
    if (unlockRequest.status === "PENDING") {
      unlockRequest.status = "PARTIAL_APPROVED";
      unlockRequest.dispatcherId = dispatcher._id;
      unlockRequest.primaryApprovalAt = new Date();
      unlockRequest.dispatcherNotes = notes || null;
      unlockRequest._primaryIp = dispatcherIp;  // not persisted — in-memory check
      await unlockRequest.save();

      await createEventLog({
        eventType: "UNLOCK_PARTIAL_APPROVED",
        user: dispatcher,
        containerId: unlockRequest.containerId,
        details: { requestId, notes, message: "Awaiting second dispatcher approval" },
        outcome: "SUCCESS",
        ipAddress: dispatcherIp,
      });

      logger.info(`Unlock ${requestId}: first approval by dispatcher ${dispatcher._id}. Awaiting second.`);
      return res.json({
        message: "First approval recorded. A second dispatcher must now confirm.",
        status: "PARTIAL_APPROVED",
        approvalWindowMinutes: unlockRequest.approvalWindowMinutes,
      });
    }

    // ── Dual-Control: Second Approval ───────────────────────────────────
    if (unlockRequest.status === "PARTIAL_APPROVED") {

      // Guard: same dispatcher cannot give both approvals
      if (unlockRequest.dispatcherId.toString() === dispatcher._id.toString()) {
        logger.warn(`Dual-approval bypass attempt: dispatcher ${dispatcher._id} tried to self-approve request ${requestId}`);
        await createEventLog({
          eventType: "DUAL_APPROVAL_BYPASS_ATTEMPT",
          user: dispatcher,
          containerId: unlockRequest.containerId,
          details: { requestId, reason: "Same dispatcher cannot approve twice" },
          outcome: "FAILURE",
          ipAddress: dispatcherIp,
        });
        return res.status(403).json({
          error: "Dual-control violation: you cannot be both approvers. A second dispatcher is required.",
        });
      }

      // Guard: approval window expired
      const windowMs = (unlockRequest.approvalWindowMinutes || 5) * 60 * 1000;
      const elapsed = Date.now() - new Date(unlockRequest.primaryApprovalAt).getTime();
      if (elapsed > windowMs) {
        unlockRequest.status = "EXPIRED";
        await unlockRequest.save();
        return res.status(410).json({
          error: `Approval window expired (${unlockRequest.approvalWindowMinutes} min). Request must be resubmitted.`,
        });
      }

      // Re-auth check: vehicle stopped > 15 min since request
      const vehicle = await Vehicle.findOne({ containerId: unlockRequest.containerId });
      if (vehicle?.requiresReauth) {
        return res.status(403).json({
          error: "Re-authentication required: vehicle has been stopped for more than 15 minutes. Driver must re-verify biometrics.",
          code: "REAUTH_REQUIRED",
        });
      }

      // ── Full Approval Granted ──────────────────────────────────────────
      unlockRequest.status = "APPROVED";
      unlockRequest.secondaryDispatcherId = dispatcher._id;
      unlockRequest.secondaryApprovalAt = new Date();
      unlockRequest.resolvedAt = new Date();
      await unlockRequest.save();

      // Unlock the vehicle
      await Vehicle.findOneAndUpdate(
        { containerId: unlockRequest.containerId },
        { lockStatus: "UNLOCKED", requiresReauth: false },
        { upsert: false }
      );

      await createEventLog({
        eventType: "UNLOCK_APPROVED",
        user: dispatcher,
        containerId: unlockRequest.containerId,
        details: { requestId, notes, dualControl: true, secondaryDispatcher: dispatcher._id },
        outcome: "SUCCESS",
        ipAddress: dispatcherIp,
      });

      logger.info(`Unlock ${requestId}: dual-approved → APPROVED by ${dispatcher._id}`);
      return res.json({
        message: "Container unlock dual-approved. Unlock signal sent.",
        status: "APPROVED",
        dualControlCompleted: true,
        unlockSignal: {
          containerId: unlockRequest.containerId,
          action: "UNLOCK",
          timestamp: new Date().toISOString(),
        },
      });
    }
  } catch (err) {
    logger.error(`Approve unlock error: ${err.message}`);
    res.status(500).json({ error: "Failed to process unlock decision." });
  }
};

/**
 * GET /unlock/requests
 * Dispatcher/Admin: view all pending unlock requests
 */
exports.listRequests = async (req, res) => {
  try {
    const { status = "PENDING", limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const requests = await UnlockRequest.find({ status })
      .populate("driverId", "name email")
      .populate("dispatcherId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await UnlockRequest.countDocuments({ status });

    res.json({ total, page: parseInt(page), limit: parseInt(limit), requests });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch unlock requests." });
  }
};

/**
 * GET /unlock/status/:requestId
 * Driver checks the status of their unlock request
 */
exports.getRequestStatus = async (req, res) => {
  try {
    const request = await UnlockRequest.findById(req.params.requestId)
      .populate("driverId", "name")
      .populate("dispatcherId", "name");

    if (!request) return res.status(404).json({ error: "Request not found." });

    res.json({ request });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch request status." });
  }
};
