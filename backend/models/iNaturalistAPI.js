// iNaturalist API Integration - FREE Plant Identification
// La mejor API gratuita para identificación de plantas del mundo

const axios = require('axios');
const FormData = require('form-data');

class iNaturalistAPI {
    constructor() {
        this.baseURL = 'https://api.inaturalist.org/v1';
        this.identifyURL = 'https://api.inaturalist.org/v1/computervision/score_image';
        
        // Credenciales OAuth (opcionales pero recomendadas)
        this.clientId = process.env.INATURALIST_CLIENT_ID || null;
        this.clientSecret = process.env.INATURALIST_CLIENT_SECRET || null;
        this.accessToken = null;
        
        // Rate limiting para ser respetuosos
        this.lastRequest = 0;
        this.minInterval = 1000; // 1 segundo entre requests
        
        console.log('🔍 iNaturalist API inicializada');
        if (!this.clientId) {
            console.log('⚠️ iNaturalist sin credenciales - usando modo público limitado');
            console.log('📝 Para mejor rendimiento configura INATURALIST_CLIENT_ID');
        }
    }

    // Rate limiting
    async waitIfNeeded() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequest;
        if (timeSinceLastRequest < this.minInterval) {
            await new Promise(resolve => setTimeout(resolve, this.minInterval - timeSinceLastRequest));
        }
        this.lastRequest = Date.now();
    }

    // Obtener token de acceso si es necesario
    async getAccessToken() {
        if (!this.clientId || !this.clientSecret) {
            return null; // Usar modo público
        }

        try {
            // Implementar OAuth flow si es necesario
            // Por ahora usar modo público
            return null;
        } catch (error) {
            console.error('❌ Error obteniendo token iNaturalist:', error.message);
            return null;
        }
    }

    // Identificar planta usando iNaturalist Computer Vision  
    async identifyPlant(imageBuffer) {
        try {
            await this.waitIfNeeded();
            
            console.log('🔍 Enviando imagen a iNaturalist API...');
            
            // Usar método alternativo más confiable
            const base64Image = imageBuffer.toString('base64');
            
            const requestData = {
                image: base64Image,
                taxon_id: 47126, // Plantae (Reino de plantas)
                locale: 'es' // Español
            };

            const headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'LaHuertaDelHusky/1.0'
            };

            // Agregar token si está disponible
            if (this.accessToken) {
                headers['Authorization'] = `Bearer ${this.accessToken}`;
            }

            const response = await axios.post(
                'https://api.inaturalist.org/v1/computervision/score_image',
                requestData,
                {
                    headers,
                    timeout: 25000
                }
            );

            if (response.data && response.data.results) {
                console.log(`✅ iNaturalist devolvió ${response.data.results.length} resultados`);
                return this.parseINaturalistResponse(response.data.results);
            } else {
                console.log('⚠️ iNaturalist no devolvió resultados');
                return [];
            }

        } catch (error) {
            if (error.response) {
                console.error(`❌ Error iNaturalist API: ${error.response.status} - ${error.response.statusText}`);
                if (error.response.data) {
                    console.error('Detalles:', error.response.data);
                }
            } else if (error.request) {
                console.error('❌ No se pudo conectar con iNaturalist');
            } else {
                console.error('❌ Error configurando request:', error.message);
            }
            
            return [];
        }
    }

    // Parsear respuesta de iNaturalist
    parseINaturalistResponse(results) {
        const plants = [];

        for (const result of results) {
            // Filtrar solo plantas (reino Plantae)
            if (this.isPlant(result)) {
                const plantInfo = {
                    scientific_name: result.taxon.name,
                    common_name: this.getCommonName(result.taxon),
                    confidence: Math.round(result.vision_score * 100),
                    probability: result.vision_score,
                    source: 'iNaturalist',
                    family: result.taxon.iconic_taxon_name || 'Plantae',
                    rank: result.taxon.rank,
                    observations: result.taxon.observations_count || 0,
                    photos: result.taxon.default_photo ? result.taxon.default_photo.medium_url : null,
                    wikipedia_url: result.taxon.wikipedia_url,
                    inaturalist_url: `https://www.inaturalist.org/taxa/${result.taxon.id}`,
                    isRealAPI: true
                };

                plants.push(plantInfo);
            }
        }

        // Ordenar por confianza
        return plants.sort((a, b) => b.confidence - a.confidence);
    }

    // Verificar si es una planta
    isPlant(result) {
        if (!result.taxon) return false;
        
        // Verificar si pertenece al reino Plantae
        const iconicTaxon = result.taxon.iconic_taxon_name;
        const ancestors = result.taxon.ancestors || [];
        
        // Buscar en ancestros o nombre icónico
        if (iconicTaxon === 'Plantae') return true;
        
        return ancestors.some(ancestor => 
            ancestor.name === 'Plantae' || 
            ancestor.iconic_taxon_name === 'Plantae'
        );
    }

    // Obtener nombre común
    getCommonName(taxon) {
        // Priorizar nombres en español
        if (taxon.preferred_common_name) {
            return taxon.preferred_common_name;
        }

        // Buscar en nombres comunes
        if (taxon.common_name) {
            return taxon.common_name;
        }

        // Fallback al nombre científico
        return taxon.name;
    }

    // Obtener información adicional de una especie
    async getSpeciesInfo(taxonId) {
        try {
            await this.waitIfNeeded();
            
            const response = await axios.get(`${this.baseURL}/taxa/${taxonId}`, {
                timeout: 10000
            });

            if (response.data && response.data.results && response.data.results[0]) {
                const taxon = response.data.results[0];
                
                return {
                    description: taxon.wikipedia_summary,
                    conservation_status: taxon.conservation_status,
                    native_places: taxon.listed_places || [],
                    photos_count: taxon.photos_count || 0,
                    observations_count: taxon.observations_count || 0
                };
            }

            return null;
        } catch (error) {
            console.error('❌ Error obteniendo info de especie:', error.message);
            return null;
        }
    }

    // Buscar plantas por nombre
    async searchPlantByName(plantName) {
        try {
            await this.waitIfNeeded();
            
            const response = await axios.get(`${this.baseURL}/taxa`, {
                params: {
                    q: plantName,
                    iconic_taxa: 'Plantae', // Solo plantas
                    per_page: 5
                },
                timeout: 10000
            });

            if (response.data && response.data.results) {
                return response.data.results.map(taxon => ({
                    scientific_name: taxon.name,
                    common_name: this.getCommonName(taxon),
                    rank: taxon.rank,
                    observations: taxon.observations_count || 0,
                    inaturalist_url: `https://www.inaturalist.org/taxa/${taxon.id}`,
                    photos: taxon.default_photo ? taxon.default_photo.medium_url : null
                }));
            }

            return [];
        } catch (error) {
            console.error('❌ Error buscando planta por nombre:', error.message);
            return [];
        }
    }

    // Estadísticas de la API
    getStats() {
        return {
            name: 'iNaturalist Computer Vision',
            cost: 'GRATIS',
            limits: 'Sin límites estrictos',
            accuracy: 'Muy alta (millones de observaciones)',
            database_size: '500,000+ especies',
            last_request: new Date(this.lastRequest).toLocaleString('es-MX')
        };
    }
}

module.exports = iNaturalistAPI;