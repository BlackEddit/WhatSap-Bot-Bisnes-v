// Sistema Unificado de Identificación de Plantas
// Combina múltiples APIs para máxima precisión

const iNaturalistAPI = require('./iNaturalistAPI');
const PlantNetOfficialAPI = require('./PlantNetOfficialAPI');
const PlantNetModel = require('./PlantNetModel');
const PetalSearchAPI = require('./PetalSearchAPI');
const GoogleVisionAPI = require('./GoogleVisionAPI');

class UnifiedPlantIdentifier {
    constructor() {
        this.googleVision = new GoogleVisionAPI();
        this.inaturalist = new iNaturalistAPI();
        this.plantnetOfficial = new PlantNetOfficialAPI();
        this.plantnetSimulation = new PlantNetModel();
        this.petalSearch = new PetalSearchAPI();
        
        console.log('🔬 Sistema Unificado de Identificación iniciado');
        
        // Configurar prioridades (Google Vision como principal si está disponible)
        this.apiPriorities = [
            {
                name: 'Google Vision',
                api: this.googleVision,
                weight: 0.5, // 50% del peso - API premium
                enabled: this.googleVision.isReady()
            },
            {
                name: 'PlantNet Official',
                api: this.plantnetOfficial,
                weight: 0.25, // 25% del peso
                enabled: this.plantnetOfficial.isConfigured()
            },
            {
                name: 'PetalSearch',
                api: this.petalSearch,
                weight: 0.15, // 15% del peso
                enabled: true // Siempre disponible y gratis
            },
            {
                name: 'PlantNet Simulation',
                api: this.plantnetSimulation,
                weight: 0.1, // 10% del peso - fallback
                enabled: true // Siempre disponible como fallback
            },
            {
                name: 'iNaturalist',
                api: this.inaturalist,
                weight: 0.2, // 20% del peso
                enabled: false // Reactivar cuando tengas credenciales
            }
        ];
        
        console.log('📊 APIs configuradas:', this.getEnabledAPIs());
    }

    // Identificar usando todas las APIs disponibles
    async identifyPlant(imageBuffer) {
        console.log('🚀 Iniciando identificación unificada...');
        
        const allResults = [];
        const apiResults = {};

        // Ejecutar APIs en paralelo
        const promises = this.apiPriorities
            .filter(config => config.enabled)
            .map(async (config) => {
                try {
                    console.log(`🔍 Consultando ${config.name}...`);
                    
                    let results;
                    if (config.name === 'PlantNet Simulation') {
                        // El modelo simulado necesita el imageBuffer para análisis
                        results = await config.api.predictWithEnhancedSimulation(imageBuffer);
                    } else {
                        results = await config.api.identifyPlant(imageBuffer);
                    }
                    
                    // Agregar metadata de la API
                    const processedResults = results.map(result => ({
                        ...result,
                        source_api: config.name,
                        api_weight: config.weight,
                        weighted_confidence: result.confidence * config.weight
                    }));
                    
                    apiResults[config.name] = {
                        results: processedResults,
                        count: processedResults.length,
                        success: true
                    };
                    
                    return processedResults;
                    
                } catch (error) {
                    console.error(`❌ Error en ${config.name}:`, error.message);
                    apiResults[config.name] = {
                        results: [],
                        count: 0,
                        success: false,
                        error: error.message
                    };
                    return [];
                }
            });

        // Esperar todos los resultados
        const resultArrays = await Promise.all(promises);
        
        // Combinar todos los resultados
        resultArrays.forEach(results => allResults.push(...results));
        
        console.log(`📊 Total de resultados recolectados: ${allResults.length}`);
        
        // Procesar y unificar resultados
        const unifiedResults = this.unifyAndRankResults(allResults);
        
        // Crear resumen de consulta
        const summary = this.createConsultationSummary(apiResults, unifiedResults);
        
        return {
            results: unifiedResults.slice(0, 5), // Top 5
            summary: summary,
            total_results: allResults.length,
            apis_consulted: Object.keys(apiResults).length
        };
    }

