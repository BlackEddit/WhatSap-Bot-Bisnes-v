// Pl@ntNet Official API - FREE Plant Identification
// API oficial del proyecto PlantNet académico

const axios = require('axios');
const FormData = require('form-data');

class PlantNetOfficialAPI {
    constructor() {
        // API key gratuita de Pl@ntNet (pueden registrarse gratis)
        this.apiKey = process.env.PLANTNET_API_KEY || 'YOUR_FREE_API_KEY_HERE';
        this.baseURL = 'https://my-api.plantnet.org/v1';
        
        // Proyectos disponibles (gratis)
        this.projects = {
            world: 'the-plant-list',           // Base mundial
            europe: 'k-world-flora',          // Flora europea  
            north_america: 'k-north-america', // Flora norteamericana
            useful: 'useful',                 // Plantas útiles
            weeds: 'weurope'                  // Malezas europeas
        };
        
        this.defaultProject = 'the-plant-list'; // Más amplio
        
        console.log('🌿 Pl@ntNet Official API inicializada');
        
        if (!this.apiKey || this.apiKey === 'YOUR_FREE_API_KEY_HERE') {
            console.log('⚠️ API Key de PlantNet no configurada. Registrate gratis en: https://my.plantnet.org/');
        }
    }

    // Verificar si está configurada
    isConfigured() {
        return this.apiKey && this.apiKey !== 'YOUR_FREE_API_KEY_HERE';
    }

    // Identificar planta
    async identifyPlant(imageBuffer, project = this.defaultProject) {
        if (!this.isConfigured()) {
            console.log('⚠️ PlantNet API no configurada, saltando...');
            return [];
        }

        try {
            console.log(`🔍 Enviando imagen a Pl@ntNet API (proyecto: ${project})...`);
            
            // Preparar FormData
            const formData = new FormData();
            formData.append('images', imageBuffer, {
                filename: 'plant.jpg',
                contentType: 'image/jpeg'
            });
            formData.append('modifiers', JSON.stringify(['crops', 'machine_learning']));
            formData.append('include-related-images', 'false');
            formData.append('no-reject', 'false');
            formData.append('nb-results', '5');

            const response = await axios.post(
                `${this.baseURL}/identify/${project}`,
                formData,
                {
                    headers: {
                        ...formData.getHeaders()
                    },
                    params: {
                        'api-key': this.apiKey
                    },
                    timeout: 30000
                }
            );

            if (response.data && response.data.results) {
                console.log(`✅ Pl@ntNet devolvió ${response.data.results.length} resultados`);
                return this.parsePlantNetResponse(response.data);
            }

            return [];

        } catch (error) {
            if (error.response) {
                const status = error.response.status;
                if (status === 429) {
                    console.error('❌ Pl@ntNet: Límite de requests alcanzado');
                } else if (status === 401) {
                    console.error('❌ Pl@ntNet: API Key inválida');
                } else {
                    console.error(`❌ Pl@ntNet Error: ${status} - ${error.response.statusText}`);
                }
            } else {
                console.error('❌ Error conectando con Pl@ntNet:', error.message);
            }
            
            return [];
        }
    }

    // Parsear respuesta de PlantNet
    parsePlantNetResponse(data) {
        if (!data.results) return [];

        return data.results.map(result => ({
            scientific_name: result.species.scientificNameWithoutAuthor,
            common_name: this.getCommonName(result.species.commonNames),
            confidence: Math.round(result.score * 100),
            probability: result.score,
            source: 'Pl@ntNet Official',
            family: result.species.family ? result.species.family.scientificNameWithoutAuthor : 'Desconocida',
            genus: result.species.genus ? result.species.genus.scientificNameWithoutAuthor : 'Desconocido',
            images: result.images ? result.images.slice(0, 3) : [],
            gbif_id: result.gbif ? result.gbif.id : null,
            isRealAPI: true
        })).filter(plant => plant.confidence >= 20); // Filtrar muy baja confianza
    }

    // Obtener nombre común
    getCommonName(commonNames) {
        if (!commonNames || commonNames.length === 0) {
            return 'Nombre común no disponible';
        }

        // Buscar nombre en español primero
        const spanishName = commonNames.find(name => 
            name.lang === 'es' || name.lang === 'spa'
        );
        
        if (spanishName) return spanishName.name;

        // Fallback al inglés
        const englishName = commonNames.find(name => 
            name.lang === 'en' || name.lang === 'eng'
        );
        
        if (englishName) return englishName.name;

        // Fallback al primer nombre disponible
        return commonNames[0].name;
    }

    // Obtener proyectos disponibles
    async getAvailableProjects() {
        try {
            const response = await axios.get(`${this.baseURL}/projects`, {
                params: {
                    'api-key': this.apiKey
                },
                timeout: 10000
            });

            return response.data;
        } catch (error) {
            console.error('❌ Error obteniendo proyectos:', error.message);
            return Object.keys(this.projects);
        }
    }

    // Obtener estadísticas
    getStats() {
        return {
            name: 'Pl@ntNet Official API',
            cost: 'GRATIS (con registro)',
            limits: '500 requests/día gratis',
            accuracy: 'Muy alta (académico)',
            database_size: '30,000+ especies',
            configured: this.isConfigured(),
            projects: Object.keys(this.projects).length
        };
    }

    // Instrucciones para configurar
    getSetupInstructions() {
        return `
🔧 **CONFIGURAR PL@NTNET API GRATIS:**

1. 📝 **Registrarse:** https://my.plantnet.org/
2. 🔑 **Obtener API Key gratuita**
3. 📁 **Agregar a .env:**
   PLANTNET_API_KEY=tu_key_aqui
4. 🚀 **Reiniciar bot**

💰 **LÍMITES GRATIS:**
• 500 requests/día
• Sin costo
• Acceso a 30K+ especies
• Precisión académica
        `;
    }
}

module.exports = PlantNetOfficialAPI;