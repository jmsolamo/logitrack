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
    // Today calculations
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const deliveriesTodayList = await Delivery.find({
      status: 'In Transit',
      dateFrom: { $gte: startOfToday, $lte: endOfToday }
    }).select('referenceNo status destination createdAt purpose activity vehicleEquipment customerSupplier driver helper jobOrderNo').sort({ createdAt: -1 });

    const pendingRequestsTodayList = await DeliveryRequest.find({
      requestStatus: 'Pending',
      createdAt: { $gte: startOfToday, $lte: endOfToday }
    }).select('referenceNo requestStatus requestedBy createdAt deliveryType dateFrom dateTo purpose activity vehicleEquipment destination jobOrderNo customerSupplier').sort({ createdAt: -1 });

    const deliveriesToday = deliveriesTodayList.length;
    const pendingRequestsToday = pendingRequestsTodayList.length;

    const totalUsers = await User.countDocuments();

    // Total deliveries (all time or active depending on definition, we'll do all time for now)
    const totalDeliveries = await Delivery.countDocuments();

    // Pending requests
    const pendingRequests = await DeliveryRequest.countDocuments({ requestStatus: 'Pending' });

    // Active deliveries (status: Pending or In Transit)
    const activeDeliveries = await Delivery.countDocuments({ status: { $in: ['Pending', 'In Transit'] } });

    // Breakdown for Total Deliveries card
    const pendingDeliveries = await Delivery.countDocuments({ status: 'Pending' });
    const inTransitDeliveries = await Delivery.countDocuments({ status: 'In Transit' });

    // Additional metrics
    const completedDeliveries = await Delivery.countDocuments({ status: 'Completed' });
    const totalVehicles = await Vehicle.countDocuments();
    const availableVehicles = await Vehicle.countDocuments({ 
      $or: [
        { status: 'Available' },
        { status: { $exists: false } },
        { status: null }
      ]
    });
    const maintenanceVehicles = await Vehicle.countDocuments({ status: 'Maintenance' });
    const unavailableVehicles = await Vehicle.countDocuments({ status: { $in: ['Unavailable', 'Booked'] } }); // Considering Booked as Unavailable per user request context
    
    const unavailableVehiclesList = await Vehicle.find({ status: { $in: ['Maintenance', 'Unavailable', 'Booked'] } })
      .select('plateNumber model status maintenanceReason maintenanceStartDate maintenanceEndDate')
      .sort({ updatedAt: -1 });

    const approvedRequests = await DeliveryRequest.countDocuments({ requestStatus: 'Approved' });
    const declinedRequests = await DeliveryRequest.countDocuments({ requestStatus: 'Declined' });
    const approvedWithChangesRequests = await DeliveryRequest.countDocuments({ requestStatus: 'Approved with Changes' });
    const totalAnnouncements = await Announcement.countDocuments();
    const totalPersonnel = await Personnel.countDocuments();

    const purchases = await Purchase.find();

    // Get all vehicle plate numbers and models to dynamically match vehicle-specific purchases
    const allVehicles = await Vehicle.find().select('plateNumber model');
    const vehicleIdentifiers = [];
    allVehicles.forEach(v => {
      if (v.plateNumber) vehicleIdentifiers.push(v.plateNumber.trim().toUpperCase());
      if (v.model) vehicleIdentifiers.push(v.model.trim().toUpperCase());
    });

    let totalPurchases = 0;
    let motorpoolPurchases = 0;
    let maintenancePurchases = 0;
    let vehiclePurchases = 0;

    purchases.forEach(p => {
      let amount = 0;
      if (p.amount) {
        String(p.amount).split(',').forEach(v => {
          amount += parseFloat(v.trim()) || 0;
        });
      }

      totalPurchases += amount;

      const cat = p.category ? p.category.trim().toUpperCase() : '';
      if (cat === '00012 - MOTORPOOL') {
        motorpoolPurchases += amount;
      } else if (cat === '100E - MAINTENANCE') {
        maintenancePurchases += amount;
      } else if (cat.includes('VEHICLE') || vehicleIdentifiers.some(id => id && cat.includes(id))) {
        vehiclePurchases += amount;
      }
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

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyExpensesAggregation = await Delivery.aggregate([
      {
        $match: {
          createdAt: { $gte: oneWeekAgo }
        }
      },
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

    const weeklyExpStats = weeklyExpensesAggregation[0] || {};
    const weeklyExpenses = (weeklyExpStats.totalFuel || 0) + (weeklyExpStats.totalToll || 0) + (weeklyExpStats.totalPier || 0) +
      (weeklyExpStats.totalRepair || 0) + (weeklyExpStats.totalMeal || 0) + (weeklyExpStats.totalLoad || 0) +
      (weeklyExpStats.totalContingency || 0);

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const monthlyExpensesAggregation = await Delivery.aggregate([
      {
        $match: {
          createdAt: { $gte: oneMonthAgo }
        }
      },
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

    const monthlyExpStats = monthlyExpensesAggregation[0] || {};
    const monthlyExpenses = (monthlyExpStats.totalFuel || 0) + (monthlyExpStats.totalToll || 0) + (monthlyExpStats.totalPier || 0) +
      (monthlyExpStats.totalRepair || 0) + (monthlyExpStats.totalMeal || 0) + (monthlyExpStats.totalLoad || 0) +
      (monthlyExpStats.totalContingency || 0);

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const yearlyExpensesAggregation = await Delivery.aggregate([
      {
        $match: {
          createdAt: { $gte: oneYearAgo }
        }
      },
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

    const yearlyExpStats = yearlyExpensesAggregation[0] || {};
    const yearlyExpenses = (yearlyExpStats.totalFuel || 0) + (yearlyExpStats.totalToll || 0) + (yearlyExpStats.totalPier || 0) +
      (yearlyExpStats.totalRepair || 0) + (yearlyExpStats.totalMeal || 0) + (yearlyExpStats.totalLoad || 0) +
      (yearlyExpStats.totalContingency || 0);

    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const monthlyTrendAggregation = await Delivery.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfYear }
        }
      },
      {
        $project: {
          month: { $month: "$createdAt" },
          total: {
            $add: [
              { $sum: "$fuel.amount" },
              { $sum: "$tollFee.amt" },
              { $sum: "$pierExpenses.amt" },
              { $sum: "$repairAndMaintenance.amt" },
              { $sum: "$mealExpenses.amt" },
              { $sum: "$loadExpenses.amt" },
              { $sum: "$contingency.amt" }
            ]
          }
        }
      },
      {
        $group: {
          _id: "$month",
          totalExpenses: { $sum: "$total" }
        }
      }
    ]);

    const monthlyExpensesTrend = Array.from({ length: 12 }, (_, i) => {
      const monthData = monthlyTrendAggregation.find(m => m._id === i + 1);
      return monthData ? monthData.totalExpenses : 0;
    });

    const topJobOrderExpensesAgg = await Delivery.aggregate([
      {
        $match: {
          jobOrderNo: { $exists: true, $not: { $size: 0 } }
        }
      },
      {
        $project: {
          jobOrderNo: 1,
          totalDeliveryExpense: {
            $add: [
              { $sum: "$fuel.amount" },
              { $sum: "$tollFee.amt" },
              { $sum: "$pierExpenses.amt" },
              { $sum: "$repairAndMaintenance.amt" },
              { $sum: "$mealExpenses.amt" },
              { $sum: "$loadExpenses.amt" },
              { $sum: "$contingency.amt" }
            ]
          }
        }
      },
      { $unwind: "$jobOrderNo" },
      {
        $match: {
          jobOrderNo: { $ne: "" }
        }
      },
      {
        $group: {
          _id: "$jobOrderNo",
          totalExpenses: { $sum: "$totalDeliveryExpense" }
        }
      },
      { $sort: { totalExpenses: -1 } },
      { $limit: 5 }
    ]);

    const topJobOrders = topJobOrderExpensesAgg.map(item => ({
      name: item._id,
      value: item.totalExpenses
    }));

    res.json({
      totalUsers,
      totalDeliveries,
      pendingRequests,
      activeDeliveries,
      completedDeliveries,
      totalVehicles,
      availableVehicles,
      maintenanceVehicles,
      unavailableVehicles,
      unavailableVehiclesList,
      approvedRequests,
      totalAnnouncements,
      totalPersonnel,
      totalPurchases,
      totalExpenses,
      weeklyExpenses,
      monthlyExpenses,
      yearlyExpenses,
      monthlyExpensesTrend,
      topJobOrders,
      motorpoolPurchases,
      maintenancePurchases,
      vehiclePurchases,
      pendingDeliveries,
      inTransitDeliveries,
      declinedRequests,
      approvedWithChangesRequests,
      deliveriesToday,
      pendingRequestsToday,
      recentDeliveriesToday: deliveriesTodayList,
      recentPendingRequestsToday: pendingRequestsTodayList
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
