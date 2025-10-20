// Sistema de Recordatorios Personales para el Dueño
// Solo funciona para el número 5214777244259

const fs = require('fs').promises;
const path = require('path');

class ReminderSystem {
    constructor() {
        this.ownerPhone = '5214777244259@c.us';
        this.remindersFile = path.join(__dirname, '../../storage/reminders.json');
        this.reminders = [];
        this.activeTimers = new Map();
        
        // Cargar recordatorios existentes
        this.loadReminders();
        
        console.log('⏰ Sistema de Recordatorios inicializado');
    }

    // Cargar recordatorios desde archivo
    async loadReminders() {
        try {
            const data = await fs.readFile(this.remindersFile, 'utf8');
            this.reminders = JSON.parse(data);
            console.log(`📋 Cargados ${this.reminders.length} recordatorios`);
            
            // Reactivar recordatorios pendientes
            this.scheduleActiveReminders();
            
        } catch (error) {
            console.log('📝 Creando archivo de recordatorios nuevo');
            this.reminders = [];
            await this.saveReminders();
        }
    }

    // Guardar recordatorios en archivo
    async saveReminders() {
        try {
            // Crear directorio si no existe
            const dir = path.dirname(this.remindersFile);
            await fs.mkdir(dir, { recursive: true });
            
            await fs.writeFile(this.remindersFile, JSON.stringify(this.reminders, null, 2));
            console.log('💾 Recordatorios guardados');
        } catch (error) {
            console.error('❌ Error guardando recordatorios:', error);
        }
    }

    // Parsear comando de recordatorio
    parseReminderCommand(commandText) {
        // Formatos soportados:
        // !recordatorio 25/12/2024 15:30 Comprar regalos de navidad
        // !recordatorio mañana 10:00 Reunión importante
        // !recordatorio 17/10/2025 14:00 Llamar al doctor
        
        const parts = commandText.split(' ');
        if (parts.length < 4) {
            return { error: 'Formato incorrecto. Usa: !recordatorio FECHA HORA MENSAJE' };
        }

        const dateStr = parts[1];
        const timeStr = parts[2];
        const message = parts.slice(3).join(' ');

        try {
            const targetDate = this.parseDate(dateStr, timeStr);
            
            if (targetDate <= new Date()) {
                return { error: 'La fecha debe ser en el futuro, no seas pendejo' };
            }

            return {
                date: targetDate,
                message: message,
                dateStr: dateStr,
                timeStr: timeStr
            };
            
        } catch (error) {
            return { error: `Error en fecha/hora: ${error.message}` };
        }
    }

