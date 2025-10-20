/**
 * 🌿 Sistema de Reconocimiento de Plantas AVANZADO
 * Analiza imágenes de plantas usando APIs especializadas y devuelve identificación y precios
 * Para "La Huerta del Husky"
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const UnifiedPlantIdentifier = require('./UnifiedPlantIdentifier');

// Cargar variables de entorno
require('dotenv').config();

class ImageAnalyzer {
    constructor() {
        // Inicializar sistema unificado de identificación
        this.plantIdentifier = new UnifiedPlantIdentifier();
        
        // APIs de identificación de plantas (legacy)
        this.plantIdApiKey = process.env.PLANT_ID_API_KEY || null;
        this.plantNetUrl = 'https://my-api.plantnet.org/v2/identify/the-plant-list';
        
        this.plantDatabase = {
            'malva': { precio: 25, descripcion: 'Malva - Excelente para infusiones', stock: 15 },
            'menta': { precio: 20, descripcion: 'Menta fresca - Aromática y refrescante', stock: 22 },
            'albahaca': { precio: 18, descripcion: 'Albahaca italiana - Perfecta para cocinar', stock: 30 },
            'romero': { precio: 22, descripcion: 'Romero - Hierba aromática resistente', stock: 18 },
            'lavanda': { precio: 35, descripcion: 'Lavanda - Relajante y aromática', stock: 12 },
            'tomillo': { precio: 20, descripcion: 'Tomillo - Hierba culinaria esencial', stock: 25 },
            'oregano': { precio: 15, descripcion: 'Orégano mexicano - Sabor intenso', stock: 28 },
            'cilantro': { precio: 12, descripcion: 'Cilantro fresco - Indispensable en cocina', stock: 35 },
            'perejil': { precio: 10, descripcion: 'Perejil rizado - Vitaminas y sabor', stock: 40 },
            'hierbabuena': { precio: 18, descripcion: 'Hierbabuena - Refrescante natural', stock: 20 },
            'ruda': { precio: 28, descripcion: 'Ruda - Planta medicinal tradicional', stock: 8 },
            'jamaica': { precio: 30, descripcion: 'Flor de Jamaica - Rica en antioxidantes', stock: 15 },
            'pothos': { precio: 45, descripcion: 'Pothos - Planta colgante resistente', stock: 12 },
            'monstera': { precio: 80, descripcion: 'Monstera Deliciosa - Hojas decorativas', stock: 6 },
            'suculenta': { precio: 25, descripcion: 'Suculenta variada - Fácil cuidado', stock: 30 },
            'cactus': { precio: 20, descripcion: 'Cactus mexicano - Resistente sequía', stock: 25 },
            'rosa': { precio: 35, descripcion: 'Rosal miniatura - Flores hermosas', stock: 15 },
            'girasol': { precio: 15, descripcion: 'Girasol enano - Alegre y colorido', stock: 20 }
        };
        
        this.macetasDatabase = {
            'chica': { precio: 15, descripcion: 'Maceta chica (10cm)', stock: 50 },
            'mediana': { precio: 25, descripcion: 'Maceta mediana (15cm)', stock: 35 },
            'grande': { precio: 40, descripcion: 'Maceta grande (20cm)', stock: 20 },
            'extra': { precio: 60, descripcion: 'Maceta extra grande (25cm)', stock: 10 }
        };

        // Filtros anti-spam mejorados
        this.spamObjects = [
            // Objetos tecnológicos
            'mouse', 'computer mouse', 'computer', 'laptop', 'phone', 'smartphone', 'tablet',
            'keyboard', 'monitor', 'screen', 'cable', 'usb', 'charger', 'headphones', 'earbuds',
            
            // Comida y bebidas
            'food', 'meal', 'drink', 'coffee', 'tea', 'soda', 'beer', 'wine', 'bread', 'cake',
            'pizza', 'burger', 'sandwich', 'fruit', 'apple', 'banana', 'orange', 'meat',
            
            // Objetos del hogar
            'chair', 'table', 'sofa', 'bed', 'lamp', 'clock', 'book', 'pen', 'pencil', 'paper',
            'bag', 'purse', 'wallet', 'keys', 'glasses', 'watch', 'jewelry', 'clothes', 'shirt',
            
            // Vehículos y transporte
            'car', 'truck', 'bus', 'motorcycle', 'bicycle', 'train', 'airplane', 'boat',
            
            // Animales
            'dog', 'cat', 'bird', 'fish', 'horse', 'cow', 'pig', 'chicken', 'rabbit',
            
            // Personas y partes del cuerpo
            'person', 'man', 'woman', 'child', 'face', 'hand', 'foot', 'eye', 'hair',
            
            // Otros objetos comunes
            'tool', 'hammer', 'screwdriver', 'nail', 'screw', 'toy', 'ball', 'doll',
            'document', 'receipt', 'ticket', 'money', 'coin', 'card'
        ];
    }

    /**
     * 🤖 Usa Plant.id API v3 para identificación REAL de plantas
     */
    async identifyWithPlantId(imageBuffer) {
        try {
            if (!this.plantIdApiKey) {
                console.log('⚠️ Plant.id API key no configurada, usando análisis local');
                return null;
            }

            console.log('🤖 Enviando imagen a Plant.id API...');
            const base64Image = imageBuffer.toString('base64');
            
            const response = await axios.post('https://plant.id/api/v3/identification', {
                images: [base64Image],
                similar_images: true,
                plant_details: [
                    "common_names",
                    "url", 
                    "description",
                    "taxonomy",
                    "rank",
                    "gbif_id",
                    "edible_parts",
                    "watering",
                    "best_light_condition",
                    "toxicity"
                ]
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Api-Key': this.plantIdApiKey
                }
            });

            if (response.data && response.data.result && response.data.result.classification) {
                const suggestions = response.data.result.classification.suggestions || [];
                const isPlant = response.data.result.is_plant;
                
                console.log(`✅ Plant.id API respondió: ${suggestions.length} sugerencias`);
                console.log(`🌱 Es planta: ${isPlant.binary} (${Math.round(isPlant.probability * 100)}%)`);
                
                if (!isPlant.binary || isPlant.probability < 0.7) {
                    console.log('❌ Plant.id dice que NO es una planta');
                    return [];
                }

                return suggestions.map(suggestion => ({
                    name: suggestion.name,
                    commonName: suggestion.details?.common_names?.[0] || suggestion.name,
                    confidence: Math.round(suggestion.probability * 100),
                    description: suggestion.details?.description?.value || '',
                    scientificName: suggestion.name,
                    taxonomy: suggestion.details?.taxonomy || {},
                    edibleParts: suggestion.details?.edible_parts || [],
                    watering: suggestion.details?.watering || {},
                    lightCondition: suggestion.details?.best_light_condition || '',
                    toxicity: suggestion.details?.toxicity || '',
                    isRealAPI: true,
                    accessToken: response.data.access_token
                }));
            }

            return null;
        } catch (error) {
            console.error('❌ Error con Plant.id API:', error.response?.data || error.message);
            if (error.response?.status === 429) {
                console.log('⚠️ Límite de créditos Plant.id alcanzado');
            }
            return null;
        }
    }

    /**
     * � MÉTODO PRINCIPAL: Analiza imagen con PRIORIDAD PlantNet-300K
     * 1. PlantNet-300K (modelo pre-entrenado en 306K imágenes)
     * 2. Plant.id API (fallback)
     * 3. Análisis local (último recurso)
     */
    async analyzeImage(imageBuffer, filename = '') {
        console.log(`\n🌿 === ANÁLISIS UNIFICADO DE IMAGEN INICIADO ===`);
        console.log(`📁 Archivo: ${filename}`);
        console.log(`📏 Tamaño: ${imageBuffer.length} bytes`);

        try {
            // Usar sistema unificado de identificación
            console.log(`\n🔬 [SISTEMA UNIFICADO] Consultando múltiples APIs...`);
            const identificationResult = await this.plantIdentifier.identifyPlant(imageBuffer);
            
            // Formatear resultado usando el sistema unificado
            const botResponse = this.plantIdentifier.formatForBot(identificationResult);
            
            if (botResponse.found) {
                console.log(`✅ IDENTIFICACIÓN EXITOSA: ${botResponse.scientific_name}`);
                console.log(`🎯 Confianza: ${botResponse.confidence}%`);
                console.log(`🗳️ Consenso: ${botResponse.consensus ? 'SÍ' : 'NO'}`);
                
                // Buscar información de la planta en nuestra base de datos
                const plantInfo = this.findPlantInDatabase(botResponse.scientific_name, botResponse.common_name);
                
                return {
                    success: true,
                    isPlant: true,
                    plantFound: true,
                    identification: {
                        scientific_name: botResponse.scientific_name,
                        common_name: botResponse.common_name,
                        confidence: botResponse.confidence,
                        consensus: botResponse.consensus,
                        sources: botResponse.sources
                    },
                    plantInfo: plantInfo,
                    message: botResponse.message,
                    rawResults: identificationResult
                };
            } else {
                console.log(`❌ NO SE PUDO IDENTIFICAR LA PLANTA`);
                return {
                    success: false,
                    isPlant: false,
                    plantFound: false,
                    message: botResponse.message,
                    details: botResponse.details,
                    rawResults: identificationResult
                };
            }

        } catch (error) {
            console.error('💥 Error en análisis unificado:', error);
            return this.formatErrorResponse(error.message);
        }
    }

    /**
     * 📝 Formateadores de respuesta para PlantNet-300K
     */
    formatPlantNetResponse(result) {
        const bestPrediction = result.predictions[0];
        return [{
            name: bestPrediction.species,
            common_name: bestPrediction.species,
            confidence: Math.round(bestPrediction.confidence * 100),
            probability: bestPrediction.confidence,
            source: 'PlantNet-300K',
            details: result.details || {}
        }];
    }

    formatPlantIdResponse(plantIdResult) {
        return plantIdResult.map(plant => ({
            ...plant,
            source: 'Plant.id API'
        }));
    }

    formatLocalResponse(localResult) {
        return localResult.map(plant => ({
            ...plant,
            source: 'Análisis Local'
        }));
    }

    formatNoDetectionResponse() {
        return [{
            name: 'No identificado',
            common_name: 'Objeto no reconocido como planta',
            confidence: 0,
            probability: 0,
            source: 'Sistema de detección',
            message: 'No se detectó ninguna planta en la imagen'
        }];
    }

    formatErrorResponse(errorMessage) {
        return [{
            name: 'Error de análisis',
            common_name: 'Error en procesamiento',
            confidence: 0,
            probability: 0,
            source: 'Sistema de error',
            error: errorMessage
        }];
    }

    /**
     * �🔍 Análisis mejorado que intenta múltiples métodos (MÉTODO LEGACY)
     */
    async analyzeImageContent(imageBuffer, filename) {
        try {
            console.log(`🔍 Analizando imagen: ${filename}`);
            
            // 1. Primero intentar con Plant.id API
            const plantIdResults = await this.identifyWithPlantId(imageBuffer);
            
            let detectedPlants = [];
            
            if (plantIdResults && plantIdResults.length > 0) {
                console.log('✅ Identificación exitosa con Plant.id API');
                detectedPlants = plantIdResults.map(plant => ({
                    name: this.mapToLocalDatabase(plant.commonName || plant.name),
                    confidence: plant.confidence,
                    scientificName: plant.name,
                    isRealAPI: true
                })).filter(plant => plant.name); // Solo plantas que tenemos en stock
            } else {
                // 2. Si falla, usar análisis local
                console.log('🔄 Usando análisis local como respaldo');
                detectedPlants = await this.simulateImageAnalysis(filename);
            }
            
            // 3. Verificar anti-spam con análisis de contenido
            if (await this.isSpamContent(filename)) {
                return {
                    success: false,
                    message: this.getRandomSpamResponse()
                };
            }
            
            if (detectedPlants.length === 0) {
                const noPlantResponses = [
                    '🤔 No veo ninguna planta en tu foto, carnal. ¿Seguro que es una planta? 😅',
                    '🐺 Mmm, no logro identificar ninguna planta ahí. ¿Podrías mandar una foto más clara de la planta? 🌱',
                    '😅 Órale, no pude detectar plantas en esa imagen. ¿Es realmente una planta lo que me mandaste?',
                    '🤷‍♂️ No capté ninguna planta en la foto. ¿Podrías intentar con una imagen más clara? 🌿',
                    '🔍 No detecté plantas por ningún lado, jefe. ¿Seguro que hay alguna en la foto? 🌱'
                ];
                
                const randomResponse = noPlantResponses[Math.floor(Math.random() * noPlantResponses.length)];
                
                return {
                    success: false,
                    message: randomResponse
                };
            }

            // Construir respuesta con plantas detectadas
            const confidence = detectedPlants[0].confidence;
            let response = '';
            
            if (detectedPlants[0].isRealAPI) {
                response = '🤖 **¡Análisis con IA especializada Plant.id!**\n\n';
                response += `🔬 **Identificación científica:**\n`;
                response += `📝 **${detectedPlants[0].scientificName}**\n`;
                if (detectedPlants[0].commonName && detectedPlants[0].commonName !== detectedPlants[0].scientificName) {
                    response += `🏷️ Nombre común: ${detectedPlants[0].commonName}\n`;
                }
                response += `🎯 Confianza: ${confidence}%\n\n`;
                
                if (detectedPlants[0].description) {
                    response += `📖 ${detectedPlants[0].description.substring(0, 200)}...\n\n`;
                }
                
                if (detectedPlants[0].edibleParts && detectedPlants[0].edibleParts.length > 0) {
                    response += `🍽️ Partes comestibles: ${detectedPlants[0].edibleParts.join(', ')}\n`;
                }
                
                if (detectedPlants[0].toxicity) {
                    response += `⚠️ Toxicidad: ${detectedPlants[0].toxicity.substring(0, 100)}...\n`;
                }
                
                if (detectedPlants[0].lightCondition) {
                    response += `☀️ Luz: ${detectedPlants[0].lightCondition.substring(0, 100)}...\n`;
                }
                
                response += '\n';
            } else if (confidence > 85) {
                response = '🌿 **¡Órale! Creo que detecté tu planta:**\n\n';
            } else if (confidence > 70) {
                response = '🤔 **Mmm, posiblemente sea esto:**\n\n';
            } else {
                response = '🐺 **No estoy muy seguro, pero podría ser:**\n\n';
            }
            
            // Mostrar información de inventario si tenemos la planta
            detectedPlants.forEach((plant, index) => {
                const plantInfo = this.plantDatabase[plant.name];
                if (plantInfo) {
                    response += `${index + 1}. **${plantInfo.descripcion}**\n`;
                    response += `   💰 Precio: $${plantInfo.precio}\n`;
                    response += `   📦 Stock: ${plantInfo.stock} disponibles\n`;
                    if (plant.confidence < 80 && !plant.isRealAPI) {
                        response += `   🎯 Confianza: ${plant.confidence}% (no estoy seguro al 100%)\n`;
                    }
                    response += '\n';
                } else if (plant.isRealAPI) {
                    // Si Plant.id identifica algo que no tenemos en inventario
                    response += `❌ **No tenemos esta planta en stock actualmente**\n`;
                    response += `💡 ¿Te interesa que la consigamos? ¡Mándame mensaje!\n\n`;
                }
            });

            if (detectedPlants[0].isRealAPI) {
                response += '🤖 *Identificación powered by Plant.id IA*\n';
            }
            response += '¿Te late alguna de estas o necesitas que te ayude con otra cosa? 🌱';

            return {
                success: true,
                plants: detectedPlants,
                message: response,
                suggestedPrice: detectedPlants[0] ? this.plantDatabase[detectedPlants[0].name]?.precio : null
            };

        } catch (error) {
            console.error('❌ Error analizando imagen:', error);
            return {
                success: false,
                message: '😅 Ups, tuve un problema analizando tu imagen. ¿Puedes intentar de nuevo?'
            };
        }
    }

    /**
     * 🎲 Simula el análisis de imagen basado en el nombre del archivo
     * En producción, esto se reemplazaría con análisis real
     */
    async simulateImageAnalysis(filename) {
        const lowerFilename = filename.toLowerCase();
        const detectedPlants = [];

        console.log(`🔍 Analizando archivo: ${filename}`);

        // **FILTRO ANTI-MAMADAS MEJORADO** - Detectar objetos que NO son plantas
        const noPlantKeywords = [
            // Tecnología
            'mouse', 'raton', 'computadora', 'pc', 'laptop', 'celular', 'telefono', 'phone',
            'mesa', 'escritorio', 'silla', 'teclado', 'pantalla', 'monitor', 'screen',
            'cable', 'cargador', 'audifonos', 'bocina', 'control', 'joystick',
            // Objetos del hogar
            'libro', 'cuaderno', 'pluma', 'lapiz', 'papel', 'carta', 'document',
            'comida', 'bebida', 'vaso', 'plato', 'tenedor', 'cuchara', 'food', 'drink',
            'ropa', 'zapato', 'camisa', 'pantalon', 'gorra', 'lentes', 'clothes',
            // Vehículos
            'carro', 'auto', 'llanta', 'volante', 'motor', 'car', 'truck',
            // Animales
            'perro', 'gato', 'animal', 'dog', 'cat', 'bird', 'fish',
            // Personas
            'persona', 'hombre', 'mujer', 'niño', 'face', 'person', 'people'
        ];

        const isNotPlant = noPlantKeywords.some(keyword => lowerFilename.includes(keyword));

        // Si detectamos que NO es una planta, mandar a la chingada
        if (isNotPlant) {
            console.log(`❌ Detectado objeto no-planta: ${filename}`);
            return []; // Regresa vacío para activar el mensaje de "no es planta"
        }

        // **DETECCIÓN INTELIGENTE DE PLANTAS**
        // 1. Detectar por palabras clave exactas
        for (const [plantName, plantInfo] of Object.entries(this.plantDatabase)) {
            if (lowerFilename.includes(plantName)) {
                detectedPlants.push({
                    name: plantName,
                    confidence: 92,
                    method: 'keyword_exact'
                });
                console.log(`✅ Detectada por nombre: ${plantName} (92%)`);
            }
        }

        // 2. Detectar por sinónimos y variaciones
        const plantSynonyms = {
            'malva': ['malva', 'mallow', 'malvas'],
            'menta': ['menta', 'mint', 'hierbabuena', 'mentha'],
            'albahaca': ['albahaca', 'basil', 'basilico'],
            'romero': ['romero', 'rosemary'],
            'lavanda': ['lavanda', 'lavender', 'espliego'],
            'tomillo': ['tomillo', 'thyme'],
            'oregano': ['oregano', 'origanum'],
            'cilantro': ['cilantro', 'coriander', 'culantro'],
            'perejil': ['perejil', 'parsley'],
            'ruda': ['ruda', 'rue'],
            'jamaica': ['jamaica', 'hibiscus', 'hibisco'],
            'pothos': ['pothos', 'potos', 'epipremnum'],
            'monstera': ['monstera', 'costilla', 'philodendron'],
            'suculenta': ['suculenta', 'succulent', 'echeveria', 'sedum', 'jade'],
            'cactus': ['cactus', 'cacto', 'nopal'],
            'rosa': ['rosa', 'rose', 'rosal'],
            'girasol': ['girasol', 'sunflower', 'mirasol']
        };

        if (detectedPlants.length === 0) {
            for (const [plantName, synonyms] of Object.entries(plantSynonyms)) {
                if (synonyms.some(synonym => lowerFilename.includes(synonym))) {
                    detectedPlants.push({
                        name: plantName,
                        confidence: 85,
                        method: 'synonym'
                    });
                    console.log(`✅ Detectada por sinónimo: ${plantName} (85%)`);
                    break; // Solo una coincidencia
                }
            }
        }

        // 3. Detectar por categorías generales (más conservador)
        const plantCategories = {
            'suculenta': ['succulent', 'cactus', 'jade', 'echeveria', 'sedum'],
            'hierba': ['herb', 'hierba', 'aromática', 'aromatica'],
            'flor': ['flower', 'flor', 'petal', 'bloom'],
            'hoja': ['leaf', 'hoja', 'verde', 'green'],
            'planta': ['plant', 'planta', 'vegetal', 'botanical']
        };

        if (detectedPlants.length === 0) {
            for (const [category, keywords] of Object.entries(plantCategories)) {
                if (keywords.some(keyword => lowerFilename.includes(keyword))) {
                    // Sugerir una planta común de esa categoría
                    const commonPlants = {
                        'suculenta': 'suculenta',
                        'hierba': 'menta',
                        'flor': 'rosa',
                        'hoja': 'pothos',
                        'planta': 'malva'
                    };
                    
                    detectedPlants.push({
                        name: commonPlants[category] || 'malva',
                        confidence: 70,
                        method: 'category'
                    });
                    console.log(`✅ Detectada por categoría: ${commonPlants[category]} (70%)`);
                    break;
                }
            }
        }

        // 4. Si no encuentra nada y parece ser una foto de planta, sugerir algo común
        const plantIndicators = ['img', 'photo', 'pic', 'foto', 'imagen', 'wp_', 'whatsapp'];
        const seemsLikePlantPhoto = plantIndicators.some(indicator => lowerFilename.includes(indicator));
        
        if (detectedPlants.length === 0 && seemsLikePlantPhoto) {
            // Solo 30% de probabilidad de sugerir algo
            if (Math.random() > 0.7) {
                const commonPlants = ['malva', 'menta', 'albahaca'];
                const randomPlant = commonPlants[Math.floor(Math.random() * commonPlants.length)];
                
                detectedPlants.push({
                    name: randomPlant,
                    confidence: 60,
                    method: 'guess'
                });
                console.log(`🤔 Sugerencia conservadora: ${randomPlant} (60%)`);
            }
        }

        // Simular tiempo de procesamiento
        await new Promise(resolve => setTimeout(resolve, 800));

        console.log(`📊 Resultado: ${detectedPlants.length} plantas detectadas`);
        return detectedPlants.sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * 💡 Obtiene sugerencias de plantas similares
     */
    getSimilarPlants(plantName) {
        const similar = {
            'menta': ['hierbabuena', 'albahaca'],
            'hierbabuena': ['menta', 'albahaca'],
            'albahaca': ['menta', 'hierbabuena', 'oregano'],
            'romero': ['tomillo', 'lavanda'],
            'tomillo': ['romero', 'oregano'],
            'oregano': ['tomillo', 'albahaca'],
            'cilantro': ['perejil'],
            'perejil': ['cilantro']
        };

        return similar[plantName] || [];
    }

    /**
     * 📋 Obtiene información completa de una planta
     */
    getPlantInfo(plantName) {
        const normalizedName = plantName.toLowerCase();
        return this.plantDatabase[normalizedName] || null;
    }

    /**
     * 🪴 Obtiene información de macetas
     */
    getMacetaInfo(size) {
        const normalizedSize = size.toLowerCase();
        return this.macetasDatabase[normalizedSize] || null;
    }

    /**
     * 📊 Genera reporte de análisis para el panel de control
     */
    generateAnalysisReport() {
        return {
            totalPlants: Object.keys(this.plantDatabase).length,
            totalMacetas: Object.keys(this.macetasDatabase).length,
            lowStock: this.getLowStockItems(),
            lastAnalysis: new Date().toISOString()
        };
    }

    /**
     * 🔍 Buscar planta en nuestra base de datos local
     */
    findPlantInDatabase(scientificName, commonName) {
        // Normalizar nombres para búsqueda
        const searchTerms = [
            scientificName.toLowerCase(),
            commonName.toLowerCase(),
            // Extraer géneros y términos clave
            ...scientificName.toLowerCase().split(' '),
            ...commonName.toLowerCase().split(' ')
        ].filter(term => term.length > 3); // Solo términos de más de 3 caracteres

        // Buscar coincidencias exactas primero
        for (const [key, plant] of Object.entries(this.plantDatabase)) {
            if (searchTerms.some(term => 
                key.includes(term) || 
                term.includes(key) ||
                plant.descripcion.toLowerCase().includes(term)
            )) {
                return {
                    found: true,
                    key: key,
                    ...plant,
                    match_type: 'database'
                };
            }
        }

        // Si no se encuentra, devolver información genérica
        return {
            found: false,
            precio: 'Consultar precio',
            descripcion: `${commonName} - Información no disponible en inventario`,
            stock: 'Consultar disponibilidad',
            match_type: 'external'
        };
    }

    /**
     * ⚠️ Detecta items con stock bajo
     */
    getLowStockItems() {
        const lowStock = [];
        
        for (const [name, info] of Object.entries(this.plantDatabase)) {
            if (info.stock < 10) {
                lowStock.push({ type: 'planta', name, stock: info.stock });
            }
        }

        for (const [size, info] of Object.entries(this.macetasDatabase)) {
            if (info.stock < 15) {
                lowStock.push({ type: 'maceta', name: size, stock: info.stock });
            }
        }

        return lowStock;
    }

    /**
     * 🔄 Actualiza stock de una planta
     */
    async updatePlantStock(plantName, newStock) {
        const normalizedName = plantName.toLowerCase();
        if (this.plantDatabase[normalizedName]) {
            this.plantDatabase[normalizedName].stock = parseInt(newStock);
            console.log(`✅ Stock actualizado: ${plantName} = ${newStock}`);
            return true;
        }
        return false;
    }

    /**
     * �️ Mapea nombres científicos/comunes a nuestra base de datos local
     */
    mapToLocalDatabase(plantName) {
        if (!plantName) return null;
        
        const name = plantName.toLowerCase();
        
        // Mapeo directo
        if (this.plantDatabase[name]) return name;
        
        // Mapeo por palabras clave
        const mappings = {
            'malva': ['malva', 'mallow'],
            'menta': ['menta', 'mint', 'mentha'],
            'albahaca': ['albahaca', 'basil', 'ocimum'],
            'romero': ['romero', 'rosemary', 'rosmarinus'],
            'lavanda': ['lavanda', 'lavender', 'lavandula'],
            'tomillo': ['tomillo', 'thyme', 'thymus'],
            'oregano': ['oregano', 'origanum'],
            'cilantro': ['cilantro', 'coriander', 'coriandrum'],
            'perejil': ['perejil', 'parsley', 'petroselinum'],
            'hierbabuena': ['hierbabuena', 'spearmint'],
            'ruda': ['ruda', 'rue', 'ruta'],
            'jamaica': ['jamaica', 'hibiscus'],
            'pothos': ['pothos', 'epipremnum'],
            'monstera': ['monstera', 'deliciosa'],
            'suculenta': ['succulent', 'suculenta', 'echeveria', 'sedum'],
            'cactus': ['cactus', 'cactaceae'],
            'rosa': ['rosa', 'rose'],
            'girasol': ['girasol', 'sunflower', 'helianthus']
        };
        
        for (const [localName, keywords] of Object.entries(mappings)) {
            if (keywords.some(keyword => name.includes(keyword))) {
                return localName;
            }
        }
        
        return null;
    }

    /**
     * 🚫 Detecta contenido spam o no relacionado con plantas
     */
    async isSpamContent(filename) {
        const name = filename.toLowerCase();
        
        return this.spamObjects.some(spamObj => 
            name.includes(spamObj.toLowerCase())
        );
    }

    /**
     * 🎭 Respuestas aleatorias para spam
     */
    getRandomSpamResponse() {
        const spamResponses = [
            '🤨 Eso no parece ser una planta, carnal. ¿Me estás jugando una broma? 😅',
            '🐺 Órale, eso definitivamente NO es una planta. ¿Seguro que mandaste la foto correcta? 🌱',
            '😂 Jajaja muy gracioso, pero eso no es una planta. Mándame algo verde y que crezca, ¿sí? 🌿',
            '🤔 Mmm, creo que te confundiste de foto. Eso no es una planta, amigo. 🌱',
            '🙃 ¿En serio? Eso no es una planta ni de chiste. Mándame algo del reino vegetal, porfa 🌿',
            '🐺 No mames, eso NO es una planta. ¿Me quieres ver la cara o qué? 😅',
            '🌱 Aquí solo vendemos plantas, no... eso que sea que me mandaste 😂'
        ];
        
        return spamResponses[Math.floor(Math.random() * spamResponses.length)];
    }

    /**
     * ⚙️ Actualiza el stock de una planta específica
     */
    async updateMacetaStock(size, newStock) {
        const normalizedSize = size.toLowerCase();
        if (this.macetasDatabase[normalizedSize]) {
            this.macetasDatabase[normalizedSize].stock = parseInt(newStock);
            console.log(`✅ Stock actualizado: Maceta ${size} = ${newStock}`);
            return true;
        }
        return false;
    }
}

module.exports = ImageAnalyzer;