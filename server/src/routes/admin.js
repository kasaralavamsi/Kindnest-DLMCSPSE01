const router = require("express").Router();
const { z } = require("zod");

const User = require("../models/User");
const Task = require("../models/Task");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

router.use(requireAuth);
router.use(requireRole("admin"));

// ✅ Stats (include archived count too)
router.get("/stats", async (req, res, next) => {
  try {
    const [totalUsers, roleAgg, totalTasks, archivedTasks, statusAgg, ratingAgg] = await Promise.all([
      User.countDocuments(),
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      Task.countDocuments(),
      Task.countDocuments({ isArchived: true }),
      Task.aggregate([
        { $match: { isArchived: { $ne: true } } },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      Task.aggregate([
        { $match: { rating: { $ne: null }, isArchived: { $ne: true } } },
        { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } }
      ])
    ]);

    const roleCounts = { requester: 0, volunteer: 0, admin: 0 };
    for (const r of roleAgg) roleCounts[r._id] = r.count;

    const statusCounts = { OPEN: 0, ACCEPTED: 0, DONE: 0, CLOSED: 0 };
    for (const s of statusAgg) statusCounts[s._id] = s.count;

    const avgRating = ratingAgg[0]?.avg ? Number(ratingAgg[0].avg.toFixed(2)) : null;
    const ratedTasks = ratingAgg[0]?.count ?? 0;

    res.json({
      ok: true,
      stats: {
        totalUsers,
        roleCounts,
        totalTasks,
        archivedTasks,
        statusCounts,
        avgRating,
        ratedTasks
      }
    });
  } catch (err) {
    next(err);
  }
});

// Users
router.get("/users", async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = String(req.query.role);

    if (req.query.search) {
      const re = new RegExp(String(req.query.search), "i");
      filter.$or = [{ name: re }, { email: re }, { phone: re }];
    }

    const users = await User.find(filter)
      .select("name email phone role createdAt")
      .sort({ createdAt: -1 })
      .limit(500);

    res.json({ ok: true, users });
  } catch (err) {
    next(err);
  }
});

router.patch("/users/:id/role", async (req, res, next) => {
  try {
    const Body = z.object({ role: z.enum(["requester", "volunteer", "admin"]) });
    const parsed = Body.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: "Invalid role value" });

    if (String(req.userId) === String(req.params.id) && parsed.data.role !== "admin") {
      return res.status(400).json({ ok: false, error: "You cannot change your own admin role" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: parsed.data.role },
      { new: true }
    ).select("name email phone role createdAt");

    if (!user) return res.status(404).json({ ok: false, error: "User not found" });
    res.json({ ok: true, user });
  } catch (err) {
    next(err);
  }
});

// Tasks list (supports archived filter)
router.get("/tasks", async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = String(req.query.status);
    if (req.query.category) filter.category = String(req.query.category);

    const archived = String(req.query.archived || "active"); // active | archived | all
    if (archived === "active") filter.isArchived = { $ne: true };
    if (archived === "archived") filter.isArchived = true;
    // all -> no filter

    const tasks = await Task.find(filter)
      .populate("requesterId", "name role")
      .populate("volunteerId", "name role")
      .sort({ createdAt: -1 })
      .limit(500);

    res.json({ ok: true, tasks });
  } catch (err) {
    next(err);
  }
});

// ✅ Archive / Unarchive (soft moderation)
router.post("/tasks/:id/archive", async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ ok: false, error: "Task not found" });

    if (!task.isArchived) {
      task.isArchived = true;
      task.archivedAt = new Date();
      task.archivedBy = req.userId;
      task.history.push({ action: "ARCHIVED", byUserId: req.userId });
      await task.save();
    }

    res.json({ ok: true, task });
  } catch (err) {
    next(err);
  }
});

router.post("/tasks/:id/unarchive", async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ ok: false, error: "Task not found" });

    if (task.isArchived) {
      task.isArchived = false;
      task.archivedAt = null;
      task.archivedBy = null;
      task.history.push({ action: "UNARCHIVED", byUserId: req.userId });
      await task.save();
    }

    res.json({ ok: true, task });
  } catch (err) {
    next(err);
  }
});

// Reopen (admin override)
router.post("/tasks/:id/reopen", async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ ok: false, error: "Task not found" });

    if (task.isArchived) return res.status(409).json({ ok: false, error: "Task is archived" });

    if (!["ACCEPTED", "DONE"].includes(task.status)) {
      return res.status(409).json({ ok: false, error: "Only ACCEPTED or DONE tasks can be reopened" });
    }

    task.status = "OPEN";
    task.volunteerId = null;
    task.acceptedAt = null;
    task.doneAt = null;
    task.history.push({ action: "REOPENED_BY_ADMIN", byUserId: req.userId });

    await task.save();
    res.json({ ok: true, task });
  } catch (err) {
    next(err);
  }
});

module.exports = router;