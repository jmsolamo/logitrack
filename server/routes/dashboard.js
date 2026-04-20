import express from 'express';
import Delivery from '../models/Delivery.js';
import DeliveryRequest from '../models/DeliveryRequest.js';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import Announcement from '../models/Announcement.js';
import Purchase from '../models/Purchase.js';
import Personnel from '../models/Personnel.js';
import mongoose from 'mongoose';

const router = express.Router();

// GET /api/dashboard/metrics
// Get key summary cards
router.get('/metrics', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    
    // Total deliveries (all time or active depending on definition, we'll do all time for now)
    const totalDeliveries = await Delivery.countDocuments();
    
    // Pending requests
    const pendingRequests = await DeliveryRequest.countDocuments({ requestStatus: 'Pending' });

    // Active deliveries (status: Pending or Ongoing)
    const activeDeliveries = await Delivery.countDocuments({ status: { $in: ['Pending', 'Ongoing'] } });

    // Additional metrics
    const completedDeliveries = await Delivery.countDocuments({ status: 'Completed' });
    const totalVehicles = await Vehicle.countDocuments();
    const approvedRequests = await DeliveryRequest.countDocuments({ requestStatus: 'Approved' });
    const totalAnnouncements = await Announcement.countDocuments();
    const totalPersonnel = await Personnel.countDocuments();

    const purchases = await Purchase.find();
    let totalPurchases = 0;
    purchases.forEach(p => {
      totalPurchases += parseFloat(String(p.amount).replace(/,/g, '')) || 0;
    });

    const expensesAggregation = await Delivery.aggregate([
      {
        $project: {
          fuelTotal: { $sum: "$fuel.amount" },
          tollTotal: { $sum: "$tollFee.amt" },
          pierTotal: { $sum: "$pierExpenses.amt" },
          repairTotal: { $sum: "$repairAndMaintenance.amt" },
          mealTotal: { $sum: "$mealExpenses.amt" },
          loadTotal: { $sum: "$loadExpenses.amt" },
          contingencyTotal: { $sum: "$contingency.amt" }
        }
      },
      {
        $group: {
          _id: null,
          totalFuel: { $sum: "$fuelTotal" },
          totalToll: { $sum: "$tollTotal" },
          totalPier: { $sum: "$pierTotal" },
          totalRepair: { $sum: "$repairTotal" },
          totalMeal: { $sum: "$mealTotal" },
          totalLoad: { $sum: "$loadTotal" },
          totalContingency: { $sum: "$contingencyTotal" }
        }
      }
    ]);

    const expStats = expensesAggregation[0] || {};
    const totalExpenses = (expStats.totalFuel || 0) + (expStats.totalToll || 0) + (expStats.totalPier || 0) + 
                          (expStats.totalRepair || 0) + (expStats.totalMeal || 0) + (expStats.totalLoad || 0) + 
                          (expStats.totalContingency || 0);

    res.json({
      totalUsers,
      totalDeliveries,
      pendingRequests,
      activeDeliveries,
      completedDeliveries,
      totalVehicles,
      approvedRequests,
      totalAnnouncements,
      totalPersonnel,
      totalPurchases,
      totalExpenses
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ message: 'Error fetching metrics' });
  }
});

