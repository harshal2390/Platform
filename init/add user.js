// seedUsers.js
const mongoose = require("mongoose");
const User = require("./models/userModel"); // adjust path

mongoose
  .connect("mongodb://127.0.0.1:27017/platform")
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error(err));

async function seedUsers() {
  try {
    await User.deleteMany({}); // optional: clear old users

    // register() handles hashing password
    const user1 = await User.register(
      new User({
        name: "Alice Johnson",
        email: "alice@example.com",
        role: "freelancer",
        bio: "Full-stack developer with 5 years of experience.",
        skills: ["JavaScript", "React", "Node.js"],
        profilePic: "https://example.com/alice.jpg",
      }),
      "password123"
    );

    const user2 = await User.register(
      new User({
        name: "Bob Smith",
        email: "bob@example.com",
        role: "employer",
        bio: "Looking to hire talented freelancers for my projects.",
        skills: ["Project Management"],
        profilePic: "https://example.com/bob.jpg",
      }),
      "securePass456"
    );

    console.log("✅ Users created:", user1.email, user2.email);
    mongoose.connection.close();
  } catch (err) {
    console.error(err);
    mongoose.connection.close();
  }
}

seedUsers();
