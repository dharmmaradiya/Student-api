  require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Faculty = require("./models/Faculty");
const Attendance = require("./models/Attendance");
const auth = require("./middleware/auth");

const app = express();
app.use(express.json());


app.get("/", (req, res) => {
  res.json({ message: "Employee Attendance API Running" });
});


app.post("/faculty/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({
        message: "Name, email and password are required"
      });

    if (await Faculty.findOne({ email }))
      return res.status(400).json({
        message: "Faculty already exists"
      });

    const faculty = await Faculty.create({
      name,
      email,
      password: await bcrypt.hash(password, 10)
    });

    res.status(201).json({
      message: "Faculty registered successfully",
      faculty: {
        id: faculty._id,
        name: faculty.name,
        email: faculty.email
      }
    });

  } catch (error) {
    res.status(500).json({
      message: "Registration failed",
      error: error.message
    });
  }
});



app.post("/faculty/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const faculty = await Faculty.findOne({ email });

    if (!faculty || !(await bcrypt.compare(password, faculty.password)))
      return res.status(401).json({
        message: "Invalid email or password"
      });

    const token = jwt.sign(
      { id: faculty._id, email: faculty.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token
    });

  } catch (error) {
    res.status(500).json({
      message: "Login failed",
      error: error.message
    });
  }
});



app.post("/attendance/mark", auth, async (req, res) => {
  try {
    const { employeeName, employeeId, status, date } = req.body;

    if (!employeeName || !employeeId || !status)
      return res.status(400).json({
        message: "employeeName, employeeId and status are required"
      });

    if (!["Present", "Absent"].includes(status))
      return res.status(400).json({
        message: "Status must be Present or Absent"
      });

    const attendance = await Attendance.create({
      employeeName,
      employeeId,
      status,
      date: date || new Date().toISOString().split("T")[0],
      markedBy: req.faculty.id
    });

    res.status(201).json({
      message: "Attendance marked successfully",
      attendance
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to mark attendance",
      error: error.message
    });
  }
});



app.get("/attendance/today", auth, async (req, res) => {
  try {
    const date = new Date().toISOString().split("T")[0];

    const attendance = await Attendance.find({ date })
      .populate("markedBy", "name email");

    res.json({
      date,
      total: attendance.length,
      attendance
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to get today's attendance",
      error: error.message
    });
  }
});



app.get("/attendance/date/:date", auth, async (req, res) => {
  try {
    const { date } = req.params;

    const attendance = await Attendance.find({ date })
      .populate("markedBy", "name email");

    res.json({
      date,
      total: attendance.length,
      attendance
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to get attendance",
      error: error.message
    });
  }
});



app.put("/attendance/:id", auth, async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!attendance)
      return res.status(404).json({
        message: "Attendance not found"
      });

    res.json({
      message: "Attendance updated successfully",
      attendance
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to update attendance",
      error: error.message
    });
  }
});



app.delete("/attendance/:id", auth, async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);

    if (!attendance)
      return res.status(404).json({
        message: "Attendance not found"
      });

    res.json({
      message: "Attendance deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to delete attendance",
      error: error.message
    });
  }
});



mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");

    const PORT = process.env.PORT || 8692;

    app.listen(PORT, () => {
      console.log(`Server started on http://localhost:${PORT}`);
    });
  })
  .catch(error => {
    console.log("MongoDB Connection Error:", error.message);
  });