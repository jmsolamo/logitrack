import express from 'express';
import { getPool } from '../db/pool.js';
import * as departmentsMysql from '../repositories/departmentsMysql.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const pool = getPool();
    const departments = await departmentsMysql.listDepartments(pool);
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching departments', error: error.message });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Department name is required' });
    }
    const pool = getPool();
    const department = await departmentsMysql.createDepartment(pool, { name });
    res.status(201).json({ message: 'Department created successfully', department });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Department already exists' });
    }
    res.status(500).json({ message: 'Error creating department', error: error.message });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Department name is required' });
    }
    const pool = getPool();
    const department = await departmentsMysql.updateDepartmentByIdParam(pool, req.params.id, { name });
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    res.json({ message: 'Department updated successfully', department });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Department name already exists' });
    }
    res.status(500).json({ message: 'Error updating department', error: error.message });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const pool = getPool();
    const ok = await departmentsMysql.deleteDepartmentByIdParam(pool, req.params.id);
    if (!ok) {
      return res.status(404).json({ message: 'Department not found' });
    }
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting department', error: error.message });
  }
});

export default router;
