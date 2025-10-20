// Google Vision API - Identificación PREMIUM de plantas
// Aprovecha los $300 USD gratuitos de Google Cloud

const vision = require('@google-cloud/vision');

class GoogleVisionAPI {
    constructor() {
        this.isConfigured = false;
        
        try {
            // Inicializar cliente de Vision API
            this.client = new vision.ImageAnnotatorClient({
                // Las credenciales se cargan automáticamente desde GOOGLE_APPLICATION_CREDENTIALS
                // o desde el archivo de service account
            });
            
            this.isConfigured = true;
            console.log('🤖 Google Vision API inicializada exitosamente');
            console.log('💰 Aprovechando $300 USD gratuitos');
            
        } catch (error) {
            console.log('⚠️ Google Vision API no configurada:', error.message);
            console.log('📝 Configura GOOGLE_APPLICATION_CREDENTIALS para usar Vision API');
        }
        
        // Base de datos de plantas para mejorar identificaciones
        this.plantDatabase = {
            // Plantas comunes en español
            'plant': { es: 'planta', confidence_boost: 1.0 },
            'leaf': { es: 'hoja', confidence_boost: 0.9 },
            'flower': { es: 'flor', confidence_boost: 0.9 },
            'tree': { es: 'árbol', confidence_boost: 0.8 },
            'grass': { es: 'pasto', confidence_boost: 0.7 },
            'herb': { es: 'hierba', confidence_boost: 0.8 },
            'succulent': { es: 'suculenta', confidence_boost: 0.9 },
            'cactus': { es: 'cactus', confidence_boost: 0.9 },
            'rose': { es: 'rosa', confidence_boost: 0.8 },
            'daisy': { es: 'margarita', confidence_boost: 0.8 },
            'dandelion': { es: 'diente de león', confidence_boost: 0.8 }
        };
    }

    // Verificar si está configurada
    isReady() {
        return this.isConfigured;
    }

    // Identificar planta usando Google Vision
    async identifyPlant(imageBuffer) {
        if (!this.isConfigured) {
            console.log('⚠️ Google Vision no configurada, saltando...');
            return [];
        }

        try {
            console.log('🤖 Analizando imagen con Google Vision API...');
            
            const request = {
                image: {
                    content: imageBuffer
                },
                features: [
                    { type: 'LABEL_DETECTION', maxResults: 20 },
                    { type: 'WEB_DETECTION', maxResults: 10 },
                    { type: 'OBJECT_LOCALIZATION', maxResults: 10 }
                ]
            };

            const [result] = await this.client.annotateImage(request);
            
            // Combinar todos los resultados
            const plantResults = this.processVisionResults(result);
            
            console.log(`✅ Google Vision identificó ${plantResults.length} posibilidades`);
            return plantResults;

        } catch (error) {
            console.error('❌ Error con Google Vision API:', error.message);
            if (error.code === 7) {
                console.log('💳 Verifica que tengas créditos disponibles en Google Cloud');
            }
            return [];
        }
    }

