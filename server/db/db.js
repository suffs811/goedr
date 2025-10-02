import fs from 'fs';
import path from 'path';
import process from 'process';
import { JSONFilePreset } from 'lowdb/node';

// Ensure the db.json file exists
const dbPath = path.join(process.cwd(), 'db', 'db.json');
if (!fs.existsSync(dbPath)) {
fs.writeFileSync(dbPath, JSON.stringify({ plans: [] }, null, 2));
}
const lowdb = await JSONFilePreset(dbPath, { plans: [] });

// Custom DB for storing app data
export async function addLowDBData(data) {
  // Get all plans 
  await lowdb.read();
  if (!lowdb.data) {
    lowdb.data = { plans: [] };
  }
  if (!lowdb.data.plans) {
    lowdb.data.plans = [];
  }
  const plans = lowdb.data.plans;

  // Create a new plan object
  try {
  const plan = {
    id: plans.length + 1,
    domain: data.domain || 'default-domain',
    problem: data.problem || 'default-problem',
    plan_id: data.plan_id || 'default-plan-id',
    plan_text: data.plan_text || 'default-plan-text',
    solution: data.solution || 'default-solution',
    created_at: new Date().toISOString()
    };
  // Add a new plan
  lowdb.data.plans.push(plan);
  await lowdb.write();
  return {
    message: 'Plan added successfully',
    plans: plans.length
  };
  } catch (error) {
    console.error('Error adding plan:', error);
  }

  // Example operations:
  // plans.at(0) // First plan
  // plans.filter((plan) => plan.title.includes('lowdb')) // Filter by title
  // plans.find((plan) => plan.id === 1) // Find by id
  // plans.toSorted((a, b) => a.views - b.views) // Sort by views
}

// Clear all user data
export async function clearLowDBData() {
  try {
    await lowdb.read();
    lowdb.data = { plans: [] };
    await lowdb.write();
    return { message: 'LowDB cleared successfully' };
  } catch (error) {
    console.error('Error clearing LowDB:', error);
    throw new Error('Error clearing LowDB');
  }
}
