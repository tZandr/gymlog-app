import express from 'express';
import { Exercise } from '../models/Exercise.js';

const router = express.Router();

// Create
router.post('/', async (req, res) => {
  try {
    const exercise = await Exercise.create({ ...req.body, baseExercise: req.body.baseExercise || null });
    res.status(201).json(exercise);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all exercises
router.get('/', async (req, res) => {
  try {
    const exercises = await Exercise.find().sort({ name: 1 });
    res.status(200).json(exercises);
  } catch (error) {
    res.status(404).json({ message: 'Exercises not found' });
  }
});

// Get exercise by ID
router.get('/:id', async (req, res) => {
    try {
        const exercise = await Exercise.findById(req.params.id)
        res.json(exercise);
    } catch (error) {
        res.status(404).json({ message: 'Exercise not found' })
    }
})

router.put('/:id', async (req, res) => {
  try {
    const exercise = await Exercise.findByIdAndUpdate(
      req.params.id,
      { ...req.body, baseExercise: req.body.baseExercise || null },
      { new: true },
    );
    if (!exercise) { res.status(404).json({ message: 'Exercise not found' }); return; }
    res.json(exercise);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Exercise.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