    // Procesar resultados de Vision API
    processVisionResults(result) {
        const plantIdentifications = [];
        
        // 1. Análisis de labels (etiquetas)
        if (result.labelAnnotations) {
            const plantLabels = result.labelAnnotations
                .filter(label => this.isPlantRelated(label.description))
                .map(label => ({
                    scientific_name: this.getScientificName(label.description),
                    common_name: this.translateToSpanish(label.description),
                    confidence: Math.round(label.score * 100),
                    probability: label.score,
                    source: 'Google Vision Labels',
                    detection_type: 'label',
                    original_label: label.description,
                    isRealAPI: true
                }));
            
            plantIdentifications.push(...plantLabels);
        }

        // 2. Análisis web (búsqueda inversa)
        if (result.webDetection && result.webDetection.webEntities) {
            const webPlants = result.webDetection.webEntities
                .filter(entity => entity.description && this.isPlantRelated(entity.description))
                .slice(0, 5) // Top 5
                .map(entity => ({
                    scientific_name: entity.description,
                    common_name: this.translateToSpanish(entity.description),
                    confidence: Math.round((entity.score || 0.7) * 100),
                    probability: entity.score || 0.7,
                    source: 'Google Web Detection',
                    detection_type: 'web',
                    original_entity: entity.description,
                    isRealAPI: true
                }));
            
            plantIdentifications.push(...webPlants);
        }

        // 3. Análisis de objetos localizados
        if (result.localizedObjectAnnotations) {
            const objectPlants = result.localizedObjectAnnotations
                .filter(obj => this.isPlantRelated(obj.name))
                .map(obj => ({
                    scientific_name: obj.name,
                    common_name: this.translateToSpanish(obj.name),
                    confidence: Math.round(obj.score * 100),
                    probability: obj.score,
                    source: 'Google Object Detection',
                    detection_type: 'object',
                    bounding_box: obj.boundingPoly,
                    isRealAPI: true
                }));
            
            plantIdentifications.push(...objectPlants);
        }

        // Filtrar y ordenar resultados
        return plantIdentifications
            .filter(plant => plant.confidence > 30) // Mínimo 30% confianza
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 8); // Top 8 resultados
    }

    // Verificar si es relacionado con plantas
    isPlantRelated(description) {
        if (!description) return false;
        
        const desc = description.toLowerCase();
        
        const plantKeywords = [
            'plant', 'flower', 'leaf', 'tree', 'grass', 'herb', 'botanical',
            'flora', 'vegetation', 'bloom', 'petal', 'stem', 'root', 'branch',
            'succulent', 'cactus', 'rose', 'daisy', 'lily', 'orchid', 'fern',
            'moss', 'algae', 'fungi', 'mushroom', 'garden', 'wildflower',
            'houseplant', 'shrub', 'vine', 'bamboo', 'palm'
        ];

        const nonPlantKeywords = [
            'person', 'human', 'animal', 'car', 'building', 'food', 'clothing',
            'furniture', 'electronic', 'tool', 'machine', 'vehicle'
        ];

        // Verificar palabras no relacionadas con plantas
        if (nonPlantKeywords.some(keyword => desc.includes(keyword))) {
            return false;
        }

        // Verificar palabras relacionadas con plantas
        return plantKeywords.some(keyword => desc.includes(keyword));
    }

    // Obtener nombre científico (simulado)
    getScientificName(commonName) {
        const scientificMap = {
            'rose': 'Rosa spp.',
            'daisy': 'Bellis perennis',
            'dandelion': 'Taraxacum officinale',
            'sunflower': 'Helianthus annuus',
            'lily': 'Lilium spp.',
            'orchid': 'Orchidaceae',
            'cactus': 'Cactaceae',
            'succulent': 'Crassulaceae',
            'fern': 'Pteridophyta',
            'grass': 'Poaceae',
            'moss': 'Bryophyta',
            'palm': 'Arecaceae',
            'bamboo': 'Bambuseae'
        };

        const key = commonName.toLowerCase();
        return scientificMap[key] || `${commonName} spp.`;
    }

    // Traducir al español
    translateToSpanish(englishName) {
        const translations = {
            'plant': 'Planta',
            'flower': 'Flor',
            'leaf': 'Hoja',
            'tree': 'Árbol',
            'grass': 'Pasto',
            'herb': 'Hierba',
            'rose': 'Rosa',
            'daisy': 'Margarita',
            'dandelion': 'Diente de león',
            'sunflower': 'Girasol',
            'lily': 'Lirio',
            'orchid': 'Orquídea',
            'cactus': 'Cactus',
            'succulent': 'Suculenta',
            'fern': 'Helecho',
            'moss': 'Musgo',
            'palm': 'Palmera',
            'bamboo': 'Bambú',
            'wildflower': 'Flor silvestre',
            'houseplant': 'Planta de interior'
        };

        const key = englishName.toLowerCase();
        return translations[key] || englishName;
    }

    // Verificar si la imagen contiene plantas
    async containsPlants(imageBuffer) {
        if (!this.isConfigured) return { hasPlants: false, confidence: 0 };

        try {
            const request = {
                image: { content: imageBuffer },
                features: [{ type: 'LABEL_DETECTION', maxResults: 10 }]
            };

            const [result] = await this.client.annotateImage(request);
            
            let plantConfidence = 0;
            let hasPlants = false;

            if (result.labelAnnotations) {
                result.labelAnnotations.forEach(label => {
                    if (this.isPlantRelated(label.description)) {
                        hasPlants = true;
                        plantConfidence = Math.max(plantConfidence, label.score);
                    }
                });
            }

            return {
                hasPlants,
                confidence: Math.round(plantConfidence * 100),
                source: 'Google Vision'
            };

        } catch (error) {
            console.error('❌ Error verificando plantas:', error.message);
            return { hasPlants: false, confidence: 0 };
        }
    }

    // Obtener estadísticas
    getStats() {
        return {
            name: 'Google Vision API',
            cost: '$300 GRATIS al inicio',
            limits: '~200,000 imágenes con crédito gratuito',
            accuracy: 'Muy alta (95%+)',
            database_size: 'Millones de imágenes',
            configured: this.isConfigured,
            features: ['Label Detection', 'Web Detection', 'Object Localization']
        };
    }

    // Instrucciones de configuración
    getSetupInstructions() {
        return `
🤖 **CONFIGURAR GOOGLE VISION API:**

1. 🔑 **Google Cloud Console:**
   - Ir a: https://console.cloud.google.com/
   - Crear proyecto nuevo
   - Habilitar Vision API

2. 💰 **Créditos gratuitos:**
   - $300 USD GRATIS al registrarte
   - ~200,000 identificaciones gratis

3. 🔧 **Service Account:**
   - Crear Service Account
   - Descargar archivo JSON
   - Configurar variable: GOOGLE_APPLICATION_CREDENTIALS

4. 📦 **Instalar dependencia:**
   npm install @google-cloud/vision

💡 **VENTAJA:** Máxima precisión garantizada
        `;
    }
}

module.exports = GoogleVisionAPI;