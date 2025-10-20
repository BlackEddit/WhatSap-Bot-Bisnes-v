/**
 * 📸 MODELO DE IMÁGENES
 * Gestión de imágenes recibidas y de productos
 */

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class ImageModel {
    constructor() {
        this.dataPath = './storage/data/images.json';
        this.receivedPath = './storage/images/received';
        this.productsPath = './storage/images/products';
        this.initializeData();
    }

    async initializeData() {
        try {
            await fs.access(this.dataPath);
        } catch {
            // Crear archivo con datos iniciales
            const initialData = {
                images: {},
                metadata: {
                    totalImages: 0,
                    totalReceived: 0,
                    totalProducts: 0,
                    lastUpdated: new Date().toISOString()
                }
            };
            await this.saveData(initialData);
        }
    }

    async loadData() {
        try {
            const data = await fs.readFile(this.dataPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('❌ Error cargando imágenes:', error);
            return { images: {}, metadata: {} };
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
            console.error('❌ Error guardando imágenes:', error);
            throw error;
        }
    }

    // Obtener todas las imágenes
    static async getAllImages() {
        const model = new ImageModel();
        const data = await model.loadData();
        return Object.values(data.images || {});
    }

    // Obtener imágenes recibidas de clientes
    static async getReceivedImages() {
        const model = new ImageModel();
        const data = await model.loadData();
        return Object.values(data.images || {}).filter(img => img.type === 'received');
    }

    // Obtener imágenes de productos
    static async getProductImages() {
        const model = new ImageModel();
        const data = await model.loadData();
        return Object.values(data.images || {}).filter(img => img.type === 'product');
    }

    // Guardar información de imagen
    static async saveImage(imageData) {
        const model = new ImageModel();
        const data = await model.loadData();
        
        const id = uuidv4();
        const imageInfo = {
            id,
            ...imageData,
            createdAt: new Date().toISOString()
        };
        
        data.images[id] = imageInfo;
        
        // Actualizar contadores
        data.metadata.totalImages = Object.keys(data.images).length;
        data.metadata.totalReceived = Object.values(data.images).filter(img => img.type === 'received').length;
        data.metadata.totalProducts = Object.values(data.images).filter(img => img.type === 'product').length;
        
        await model.saveData(data);
        return imageInfo;
    }

    // Actualizar metadatos de imagen
    static async updateMetadata(id, metadata) {
        const model = new ImageModel();
        const data = await model.loadData();
        
        if (!data.images[id]) {
            throw new Error('Imagen no encontrada');
        }
        
        data.images[id] = {
            ...data.images[id],
            metadata: {
                ...data.images[id].metadata,
                ...metadata
            },
            updatedAt: new Date().toISOString()
        };
        
        await model.saveData(data);
        return data.images[id];
    }

    // Eliminar imagen
    static async deleteImage(filename) {
        const model = new ImageModel();
        const data = await model.loadData();
        
        // Buscar imagen por filename
        const imageEntry = Object.entries(data.images).find(([id, img]) => 
            img.filename === filename
        );
        
        if (!imageEntry) {
            throw new Error('Imagen no encontrada');
        }
        
        const [id, imageInfo] = imageEntry;
        
        // Eliminar archivo físico
        try {
            await fs.unlink(imageInfo.path);
        } catch (error) {
            console.warn('⚠️ No se pudo eliminar archivo físico:', error.message);
        }
        
        // Eliminar de base de datos
        delete data.images[id];
        
        // Actualizar contadores
        data.metadata.totalImages = Object.keys(data.images).length;
        data.metadata.totalReceived = Object.values(data.images).filter(img => img.type === 'received').length;
        data.metadata.totalProducts = Object.values(data.images).filter(img => img.type === 'product').length;
        
        await model.saveData(data);
    }

    // Obtener estadísticas de imágenes
    static async getStats() {
        const model = new ImageModel();
        const data = await model.loadData();
        
        const images = Object.values(data.images || {});
        const today = new Date().toDateString();
        
        const stats = {
            total: images.length,
            received: images.filter(img => img.type === 'received').length,
            products: images.filter(img => img.type === 'product').length,
            analyzed: images.filter(img => img.analysisResult).length,
            uploadedToday: images.filter(img => 
                new Date(img.createdAt).toDateString() === today
            ).length,
            totalSize: images.reduce((sum, img) => sum + (img.size || 0), 0)
        };
        
        return stats;
    }
}

module.exports = ImageModel;