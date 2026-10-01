const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    employeeName: {
      type: String,
      required: true
    },

    employeeId: {
      type: String,
      required: true
    },

    date: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["Present", "Absent"],
      required: true
    },

    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true
    }
  },
  {
    timestamps: true
  }
);

const Attendance = mongoose.model(
  "Attendance",
  attendanceSchema
);

module.exports = Attendance;