// GET /api/dashboard/charts
// Get data for data visualization
router.get('/charts', async (req, res) => {
  try {
    // 1. Deliveries Over Time (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const deliveriesByMonth = await Delivery.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: { 
            year: { $year: "$createdAt" }, 
            month: { $month: "$createdAt" } 
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // Format for recharts
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const deliveriesTrend = deliveriesByMonth.map(d => ({
      name: `${monthNames[d._id.month - 1]} ${d._id.year}`,
      count: d.count
    }));

    // 2. Delivery Status Distribution (Pie Chart)
    const statusDistribution = await Delivery.aggregate([
      {
        $group: {
          _id: "$status",
          value: { $sum: 1 }
        }
      }
    ]).then(data => data.map(d => ({ name: d._id || 'Unknown', value: d.value })));

    // 3. Most Popular Vehicles (Bar Chart)
    const topVehicles = await Delivery.aggregate([
      {
        $group: {
          _id: "$vehicleEquipment",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]).then(data => data.map(d => ({ name: d._id || 'Unassigned', count: d.count })));

    // 4. Expense Breakdown
    const expAgg = await Delivery.aggregate([
      {
        $project: {
          fuelTotal: { $sum: "$fuel.amount" },
          tollTotal: { $sum: "$tollFee.amt" },
          pierTotal: { $sum: "$pierExpenses.amt" },
          repairTotal: { $sum: "$repairAndMaintenance.amt" },
          mealTotal: { $sum: "$mealExpenses.amt" },
          loadTotal: { $sum: "$loadExpenses.amt" },
          contingencyTotal: { $sum: "$contingency.amt" }
        }
      },
      {
        $group: {
          _id: null,
          Fuel: { $sum: "$fuelTotal" },
          Toll: { $sum: "$tollTotal" },
          Pier: { $sum: "$pierTotal" },
          Repair: { $sum: "$repairTotal" },
          Meal: { $sum: "$mealTotal" },
          Load: { $sum: "$loadTotal" },
          Contingency: { $sum: "$contingencyTotal" }
        }
      }
    ]);

    const expenseBreakdown = [];
    if (expAgg.length > 0) {
      const e = expAgg[0];
      if (e.Fuel > 0) expenseBreakdown.push({ name: 'Fuel', value: e.Fuel });
      if (e.Toll > 0) expenseBreakdown.push({ name: 'Toll Fees', value: e.Toll });
      if (e.Pier > 0) expenseBreakdown.push({ name: 'Pier/Shipping', value: e.Pier });
      if (e.Repair > 0) expenseBreakdown.push({ name: 'Repair & Maint.', value: e.Repair });
      if (e.Meal > 0) expenseBreakdown.push({ name: 'Meals', value: e.Meal });
      if (e.Load > 0) expenseBreakdown.push({ name: 'Load/Labor', value: e.Load });
      if (e.Contingency > 0) expenseBreakdown.push({ name: 'Contingency', value: e.Contingency });
    }

    res.json({
      deliveriesTrend,
      statusDistribution,
      topVehicles,
      expenseBreakdown
    });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({ message: 'Error fetching chart data' });
  }
});

// GET /api/dashboard/activity
// Get recent activity feed (Signups, Requests, Deliveries)
router.get('/activity', async (req, res) => {
  try {
    const recentSignups = await User.find().sort({ createdAt: -1 }).limit(5).lean();
    const recentDeliveries = await Delivery.find().sort({ createdAt: -1 }).limit(5).lean();
    const recentRequests = await DeliveryRequest.find().sort({ createdAt: -1 }).limit(5).lean();

    // Map to a common format
    let activities = [];

    recentSignups.forEach(u => {
      activities.push({
        id: `user-${u._id}`,
        type: 'user',
        title: 'New User Registration',
        description: `${u.firstname} ${u.lastname} registered as a ${u.role}.`,
        timestamp: u.createdAt,
        status: u.isVerified ? 'Verified' : 'Pending'
      });
    });

    recentDeliveries.forEach(d => {
      activities.push({
        id: `del-${d._id}`,
        type: 'delivery',
        title: 'Delivery Update',
        description: `Delivery ${d.referenceNo} is currently ${d.status}.`,
        timestamp: d.createdAt,
        status: d.status
      });
    });

    recentRequests.forEach(r => {
      activities.push({
        id: `req-${r._id}`,
        type: 'request',
        title: 'New Delivery Request',
        description: `Request ${r.referenceNo} submitted by ${r.requestedBy}.`,
        timestamp: r.createdAt,
        status: r.requestStatus
      });
    });

    // Sort combined activities by timestamp desc
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Take top 10
    const finalFeed = activities.slice(0, 10);

    res.json(finalFeed);
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    res.status(500).json({ message: 'Error fetching activity feed' });
  }
});

export default router;
