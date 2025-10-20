const fs = require('fs');
const path = require('path');

class InventoryManager {
    constructor() {
        this.inventoryFile = path.join(__dirname, 'data/inventory.json');
        this.inventory = this.loadInventory();
        this.ownerPhone = '5214777244259@c.us'; // Tu número para comandos de inventario
    }

    loadInventory() {
        try {
            if (fs.existsSync(this.inventoryFile)) {
                const data = fs.readFileSync(this.inventoryFile, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('❌ Error cargando inventario:', error);
        }
        
        // Inventario inicial
        return {
            plantas: {
                malva: { precio: 25, cantidad: 0, descripcion: 'Malva medicinal', foto: null },
                ruda: { precio: 35, cantidad: 0, descripcion: 'Ruda aromática', foto: null },
                perejil: { precio: 35, cantidad: 0, descripcion: 'Perejil fresco', foto: null },
                cilantro: { precio: 30, cantidad: 0, descripcion: 'Cilantro aromático', foto: null },
                albahaca: { precio: 40, cantidad: 0, descripcion: 'Albahaca dulce', foto: null },
                romero: { precio: 45, cantidad: 0, descripcion: 'Romero aromático', foto: null },
                citronela: { precio: 50, cantidad: 0, descripcion: 'Citronela repelente', foto: null }
            },
            macetas: {
                chica: { precio: 15, cantidad: 0, descripcion: 'Maceta chica (10cm)', foto: null },
                mediana: { precio: 30, cantidad: 0, descripcion: 'Maceta mediana (20cm)', foto: null },
                grande: { precio: 50, cantidad: 0, descripcion: 'Maceta grande (30cm)', foto: null }
            },
            lastUpdate: new Date().toISOString(),
            totalValue: 0
        };
    }

    saveInventory() {
        try {
            const dir = path.dirname(this.inventoryFile);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            // Calcular valor total
            this.inventory.totalValue = this.calculateTotalValue();
            this.inventory.lastUpdate = new Date().toISOString();
            
            fs.writeFileSync(this.inventoryFile, JSON.stringify(this.inventory, null, 2));
            console.log('💾 Inventario guardado');
        } catch (error) {
            console.error('❌ Error guardando inventario:', error);
        }
    }

    calculateTotalValue() {
        let total = 0;
        Object.values(this.inventory.plantas).forEach(item => {
            total += item.precio * item.cantidad;
        });
        Object.values(this.inventory.macetas).forEach(item => {
            total += item.precio * item.cantidad;
        });
        return total;
    }

    // Comando: "SURTIR malva 20" 
    addStock(itemName, quantity, userPhone) {
        if (userPhone !== this.ownerPhone) {
            return '🚫 Solo el dueño puede actualizar inventario';
        }

        const normalizedName = itemName.toLowerCase().replace(/_/g, '');
        let category = null;
        let item = null;

        // Buscar en plantas
        if (this.inventory.plantas[normalizedName]) {
            category = 'plantas';
            item = normalizedName;
        }
        // Buscar en macetas
        else if (this.inventory.macetas[normalizedName]) {
            category = 'macetas';
            item = normalizedName;
        }
        // Buscar por coincidencia parcial
        else {
            for (let cat of ['plantas', 'macetas']) {
                for (let key of Object.keys(this.inventory[cat])) {
                    if (key.includes(normalizedName) || normalizedName.includes(key)) {
                        category = cat;
                        item = key;
                        break;
                    }
                }
                if (item) break;
            }
        }

        if (!item) {
            return `❌ No encontré "${itemName}" en el inventario\n📋 Disponibles: ${this.getAvailableItems()}`;
        }

        const oldQuantity = this.inventory[category][item].cantidad;
        this.inventory[category][item].cantidad += parseInt(quantity);
        this.saveInventory();

        const itemInfo = this.inventory[category][item];
        return `✅ Stock actualizado:\n🌱 ${itemInfo.descripcion}\n📊 Antes: ${oldQuantity} | Ahora: ${itemInfo.cantidad}\n💰 Valor agregado: $${itemInfo.precio * quantity}`;
    }

    getStock() {
        let stockText = '📊 **INVENTARIO ACTUAL**\n\n🌱 **PLANTAS:**\n';
        
        Object.entries(this.inventory.plantas).forEach(([name, info]) => {
            const status = info.cantidad === 0 ? '❌' : info.cantidad < 5 ? '⚠️' : '✅';
            stockText += `${status} ${info.descripcion}: ${info.cantidad} unidades ($${info.precio} c/u)\n`;
        });

        stockText += '\n🏺 **MACETAS:**\n';
        Object.entries(this.inventory.macetas).forEach(([name, info]) => {
            const status = info.cantidad === 0 ? '❌' : info.cantidad < 3 ? '⚠️' : '✅';
            stockText += `${status} ${info.descripcion}: ${info.cantidad} unidades ($${info.precio} c/u)\n`;
        });

        stockText += `\n💰 **Valor total inventario:** $${this.inventory.totalValue}`;
        stockText += `\n📅 **Última actualización:** ${new Date(this.inventory.lastUpdate).toLocaleDateString('es-MX')}`;

        return stockText;
    }

    getAvailableItems() {
        const plantas = Object.keys(this.inventory.plantas).join(', ');
        const macetas = Object.keys(this.inventory.macetas).join(', ');
        return `Plantas: ${plantas}\nMacetas: ${macetas}`;
    }

    // Verificar si un usuario puede usar comandos de inventario
    isOwner(userPhone) {
        console.log(`🔍 Verificando dueño: ${userPhone} vs ${this.ownerPhone}`);
        const isOwnerResult = userPhone === this.ownerPhone;
        console.log(`👑 Es dueño: ${isOwnerResult ? 'SÍ' : 'NO'}`);
        return isOwnerResult;
    }

    // Procesar comandos de inventario
    processInventoryCommand(message, userPhone) {
        const text = message.toUpperCase();
        
        // SURTIR item cantidad
        if (text.startsWith('SURTIR ')) {
            const parts = text.split(' ');
            if (parts.length >= 3) {
                const item = parts[1];
                const quantity = parts[2];
                return this.addStock(item, quantity, userPhone);
            }
            return '❌ Formato: SURTIR item cantidad\nEjemplo: SURTIR malva 20';
        }

        // STOCK
        if (text === 'STOCK' || text === 'INVENTARIO') {
            return this.getStock();
        }

        return null; // No es comando de inventario
    }
}

module.exports = InventoryManager;