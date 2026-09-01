import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { Board } from "../models/Board";
import { Column } from "../models/Column";
import { Card } from "../models/Card";

const SEED_USER = {
  username: "demo",
  email: "demo@devboard.local",
  password: "Demo1234!",
};

const COLUMNS = [
  {
    title: "To Do",
    cards: [
      { title: "Research competitor features", description: "Look at Linear, Trello, Jira", labels: ["research"] },
      { title: "Write API spec", description: "Document all GraphQL mutations", labels: ["docs"] },
    ],
  },
  {
    title: "In Progress",
    cards: [
      { title: "Build card detail modal", description: "Assignee, due date, labels", labels: ["feature"], dueDate: new Date() },
      { title: "Add real-time subscriptions", labels: ["feature", "backend"] },
    ],
  },
  {
    title: "Done",
    cards: [
      { title: "Set up project structure", description: "Backend + frontend folders", labels: ["chore"] },
      { title: "JWT authentication", description: "Register, login, context middleware", labels: ["feature"] },
      { title: "Drag and drop reordering", labels: ["feature"] },
    ],
  },
];

const seed = async () => {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/devboard";
  await mongoose.connect(uri);
  console.log("✅ Connected to MongoDB");

  // Wipe existing seed data only (don't touch other users/boards).
  const existing = await User.findOne({ username: SEED_USER.username });
  if (existing) {
    const boards = await Board.find({ owner: existing._id });
    const boardIds = boards.map((b) => b._id);
    const cols = await Column.find({ board: { $in: boardIds } });
    await Card.deleteMany({ column: { $in: cols.map((c) => c._id) } });
    await Column.deleteMany({ board: { $in: boardIds } });
    await Board.deleteMany({ owner: existing._id });
    await User.deleteOne({ _id: existing._id });
    console.log("🗑️  Cleared previous seed data");
  }

  const passwordHash = await bcrypt.hash(SEED_USER.password, 10);
  const user = await User.create({ ...SEED_USER, passwordHash });
  console.log(`👤 Created user: ${SEED_USER.username} / ${SEED_USER.password}`);

  const board = await Board.create({
    name: "DevBoard Demo",
    owner: user._id,
    members: [{ user: user._id, role: "owner" }],
  });

  for (let ci = 0; ci < COLUMNS.length; ci++) {
    const { title, cards } = COLUMNS[ci];
    const column = await Column.create({ board: board._id, title, order: ci });
    for (let i = 0; i < cards.length; i++) {
      await Card.create({
        board: board._id,
        column: column._id,
        order: i,
        ...cards[i],
      });
    }
  }

  console.log(`📋 Created board "${board.name}" with ${COLUMNS.length} columns and ${COLUMNS.flatMap((c) => c.cards).length} cards`);
  console.log("\n🌱 Seed complete. Log in with:");
  console.log(`   Email:    ${SEED_USER.email}`);
  console.log(`   Password: ${SEED_USER.password}`);

  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