    // Unificar y rankear resultados por especies
    unifyAndRankResults(allResults) {
        if (allResults.length === 0) return [];
        
        // Agrupar por nombre científico
        const speciesGroups = {};
        
        allResults.forEach(result => {
            const key = result.scientific_name.toLowerCase().trim();
            
            if (!speciesGroups[key]) {
                speciesGroups[key] = {
                    scientific_name: result.scientific_name,
                    common_name: result.common_name,
                    family: result.family || 'Desconocida',
                    genus: result.genus || 'Desconocido',
                    sources: [],
                    total_confidence: 0,
                    weighted_confidence: 0,
                    vote_count: 0,
                    consensus_score: 0
                };
            }
            
            // Agregar fuente
            speciesGroups[key].sources.push({
                api: result.source_api,
                confidence: result.confidence,
                weight: result.api_weight,
                weighted_confidence: result.weighted_confidence || result.confidence * 0.33
            });
            
            speciesGroups[key].total_confidence += result.confidence;
            speciesGroups[key].weighted_confidence += result.weighted_confidence || result.confidence * 0.33;
            speciesGroups[key].vote_count++;
            
            // Actualizar metadatos si tienen mejor información
            if (result.common_name && result.common_name !== 'Nombre común no disponible') {
                speciesGroups[key].common_name = result.common_name;
            }
            if (result.family && result.family !== 'Desconocida') {
                speciesGroups[key].family = result.family;
            }
        });
        
        // Calcular scores finales y ordenar
        const rankedResults = Object.values(speciesGroups).map(species => {
            // Score de consenso basado en múltiples APIs y confianza ponderada
            species.consensus_score = (
                species.weighted_confidence + 
                (species.vote_count * 10) + // Bonus por múltiples APIs
                (species.total_confidence / species.vote_count) * 0.5 // Confianza promedio
            );
            
            species.average_confidence = Math.round(species.total_confidence / species.vote_count);
            species.final_confidence = Math.min(100, Math.round(species.consensus_score));
            
            return species;
        });
        
        // Ordenar por score de consenso
        return rankedResults.sort((a, b) => b.consensus_score - a.consensus_score);
    }

    // Crear resumen de la consulta
    createConsultationSummary(apiResults, finalResults) {
        const summary = {
            apis_used: {},
            total_raw_results: 0,
            unified_results: finalResults.length,
            consensus_found: finalResults.length > 0 && finalResults[0].vote_count > 1
        };
        
        Object.keys(apiResults).forEach(apiName => {
            const result = apiResults[apiName];
            summary.apis_used[apiName] = {
                success: result.success,
                results_count: result.count,
                error: result.error || null
            };
            summary.total_raw_results += result.count;
        });
        
        return summary;
    }

    // Obtener APIs habilitadas
    getEnabledAPIs() {
        return this.apiPriorities
            .filter(config => config.enabled)
            .map(config => ({
                name: config.name,
                weight: config.weight,
                status: config.enabled ? '✅' : '❌'
            }));
    }

    // Obtener estadísticas completas
    async getFullStats() {
        const stats = {
            unified_system: {
                name: 'Sistema Unificado de Identificación',
                version: '1.0.0',
                apis_count: this.apiPriorities.filter(c => c.enabled).length
            },
            apis: {}
        };
        
        // Obtener stats de cada API
        for (const config of this.apiPriorities) {
            if (config.enabled && config.api.getStats) {
                stats.apis[config.name] = {
                    ...config.api.getStats(),
                    weight: config.weight,
                    enabled: config.enabled
                };
            }
        }
        
        return stats;
    }

    // Formatear resultado para respuesta del bot
    formatForBot(identificationResult) {
        if (!identificationResult.results || identificationResult.results.length === 0) {
            return {
                found: false,
                message: '❌ No pude identificar esta planta con ninguna de las APIs disponibles.',
                details: `🔍 APIs consultadas: ${identificationResult.apis_consulted}\n📊 Total de resultados: ${identificationResult.total_results}`
            };
        }
        
        const topResult = identificationResult.results[0];
        const hasConsensus = topResult.vote_count > 1;
        
        let message = `🌿 **IDENTIFICACIÓN ${hasConsensus ? 'CON CONSENSO' : 'INDIVIDUAL'}**\n\n`;
        
        // Resultado principal
        message += `📋 **${topResult.scientific_name}**\n`;
        message += `🏷️ ${topResult.common_name}\n`;
        message += `👨‍🔬 Familia: ${topResult.family}\n`;
        message += `🎯 Confianza: ${topResult.final_confidence}%\n`;
        message += `🗳️ Consenso: ${topResult.vote_count} API${topResult.vote_count > 1 ? 's' : ''}\n\n`;
        
        // Fuentes
        message += `📊 **FUENTES:**\n`;
        topResult.sources.forEach(source => {
            message += `• ${source.api}: ${source.confidence}%\n`;
        });
        
        // Alternativas si hay consenso bajo
        if (identificationResult.results.length > 1 && !hasConsensus) {
            message += `\n🤔 **ALTERNATIVAS:**\n`;
            identificationResult.results.slice(1, 3).forEach((alt, i) => {
                message += `${i + 2}. ${alt.scientific_name} (${alt.final_confidence}%)\n`;
            });
        }
        
        // Resumen técnico
        message += `\n🔧 APIs: ${identificationResult.apis_consulted} | Resultados: ${identificationResult.total_results}`;
        
        return {
            found: true,
            message: message,
            scientific_name: topResult.scientific_name,
            common_name: topResult.common_name,
            confidence: topResult.final_confidence,
            consensus: hasConsensus,
            sources: topResult.sources.length
        };
    }
}

module.exports = UnifiedPlantIdentifier;