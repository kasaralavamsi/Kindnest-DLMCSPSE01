const router = require("express").Router();
const { z } = require("zod");

const Task = require("../models/Task");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

async function getTaskWithRefs(id) {
  return Task.findById(id)
    .populate("requesterId", "name role")
    .populate("volunteerId", "name role")
    .populate("history.byUserId", "name role");
}

// Validation
const CreateTaskSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(2000).optional().default(""),
  address: z.string().max(250).optional().default(""),
  category: z
    .enum(["grocery", "pharmacy", "companionship", "transport", "household", "other"])
    .optional()
    .default("other"),
  neededBy: z.string().datetime().optional().nullable()
});

const CloseTaskSchema = z.object({
  rating: z.number().int().min(1).max(5),
  review: z.string().max(1000).optional().default(""),
  tipAmount: z.number().min(0).max(500).optional().default(0)
});

router.use(requireAuth);

// GET /api/tasks?scope=available|mine|assigned|all&status=OPEN
router.get("/", async (req, res, next) => {
  try {
    const scope = String(req.query.scope || "mine");
    const status = req.query.status ? String(req.query.status) : null;

    const role = req.auth.role;
    const userId = req.userId;

    const q = {};
    if (status) q.status = status;

    // ✅ Non-admins never see archived tasks
    if (role !== "admin") q.isArchived = { $ne: true };

    if (scope === "available") {
      if (role !== "volunteer" && role !== "admin") {
        return res.status(403).json({ ok: false, error: "Only volunteers/admin can view available tasks" });
      }
      q.status = "OPEN";
    } else if (scope === "mine") {
      if (role !== "requester" && role !== "admin") {
        return res.status(403).json({ ok: false, error: "Only requesters/admin can view own tasks" });
      }
      q.requesterId = userId;
    } else if (scope === "assigned") {
      if (role !== "volunteer" && role !== "admin") {
        return res.status(403).json({ ok: false, error: "Only volunteers/admin can view assigned tasks" });
      }
      q.volunteerId = userId;
    } else if (scope === "all") {
      if (role !== "admin") return res.status(403).json({ ok: false, error: "Admin only" });
    } else {
      return res.status(400).json({ ok: false, error: "Invalid scope" });
    }

    const tasks = await Task.find(q).sort({ createdAt: -1 }).limit(200);
    res.json({ ok: true, tasks });
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks/:id (details)
router.get("/:id", async (req, res, next) => {
  try {
    const role = req.auth.role;
    const userId = req.userId;

    const task = await Task.findById(req.params.id)
      .populate("requesterId", "name role")
      .populate("volunteerId", "name role")
      .populate("history.byUserId", "name role");

    if (!task) return res.status(404).json({ ok: false, error: "Task not found" });

    // ✅ Archived tasks: admin can view; non-admin gets 404 (avoid leaking)
    if (task.isArchived && role !== "admin") {
      return res.status(404).json({ ok: false, error: "Task not found" });
    }

    if (role === "admin") return res.json({ ok: true, task });

    if (role === "requester") {
      if (String(task.requesterId?._id || task.requesterId) !== String(userId)) {
        return res.status(403).json({ ok: false, error: "Forbidden" });
      }
      return res.json({ ok: true, task });
    }

    if (role === "volunteer") {
      const isAssignedToMe =
        task.volunteerId && String(task.volunteerId?._id || task.volunteerId) === String(userId);
      const isOpen = task.status === "OPEN";
      if (!isOpen && !isAssignedToMe) return res.status(403).json({ ok: false, error: "Forbidden" });
      return res.json({ ok: true, task });
    }

    return res.status(403).json({ ok: false, error: "Forbidden" });
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks (Requester creates)
router.post("/", requireRole("requester", "admin"), async (req, res, next) => {
  try {
    const parsed = CreateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: parsed.error.issues[0]?.message || "Invalid input" });
    }

    const { title, description, address, category, neededBy } = parsed.data;


    const task = await Task.create({
      title,
      description,
      address,
      category,
      neededBy: neededBy ? new Date(neededBy) : null,
      requesterId: req.userId,
      history: [{ action: "CREATED", byUserId: req.userId }]
    });

    const populatedTask = await getTaskWithRefs(task._id);
    res.status(201).json({ ok: true, task: populatedTask });

  } catch (err) {
    next(err);
  }
});

// POST /api/tasks/:id/accept
router.post("/:id/accept", requireRole("volunteer", "admin"), async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ ok: false, error: "Task not found" });

    if (task.isArchived) return res.status(409).json({ ok: false, error: "Task is archived" });
    if (task.status !== "OPEN") return res.status(409).json({ ok: false, error: "Task is not open" });

    task.status = "ACCEPTED";
    task.volunteerId = req.userId;
    task.acceptedAt = new Date();
    task.history.push({ action: "ACCEPTED", byUserId: req.userId });

    await task.save();
    const populatedTask = await getTaskWithRefs(task._id);
    res.json({ ok: true, task: populatedTask });

  } catch (err) {
    next(err);
  }
});

