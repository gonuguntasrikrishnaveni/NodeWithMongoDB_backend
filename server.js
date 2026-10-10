
const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
app.use(express.json());

const URL = "mongodb://127.0.0.1:27017";
const DB_NAME ="Company";
const COLLECTION_NAME = "workers";
const PORT = 3000;

const client = new MongoClient(URL);

let workers;

// Connect to MongoDB
async function startServer() {
    try {
        await client.connect();

        const db = client.db(DB_NAME);
        workers = db.collection(COLLECTION_NAME);

        console.log("MongoDB connected successfully");
        console.log("Database: " + DB_NAME);
        console.log("Collection: " + COLLECTION_NAME);

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("MongoDB connection failed:", error);
    }
}

// Validate worker data
function validateWorker(data) {
    return (
        data.workerId !== undefined &&
        typeof data.name === "string" &&
        data.name.trim() !== "" &&
        Number.isFinite(data.age) &&
        typeof data.job === "string" &&
        Number.isFinite(data.salary) &&
        Array.isArray(data.skills) &&
        data.skills.every(skill => typeof skill === "string") &&
        typeof data.city === "string"
    );
}

// 1. CREATE worker
app.post("/api/workers", async (req, res) => {
    try {
        const worker = req.body;

        if (!validateWorker(worker)) {
            return res.status(400).json({
                message: "Invalid worker data. Provide workerId, name, age, job, salary, skills array, and city."
            });
        }

        const existing = await workers.findOne({
            workerId: worker.workerId
        });

        if (existing) {
            return res.status(409).json({
                message: "Worker ID already exists"
            });
        }

        const result = await workers.insertOne(worker);

        res.status(201).json({
            message: "Worker created successfully",
            insertedId: result.insertedId,
            worker
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. READ all workers
app.get("/api/workers", async (req, res) => {
    try {
        const result = await workers.find().toArray();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. READ worker by workerId
app.get("/api/workers/:workerId", async (req, res) => {
    try {
        const workerId = Number(req.params.workerId);

        if (!Number.isFinite(workerId)) {
            return res.status(400).json({ message: "Invalid worker ID" });
        }

        const worker = await workers.findOne({ workerId });

        if (!worker) {
            return res.status(404).json({ message: "Worker not found" });
        }

        res.json(worker);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. UPDATE worker by workerId
app.patch("/api/workers/:workerId", async (req, res) => {
    try {
        const workerId = Number(req.params.workerId);

        if (!Number.isFinite(workerId)) {
            return res.status(400).json({ message: "Invalid worker ID" });
        }

        const allowedFields = [
            "name",
            "age",
            "job",
            "salary",
            "skills",
            "city"
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                message: "Provide at least one field to update"
            });
        }

        const result = await workers.updateOne(
            { workerId },
            { $set: updates }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Worker not found" });
        }

        res.json({ message: "Worker updated successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 5. DELETE worker by workerId
app.delete("/api/workers/:workerId", async (req, res) => {
    try {
        const workerId = Number(req.params.workerId);

        if (!Number.isFinite(workerId)) {
            return res.status(400).json({ message: "Invalid worker ID" });
        }

        const result = await workers.deleteOne({ workerId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Worker not found" });
        }

        res.json({ message: "Worker deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

startServer();
