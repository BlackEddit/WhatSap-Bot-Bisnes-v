/**
 * 📸 API ROUTES - IMÁGENES
 * Gestión de imágenes recibidas y productos
 */

const express = require('express');
const multer = require('multer');
const router = express.Router();
const ImageController = require('../controllers/ImageController');

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = req.body.type === 'product' ? 
            './storage/images/products' : 
            './storage/images/received';
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueName + '.' + file.originalname.split('.').pop());
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB máximo
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes'), false);
        }
    }
});

// GET /api/images - Obtener todas las imágenes
router.get('/', ImageController.getAllImages);

// GET /api/images/received - Imágenes recibidas de clientes
router.get('/received', ImageController.getReceivedImages);

// GET /api/images/products - Imágenes de productos
router.get('/products', ImageController.getProductImages);

// GET /api/images/analyze/:filename - Analizar imagen específica
router.get('/analyze/:filename', ImageController.analyzeImage);

// POST /api/images/upload - Subir nueva imagen
router.post('/upload', upload.single('image'), ImageController.uploadImage);

// POST /api/images/analyze - Analizar imagen subida
router.post('/analyze', upload.single('image'), ImageController.analyzeUploadedImage);

// PUT /api/images/:id/metadata - Actualizar metadatos
router.put('/:id/metadata', ImageController.updateMetadata);

// DELETE /api/images/:filename - Eliminar imagen
router.delete('/:filename', ImageController.deleteImage);

module.exports = router;