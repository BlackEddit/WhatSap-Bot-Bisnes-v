/**
 * 📦 API ROUTES - INVENTARIO
 * Gestión completa del inventario con API REST
 */

const express = require('express');
const router = express.Router();
const InventoryController = require('../controllers/InventoryController');

// GET /api/inventory - Obtener todo el inventario
router.get('/', InventoryController.getAll);

// GET /api/inventory/stats - Estadísticas del inventario  
router.get('/stats', InventoryController.getStats);

// GET /api/inventory/low-stock - Productos con stock bajo
router.get('/low-stock', InventoryController.getLowStock);

// GET /api/inventory/plants - Solo plantas
router.get('/plants', InventoryController.getPlants);

// GET /api/inventory/pots - Solo macetas
router.get('/pots', InventoryController.getPots);

// GET /api/inventory/search/:term - Buscar productos
router.get('/search/:term', InventoryController.search);

// POST /api/inventory/plants - Crear nueva planta
router.post('/plants', InventoryController.createPlant);

// POST /api/inventory/pots - Crear nueva maceta
router.post('/pots', InventoryController.createPot);

// PUT /api/inventory/plants/:id - Actualizar planta
router.put('/plants/:id', InventoryController.updatePlant);

// PUT /api/inventory/pots/:id - Actualizar maceta
router.put('/pots/:id', InventoryController.updatePot);

// PATCH /api/inventory/stock - Actualizar solo stock
router.patch('/stock', InventoryController.updateStock);

// DELETE /api/inventory/plants/:id - Eliminar planta
router.delete('/plants/:id', InventoryController.deletePlant);

// DELETE /api/inventory/pots/:id - Eliminar maceta  
router.delete('/pots/:id', InventoryController.deletePot);

module.exports = router;