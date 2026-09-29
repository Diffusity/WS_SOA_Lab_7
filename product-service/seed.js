require("dotenv").config();
const { connectDB, disconnectDB } = require("./config/db");
const Student = require("./models/Student");

const SAMPLE_STUDENTS = [
  { name: "Aarav Patel", email: "aarav@example.com", course: "Computer Science", semester: 5 },
  { name: "Diya Sharma", email: "diya@example.com", course: "Information Technology", semester: 3 }
];

async function seed() {
  await connectDB();
  for (const student of SAMPLE_STUDENTS) {
    const existing = await Student.findOne({ email: student.email });
    if (!existing) {
      await Student.create(student);
      console.log(`Inserted ${student.name} <${student.email}>`);
    } else {
      console.log(`Skipped ${student.email} (already exists)`);
    }
  }
  await disconnectDB();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err.message);
    process.exit(1);
  });
