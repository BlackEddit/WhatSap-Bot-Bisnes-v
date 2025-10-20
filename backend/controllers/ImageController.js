/**
 * 📸 CONTROLADOR DE IMÁGENES
 * Lógica para gestión y análisis de imágenes
 */

const ImageModel = require('../models/ImageModel');
const ImageAnalyzer = require('../models/ImageAnalyzer');
const fs = require('fs').promises;
const path = require('path');

class ImageController {
    
    // GET /api/images
    static async getAllImages(req, res) {
        try {
            const images = await ImageModel.getAllImages();
            res.json({
                success: true,
                data: images,
                count: images.length
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error obteniendo imágenes',
                error: error.message
            });
        }
    }

    // GET /api/images/received
    static async getReceivedImages(req, res) {
        try {
            const images = await ImageModel.getReceivedImages();
            res.json({
                success: true,
                data: images,
                count: images.length
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error obteniendo imágenes recibidas',
                error: error.message
            });
        }
    }

    // GET /api/images/products
    static async getProductImages(req, res) {
        try {
            const images = await ImageModel.getProductImages();
            res.json({
                success: true,
                data: images,
                count: images.length
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error obteniendo imágenes de productos',
                error: error.message
            });
        }
    }

    // POST /api/images/upload
    static async uploadImage(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No se proporcionó ninguna imagen'
                });
            }

            const imageData = {
                filename: req.file.filename,
                originalName: req.file.originalname,
                path: req.file.path,
                size: req.file.size,
                mimetype: req.file.mimetype,
                type: req.body.type || 'received',
                uploadedAt: new Date().toISOString(),
                metadata: {
                    description: req.body.description || '',
                    tags: req.body.tags ? req.body.tags.split(',') : []
                }
            };

            const savedImage = await ImageModel.saveImage(imageData);
            
            res.status(201).json({
                success: true,
                data: savedImage,
                message: 'Imagen subida exitosamente'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error subiendo imagen',
                error: error.message
            });
        }
    }

    // POST /api/images/analyze
    static async analyzeUploadedImage(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No se proporcionó ninguna imagen para analizar'
                });
            }

            const analyzer = new ImageAnalyzer();
            const imageBuffer = await fs.readFile(req.file.path);
            
            const analysisResult = await analyzer.analyzeImage(
                imageBuffer, 
                req.file.originalname
            );

            // Guardar información del análisis
            const imageData = {
                filename: req.file.filename,
                originalName: req.file.originalname,
                path: req.file.path,
                size: req.file.size,
                type: 'analyzed',
                analysisResult: analysisResult,
                analyzedAt: new Date().toISOString()
            };

            await ImageModel.saveImage(imageData);

            res.json({
                success: true,
                data: {
                    image: imageData,
                    analysis: analysisResult
                },
                message: 'Imagen analizada exitosamente'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error analizando imagen',
                error: error.message
            });
        }
    }

    // GET /api/images/analyze/:filename
    static async analyzeImage(req, res) {
        try {
            const { filename } = req.params;
            const analyzer = new ImageAnalyzer();
            
            // Buscar imagen en ambas carpetas
            let imagePath = path.join('./storage/images/received', filename);
            if (!await fs.access(imagePath).then(() => true).catch(() => false)) {
                imagePath = path.join('./storage/images/products', filename);
            }

            const imageBuffer = await fs.readFile(imagePath);
            const analysisResult = await analyzer.analyzeImage(imageBuffer, filename);

            res.json({
                success: true,
                data: {
                    filename: filename,
                    analysis: analysisResult
                }
            });
        } catch (error) {
            res.status(404).json({
                success: false,
                message: 'Imagen no encontrada o error en análisis',
                error: error.message
            });
        }
    }

    // PUT /api/images/:id/metadata
    static async updateMetadata(req, res) {
        try {
            const { id } = req.params;
            const metadata = req.body;
            
            const updatedImage = await ImageModel.updateMetadata(id, metadata);
            
            res.json({
                success: true,
                data: updatedImage,
                message: 'Metadatos actualizados exitosamente'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: 'Error actualizando metadatos',
                error: error.message
            });
        }
    }

    // DELETE /api/images/:filename
    static async deleteImage(req, res) {
        try {
            const { filename } = req.params;
            await ImageModel.deleteImage(filename);
            
            res.json({
                success: true,
                message: 'Imagen eliminada exitosamente'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: 'Error eliminando imagen',
                error: error.message
            });
        }
    }
}

module.exports = ImageController;