    // Parsear fecha y hora
    parseDate(dateStr, timeStr) {
        let targetDate;

        // Manejar "hoy", "mañana", etc.
        if (dateStr.toLowerCase() === 'hoy') {
            targetDate = new Date();
        } else if (dateStr.toLowerCase() === 'mañana') {
            targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + 1);
        } else if (dateStr.toLowerCase() === 'pasado') {
            targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + 2);
        } else {
            // Formato DD/MM/YYYY
            const [day, month, year] = dateStr.split('/');
            if (!day || !month || !year) {
                throw new Error('Formato de fecha debe ser DD/MM/YYYY');
            }
            targetDate = new Date(year, month - 1, day);
        }

        // Parsear hora (HH:MM)
        const [hours, minutes] = timeStr.split(':');
        if (!hours || !minutes) {
            throw new Error('Formato de hora debe ser HH:MM');
        }

        targetDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        if (isNaN(targetDate.getTime())) {
            throw new Error('Fecha/hora inválida');
        }

        return targetDate;
    }

    // Crear nuevo recordatorio
    async createReminder(commandText, whatsappClient) {
        const parsed = this.parseReminderCommand(commandText);
        
        if (parsed.error) {
            return `❌ ${parsed.error}

🔥 **FORMATO CORRECTO:**
!recordatorio DD/MM/YYYY HH:MM mensaje
!recordatorio mañana 15:30 mensaje
!recordatorio hoy 20:00 mensaje

💡 **EJEMPLOS:**
!recordatorio 25/12/2024 09:00 Abrir regalos
!recordatorio mañana 10:30 Juntar con el jefe
!recordatorio 20/10/2025 14:00 Cita médica`;
        }

        const reminder = {
            id: Date.now().toString(),
            targetDate: parsed.date,
            message: parsed.message,
            dateStr: parsed.dateStr,
            timeStr: parsed.timeStr,
            created: new Date(),
            completed: false,
            notifications: {
                fourHours: false,
                oneHour: false,
                tenMinutes: false,
                exact: false
            }
        };

        this.reminders.push(reminder);
        await this.saveReminders();
        
        // Programar notificaciones
        this.scheduleReminder(reminder, whatsappClient);
        
        const timeUntil = this.getTimeUntil(parsed.date);
        
        return `✅ **RECORDATORIO CREADO** ⏰

📅 **Fecha:** ${parsed.dateStr} a las ${parsed.timeStr}
📝 **Mensaje:** ${parsed.message}
⏳ **Falta:** ${timeUntil}

🔔 **Te recordaré:**
• 4 horas antes
• 1 hora antes  
• 10 minutos antes
• En el momento exacto

💀 ¡No se te va a olvidar cabrón!`;
    }

    // Programar recordatorio con todas sus notificaciones
    scheduleReminder(reminder, whatsappClient) {
        const targetTime = new Date(reminder.targetDate).getTime();
        const now = Date.now();

        // Limpiar timers existentes para este recordatorio
        if (this.activeTimers.has(reminder.id)) {
            const timers = this.activeTimers.get(reminder.id);
            timers.forEach(timer => clearTimeout(timer));
        }

        const timers = [];

        // 4 horas antes
        const fourHoursBefore = targetTime - (4 * 60 * 60 * 1000);
        if (fourHoursBefore > now && !reminder.notifications.fourHours) {
            const timer = setTimeout(() => {
                this.sendNotification(whatsappClient, reminder, '4 horas');
                reminder.notifications.fourHours = true;
                this.saveReminders();
            }, fourHoursBefore - now);
            timers.push(timer);
        }

        // 1 hora antes
        const oneHourBefore = targetTime - (60 * 60 * 1000);
        if (oneHourBefore > now && !reminder.notifications.oneHour) {
            const timer = setTimeout(() => {
                this.sendNotification(whatsappClient, reminder, '1 hora');
                reminder.notifications.oneHour = true;
                this.saveReminders();
            }, oneHourBefore - now);
            timers.push(timer);
        }

        // 10 minutos antes
        const tenMinutesBefore = targetTime - (10 * 60 * 1000);
        if (tenMinutesBefore > now && !reminder.notifications.tenMinutes) {
            const timer = setTimeout(() => {
                this.sendNotification(whatsappClient, reminder, '10 minutos');
                reminder.notifications.tenMinutes = true;
                this.saveReminders();
            }, tenMinutesBefore - now);
            timers.push(timer);
        }

        // En el momento exacto
        if (targetTime > now && !reminder.notifications.exact) {
            const timer = setTimeout(() => {
                this.sendNotification(whatsappClient, reminder, 'AHORA');
                reminder.notifications.exact = true;
                reminder.completed = true;
                this.saveReminders();
            }, targetTime - now);
            timers.push(timer);
        }

        if (timers.length > 0) {
            this.activeTimers.set(reminder.id, timers);
            console.log(`⏰ Programado recordatorio ${reminder.id} con ${timers.length} notificaciones`);
        }
    }

    // Enviar notificación
    async sendNotification(whatsappClient, reminder, timeType) {
        try {
            let message;
            
            if (timeType === 'AHORA') {
                message = `🚨 **¡ES HORA CABRÓN!** ⏰

🔥 **RECORDATORIO:**
📝 ${reminder.message}

⏰ **Era para AHORA mismo**
📅 ${reminder.dateStr} a las ${reminder.timeStr}

💥 ¡NO LO OLVIDES! ¡HAZLO YA!`;
            } else {
                message = `⏰ **RECORDATORIO - ${timeType.toUpperCase()} ANTES** 🔔

📝 **Mensaje:** ${reminder.message}
📅 **Fecha:** ${reminder.dateStr} a las ${reminder.timeStr}
⏳ **Faltan:** ${timeType}

🎯 ¡Prepárate cabrón! ¡Ya casi es la hora!`;
            }

            await whatsappClient.sendMessage(this.ownerPhone, message);
            console.log(`🔔 Notificación enviada: ${timeType} - ${reminder.message}`);
            
        } catch (error) {
            console.error('❌ Error enviando notificación:', error);
        }
    }

    // Reactivar recordatorios al cargar
    scheduleActiveReminders() {
        let activeCount = 0;
        
        this.reminders
            .filter(r => !r.completed && new Date(r.targetDate) > new Date())
            .forEach(reminder => {
                // La función scheduleReminder necesita el cliente, lo programaremos cuando esté disponible
                activeCount++;
            });
            
        if (activeCount > 0) {
            console.log(`⏰ Se reactivarán ${activeCount} recordatorios pendientes`);
        }
    }

    // Inicializar con cliente de WhatsApp
    initializeWithClient(whatsappClient) {
        this.reminders
            .filter(r => !r.completed && new Date(r.targetDate) > new Date())
            .forEach(reminder => {
                this.scheduleReminder(reminder, whatsappClient);
            });
    }

    // Listar recordatorios
    listReminders() {
        const active = this.reminders.filter(r => !r.completed && new Date(r.targetDate) > new Date());
        const completed = this.reminders.filter(r => r.completed);
        
        if (active.length === 0) {
            return '📋 **NO TIENES RECORDATORIOS ACTIVOS**\n\n🔥 ¡Crea uno con !recordatorio!';
        }

        let message = '📋 **TUS RECORDATORIOS ACTIVOS** ⏰\n\n';
        
        active.forEach((reminder, index) => {
            const timeUntil = this.getTimeUntil(new Date(reminder.targetDate));
            message += `${index + 1}. 📅 **${reminder.dateStr} ${reminder.timeStr}**\n`;
            message += `   📝 ${reminder.message}\n`;
            message += `   ⏳ Falta: ${timeUntil}\n\n`;
        });

        if (completed.length > 0) {
            message += `\n✅ **Completados:** ${completed.length}`;
        }

        return message;
    }

    // Calcular tiempo restante
    getTimeUntil(targetDate) {
        const now = new Date();
        const diff = targetDate - now;
        
        if (diff <= 0) return 'Ya pasó';
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) return `${days}d ${hours}h ${minutes}m`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    }

    // Eliminar recordatorio
    async deleteReminder(index) {
        const activeReminders = this.reminders.filter(r => !r.completed && new Date(r.targetDate) > new Date());
        
        if (index < 1 || index > activeReminders.length) {
            return '❌ Número de recordatorio inválido';
        }

        const reminderToDelete = activeReminders[index - 1];
        
        // Cancelar timers
        if (this.activeTimers.has(reminderToDelete.id)) {
            const timers = this.activeTimers.get(reminderToDelete.id);
            timers.forEach(timer => clearTimeout(timer));
            this.activeTimers.delete(reminderToDelete.id);
        }

        // Marcar como completado (no eliminar para historial)
        reminderToDelete.completed = true;
        await this.saveReminders();

        return `🗑️ **RECORDATORIO ELIMINADO**\n📝 ${reminderToDelete.message}\n📅 ${reminderToDelete.dateStr} ${reminderToDelete.timeStr}`;
    }

    // Procesar comando
    async processCommand(commandText, whatsappClient) {
        const parts = commandText.split(' ');
        const subCommand = parts[1];

        if (!subCommand || subCommand.match(/^\d/)) {
            // Es un comando de crear recordatorio
            return await this.createReminder(commandText, whatsappClient);
        }

        switch (subCommand.toLowerCase()) {
            case 'lista':
            case 'list':
                return this.listReminders();
                
            case 'eliminar':
            case 'delete':
                const index = parseInt(parts[2]);
                return await this.deleteReminder(index);
                
            case 'help':
            case 'ayuda':
                return `🔥 **COMANDOS DE RECORDATORIOS**

**Crear recordatorio:**
!recordatorio DD/MM/YYYY HH:MM mensaje
!recordatorio mañana 15:30 mensaje
!recordatorio hoy 20:00 mensaje

**Gestionar:**
!recordatorio lista - Ver todos
!recordatorio eliminar [número] - Borrar
!recordatorio ayuda - Esta ayuda

**Ejemplos:**
!recordatorio 25/12/2024 09:00 Abrir regalos
!recordatorio mañana 10:30 Reunión jefe
!recordatorio eliminar 1

💀 ¡Te recordaré hasta que lo hagas!`;

            default:
                return '❌ Comando no reconocido. Usa !recordatorio ayuda';
        }
    }
}

module.exports = ReminderSystem;