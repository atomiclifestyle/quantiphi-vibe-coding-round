const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const foodDatabase = {
  'chicken breast': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  'white rice': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  'broccoli': { calories: 34, protein: 2.8, carbs: 6.6, fat: 0.4 },
  'salmon': { calories: 208, protein: 20, carbs: 0, fat: 13 },
  'egg': { calories: 155, protein: 13, carbs: 1.1, fat: 11 },
  'apple': { calories: 52, protein: 0.3, carbs: 14, fat: 0.2 }
};

const goalThresholds = {
  'Weight Loss':  { calories: 1800, protein: 140, carbs: 130, fats: 55 },
  'Maintenance':  { calories: 2200, protein: 150, carbs: 220, fats: 70 },
  'Muscle Gain':  { calories: 2800, protein: 180, carbs: 320, fats: 85 }
};


let currentState = {
  goal: 'Maintenance',
  meals: []
};

const calculateDashboardState = () => {
  const currentBudget = goalThresholds[currentState.goal];
  
  const aggregates = currentState.meals.reduce((acc, meal) => {
    acc.calories += meal.calories;
    acc.protein += meal.protein;
    acc.carbs += meal.carbs;
    acc.fats += meal.fats;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

  const isExceeded = aggregates.calories > currentBudget.calories;

  return {
    goal: currentState.goal,
    budget: currentBudget,
    consumed: aggregates,
    isExceeded: isExceeded,
    meals: currentState.meals
  };
};

const calculateNutrientsForWeight = (foodName, weightInGrams) => {
  const base = foodDatabase[foodName.toLowerCase()];
  if (!base) return null;

  const multiplier = weightInGrams / 100;
  return {
    calories: Math.round(base.calories * multiplier),
    protein: Math.round(base.protein * multiplier * 10) / 10,
    carbs: Math.round(base.carbs * multiplier * 10) / 10,
    fats: Math.round(base.fat * multiplier * 10) / 10,
  };
};

app.get('/api/dashboard', (req, res) => {
  res.json(calculateDashboardState());
});

app.post('/api/meals', (req, res) => {
  const { name, weight } = req.body;
  
  if (!name || !weight) {
    return res.status(400).json({ error: 'Name and weight (in grams) are required.' });
  }

  const nutrients = calculateNutrientsForWeight(name, weight);
  if (!nutrients) {
    return res.status(404).json({ error: 'Food not found in database.' });
  }

  const newMeal = {
    id: uuidv4(),
    name,
    weight,
    ...nutrients,
    timestamp: new Date().toISOString()
  };

  currentState.meals.push(newMeal);
  res.status(201).json(calculateDashboardState());
});

app.post('/api/meals/scan', (req, res) => {
  const scannedMeal = {
    id: uuidv4(),
    name: 'Scanned Grilled Salmon & Asparagus',
    weight: 250,
    calories: 450,
    protein: 42,
    carbs: 12,
    fats: 24,
    timestamp: new Date().toISOString()
  };

  currentState.meals.push(scannedMeal);
  res.status(201).json(calculateDashboardState());
});

app.delete('/api/meals/:id', (req, res) => {
  const { id } = req.params;
  currentState.meals = currentState.meals.filter(meal => meal.id !== id);
  
  res.json(calculateDashboardState());
});

app.put('/api/goal', (req, res) => {
  const { goal } = req.body;
  
  if (!['Weight Loss', 'Maintenance', 'Muscle Gain'].includes(goal)) {
    return res.status(400).json({ error: 'Invalid goal selected.' });
  }

  currentState.goal = goal;
  
  res.json(calculateDashboardState());
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Health Tracker API running on http://localhost:${PORT}`);
});