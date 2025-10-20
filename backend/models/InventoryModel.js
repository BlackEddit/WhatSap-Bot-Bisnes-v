/**
 * 📦 MODELO DE INVENTARIO
 * Gestión de datos del inventario con persistencia JSON
 */

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class InventoryModel {
    constructor() {
        this.dataPath = './storage/data/inventory.json';
        this.initializeData();
    }

    async initializeData() {
        try {
            await fs.access(this.dataPath);
        } catch {
            // Crear archivo con datos iniciales
            const initialData = {
                plants: {
                    'malva-001': {
                        id: 'malva-001',
                        name: 'malva',
                        displayName: 'Malva',
                        description: 'Malva - Excelente para infusiones',
                        price: 25,
                        stock: 15,
                        category: 'medicinal',
                        image: null,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    },
                    'menta-001': {
                        id: 'menta-001',
                        name: 'menta',
                        displayName: 'Menta',
                        description: 'Menta fresca - Aromática y refrescante',
                        price: 20,
                        stock: 22,
                        category: 'aromatica',
                        image: null,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    },
                    'albahaca-001': {
                        id: 'albahaca-001',
                        name: 'albahaca',
                        displayName: 'Albahaca',
                        description: 'Albahaca italiana - Perfecta para cocinar',
                        price: 18,
                        stock: 30,
                        category: 'culinaria',
                        image: null,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    },
                    'cilantro-001': {
                        id: 'cilantro-001',
                        name: 'cilantro',
                        displayName: 'Cilantro',
                        description: 'Cilantro fresco - Indispensable en cocina',
                        price: 12,
                        stock: 35,
                        category: 'culinaria',
                        image: null,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    }
                },
                pots: {
                    'pot-small-001': {
                        id: 'pot-small-001',
                        size: 'chica',
                        displayName: 'Maceta Chica',
                        description: 'Maceta chica (10cm)',
                        price: 15,
                        stock: 50,
                        material: 'barro',
                        dimensions: '10cm',
                        image: null,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    },
                    'pot-medium-001': {
                        id: 'pot-medium-001',
                        size: 'mediana',
                        displayName: 'Maceta Mediana',
                        description: 'Maceta mediana (15cm)',
                        price: 25,
                        stock: 35,
                        material: 'barro',
                        dimensions: '15cm',
                        image: null,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    }
                },
                metadata: {
                    lastUpdated: new Date().toISOString(),
                    version: '2.0.0'
                }
            };

            await this.saveData(initialData);
            console.log('📦 Inventario inicializado con datos por defecto');
        }
    }

    async loadData() {
        try {
            const data = await fs.readFile(this.dataPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('❌ Error cargando inventario:', error);
            throw error;
        }
    }

    async saveData(data) {
        try {
            data.metadata = {
                ...data.metadata,
                lastUpdated: new Date().toISOString()
            };
            await fs.writeFile(this.dataPath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('❌ Error guardando inventario:', error);
            throw error;
        }
    }

    // Obtener todo el inventario
    static async getAll() {
        const model = new InventoryModel();
        const data = await model.loadData();
        return {
            plants: Object.values(data.plants || {}),
            pots: Object.values(data.pots || {}),
            metadata: data.metadata
        };
    }

    // Obtener estadísticas
    static async getStats() {
        const model = new InventoryModel();
        const data = await model.loadData();
        
        const plants = Object.values(data.plants || {});
        const pots = Object.values(data.pots || {});
        
        const totalPlants = plants.reduce((sum, plant) => sum + plant.stock, 0);
        const totalPots = pots.reduce((sum, pot) => sum + pot.stock, 0);
        const totalValuePlants = plants.reduce((sum, plant) => sum + (plant.price * plant.stock), 0);
        const totalValuePots = pots.reduce((sum, pot) => sum + (pot.price * pot.stock), 0);
        
        const lowStockPlants = plants.filter(plant => plant.stock < 10).length;
        const lowStockPots = pots.filter(pot => pot.stock < 15).length;

        return {
            summary: {
                totalPlants,
                totalPots,
                totalItems: totalPlants + totalPots,
                totalValue: totalValuePlants + totalValuePots,
                totalValuePlants,
                totalValuePots
            },
            alerts: {
                lowStockPlants,
                lowStockPots,
                totalAlerts: lowStockPlants + lowStockPots
            },
            categories: {
                plantsCount: plants.length,
                potsCount: pots.length
            }
        };
    }

    // Obtener productos con stock bajo
    static async getLowStock() {
        const model = new InventoryModel();
        const data = await model.loadData();
        
        const plants = Object.values(data.plants || {});
        const pots = Object.values(data.pots || {});
        
        const lowStockItems = [];
        
        plants.forEach(plant => {
            if (plant.stock < 10) {
                lowStockItems.push({
                    ...plant,
                    type: 'plant',
                    alertLevel: plant.stock === 0 ? 'critical' : plant.stock < 5 ? 'high' : 'medium'
                });
            }
        });
        
        pots.forEach(pot => {
            if (pot.stock < 15) {
                lowStockItems.push({
                    ...pot,
                    type: 'pot',
                    alertLevel: pot.stock === 0 ? 'critical' : pot.stock < 8 ? 'high' : 'medium'
                });
            }
        });
        
        return lowStockItems.sort((a, b) => {
            const alertOrder = { critical: 0, high: 1, medium: 2 };
            return alertOrder[a.alertLevel] - alertOrder[b.alertLevel];
        });
    }

    // Obtener solo plantas
    static async getPlants() {
        const model = new InventoryModel();
        const data = await model.loadData();
        return Object.values(data.plants || {});
    }

    // Obtener solo macetas
    static async getPots() {
        const model = new InventoryModel();
        const data = await model.loadData();
        return Object.values(data.pots || {});
    }

    // Buscar productos
    static async search(term) {
        const model = new InventoryModel();
        const data = await model.loadData();
        const searchTerm = term.toLowerCase();
        
        const plants = Object.values(data.plants || {});
        const pots = Object.values(data.pots || {});
        
        const results = [];
        
        plants.forEach(plant => {
            if (plant.name.toLowerCase().includes(searchTerm) ||
                plant.displayName.toLowerCase().includes(searchTerm) ||
                plant.description.toLowerCase().includes(searchTerm)) {
                results.push({ ...plant, type: 'plant' });
            }
        });
        
        pots.forEach(pot => {
            if (pot.size.toLowerCase().includes(searchTerm) ||
                pot.displayName.toLowerCase().includes(searchTerm) ||
                pot.description.toLowerCase().includes(searchTerm)) {
                results.push({ ...pot, type: 'pot' });
            }
        });
        
        return results;
    }

    // Crear nueva planta
    static async createPlant(plantData) {
        const model = new InventoryModel();
        const data = await model.loadData();
        
        const id = uuidv4();
        const newPlant = {
            id,
            name: plantData.name.toLowerCase(),
            displayName: plantData.displayName || plantData.name,
            description: plantData.description,
            price: parseFloat(plantData.price),
            stock: parseInt(plantData.stock),
            category: plantData.category || 'general',
            image: plantData.image || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        data.plants[id] = newPlant;
        await model.saveData(data);
        
        return newPlant;
    }

    // Actualizar planta
    static async updatePlant(id, updateData) {
        const model = new InventoryModel();
        const data = await model.loadData();
        
        if (!data.plants[id]) {
            throw new Error('Planta no encontrada');
        }
        
        data.plants[id] = {
            ...data.plants[id],
            ...updateData,
            updatedAt: new Date().toISOString()
        };
        
        await model.saveData(data);
        return data.plants[id];
    }

    // Actualizar stock
    static async updateStock(type, id, stock) {
        const model = new InventoryModel();
        const data = await model.loadData();
        
        const collection = type === 'plant' ? data.plants : data.pots;
        
        if (!collection[id]) {
            throw new Error(`${type} no encontrado`);
        }
        
        collection[id].stock = parseInt(stock);
        collection[id].updatedAt = new Date().toISOString();
        
        await model.saveData(data);
        return collection[id];
    }

    // Eliminar planta
    static async deletePlant(id) {
        const model = new InventoryModel();
        const data = await model.loadData();
        
        if (!data.plants[id]) {
            throw new Error('Planta no encontrada');
        }
        
        delete data.plants[id];
        await model.saveData(data);
    }

    // Crear maceta
    static async createPot(potData) {
        const model = new InventoryModel();
        const data = await model.loadData();
        
        const id = uuidv4();
        const newPot = {
            id,
            size: potData.size.toLowerCase(),
            displayName: potData.displayName || `Maceta ${potData.size}`,
            description: potData.description,
            price: parseFloat(potData.price),
            stock: parseInt(potData.stock),
            material: potData.material || 'barro',
            dimensions: potData.dimensions || '',
            image: potData.image || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        data.pots[id] = newPot;
        await model.saveData(data);
        
        return newPot;
    }

    // Actualizar maceta
    static async updatePot(id, updateData) {
        const model = new InventoryModel();
        const data = await model.loadData();
        
        if (!data.pots[id]) {
            throw new Error('Maceta no encontrada');
        }
        
        data.pots[id] = {
            ...data.pots[id],
            ...updateData,
            updatedAt: new Date().toISOString()
        };
        
        await model.saveData(data);
        return data.pots[id];
    }

    // Eliminar maceta
    static async deletePot(id) {
        const model = new InventoryModel();
        const data = await model.loadData();
        
        if (!data.pots[id]) {
            throw new Error('Maceta no encontrada');
        }
        
        delete data.pots[id];
        await model.saveData(data);
    }
}

module.exports = InventoryModel;