/**
 * 📦 CONTROLADOR DE INVENTARIO
 * Lógica de negocio para gestión de inventario
 */

const InventoryModel = require('../models/InventoryModel');

class InventoryController {
    
    // GET /api/inventory
    static async getAll(req, res) {
        try {
            const inventory = await InventoryModel.getAll();
            res.json({
                success: true,
                data: inventory,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error obteniendo inventario',
                error: error.message
            });
        }
    }

    // GET /api/inventory/stats
    static async getStats(req, res) {
        try {
            const stats = await InventoryModel.getStats();
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error obteniendo estadísticas',
                error: error.message
            });
        }
    }

    // GET /api/inventory/low-stock
    static async getLowStock(req, res) {
        try {
            const lowStock = await InventoryModel.getLowStock();
            res.json({
                success: true,
                data: lowStock,
                count: lowStock.length
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error obteniendo productos con stock bajo',
                error: error.message
            });
        }
    }

    // GET /api/inventory/plants
    static async getPlants(req, res) {
        try {
            const plants = await InventoryModel.getPlants();
            res.json({
                success: true,
                data: plants
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error obteniendo plantas',
                error: error.message
            });
        }
    }

    // GET /api/inventory/pots
    static async getPots(req, res) {
        try {
            const pots = await InventoryModel.getPots();
            res.json({
                success: true,
                data: pots
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error obteniendo macetas',
                error: error.message
            });
        }
    }

    // GET /api/inventory/search/:term
    static async search(req, res) {
        try {
            const { term } = req.params;
            const results = await InventoryModel.search(term);
            res.json({
                success: true,
                data: results,
                searchTerm: term
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error en búsqueda',
                error: error.message
            });
        }
    }

    // POST /api/inventory/plants
    static async createPlant(req, res) {
        try {
            const plantData = req.body;
            const newPlant = await InventoryModel.createPlant(plantData);
            res.status(201).json({
                success: true,
                data: newPlant,
                message: 'Planta creada exitosamente'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: 'Error creando planta',
                error: error.message
            });
        }
    }

    // PUT /api/inventory/plants/:id
    static async updatePlant(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const updatedPlant = await InventoryModel.updatePlant(id, updateData);
            res.json({
                success: true,
                data: updatedPlant,
                message: 'Planta actualizada exitosamente'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: 'Error actualizando planta',
                error: error.message
            });
        }
    }

    // PATCH /api/inventory/stock
    static async updateStock(req, res) {
        try {
            const { type, id, stock } = req.body;
            const result = await InventoryModel.updateStock(type, id, stock);
            res.json({
                success: true,
                data: result,
                message: 'Stock actualizado exitosamente'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: 'Error actualizando stock',
                error: error.message
            });
        }
    }

    // DELETE /api/inventory/plants/:id
    static async deletePlant(req, res) {
        try {
            const { id } = req.params;
            await InventoryModel.deletePlant(id);
            res.json({
                success: true,
                message: 'Planta eliminada exitosamente'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: 'Error eliminando planta',
                error: error.message
            });
        }
    }

    // POST /api/inventory/pots - Crear maceta
    static async createPot(req, res) {
        try {
            const potData = req.body;
            const newPot = await InventoryModel.createPot(potData);
            res.status(201).json({
                success: true,
                data: newPot,
                message: 'Maceta creada exitosamente'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: 'Error creando maceta',
                error: error.message
            });
        }
    }

    // PUT /api/inventory/pots/:id - Actualizar maceta
    static async updatePot(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const updatedPot = await InventoryModel.updatePot(id, updateData);
            res.json({
                success: true,
                data: updatedPot,
                message: 'Maceta actualizada exitosamente'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: 'Error actualizando maceta',
                error: error.message
            });
        }
    }

    // DELETE /api/inventory/pots/:id - Eliminar maceta
    static async deletePot(req, res) {
        try {
            const { id } = req.params;
            await InventoryModel.deletePot(id);
            res.json({
                success: true,
                message: 'Maceta eliminada exitosamente'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: 'Error eliminando maceta',
                error: error.message
            });
        }
    }
}

module.exports = InventoryController;