// POST /api/tasks/:id/reject
router.post("/:id/reject", requireRole("volunteer", "admin"), async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ ok: false, error: "Task not found" });

    if (task.isArchived) return res.status(409).json({ ok: false, error: "Task is archived" });
    if (task.status !== "ACCEPTED") return res.status(409).json({ ok: false, error: "Task is not accepted" });

    if (req.auth.role !== "admin" && String(task.volunteerId) !== String(req.userId)) {
      return res.status(403).json({ ok: false, error: "Not your assigned task" });
    }

    task.status = "OPEN";
    task.volunteerId = null;
    task.acceptedAt = null;
    task.history.push({ action: "REJECTED", byUserId: req.userId });

    await task.save();
    const populatedTask = await getTaskWithRefs(task._id);
    res.json({ ok: true, task: populatedTask });

  } catch (err) {
    next(err);
  }
});

// POST /api/tasks/:id/done
router.post("/:id/done", requireRole("volunteer", "admin"), async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ ok: false, error: "Task not found" });

    if (task.isArchived) return res.status(409).json({ ok: false, error: "Task is archived" });
    if (task.status !== "ACCEPTED") return res.status(409).json({ ok: false, error: "Task must be accepted first" });

    if (req.auth.role !== "admin" && String(task.volunteerId) !== String(req.userId)) {
      return res.status(403).json({ ok: false, error: "Not your assigned task" });
    }

    task.status = "DONE";
    task.doneAt = new Date();
    task.history.push({ action: "DONE", byUserId: req.userId });

    await task.save();
    const populatedTask = await getTaskWithRefs(task._id);
    res.json({ ok: true, task: populatedTask });

  } catch (err) {
    next(err);
  }
});

// POST /api/tasks/:id/close
router.post("/:id/close", requireRole("requester", "admin"), async (req, res, next) => {
  try {
    const parsed = CloseTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: parsed.error.issues[0]?.message || "Invalid input" });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ ok: false, error: "Task not found" });

    if (task.isArchived) return res.status(409).json({ ok: false, error: "Task is archived" });
    if (task.status !== "DONE") return res.status(409).json({ ok: false, error: "Task must be marked DONE before closing" });

    if (req.auth.role !== "admin" && String(task.requesterId) !== String(req.userId)) {
      return res.status(403).json({ ok: false, error: "Not your task" });
    }

    const { rating, review, tipAmount } = parsed.data;

    task.status = "CLOSED";
    task.closedAt = new Date();
    task.rating = rating;
    task.review = review;
    task.tipAmount = tipAmount;
    task.history.push({ action: "CLOSED", byUserId: req.userId });

  await task.save();
  const populatedTask = await getTaskWithRefs(task._id);
  res.json({ ok: true, task: populatedTask });

  } catch (err) {
    next(err);
  }
});

module.exports = router;