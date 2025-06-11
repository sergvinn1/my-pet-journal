require('dotenv').config(); // Завантажуємо змінні оточення з .env

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose'); // Підключаємо Mongoose

const app = express();
const PORT = process.env.PORT || 3000;

// --- НАЛАШТУВАННЯ БАЗИ ДАНИХ ---
// ЗАМІНІТЬ ЦЕЙ РЯДОК НА ВАШ РЯДОК ПІДКЛЮЧЕННЯ З MONGODB ATLAS
const DB_URI = process.env.MONGODB_URI; // Отримуємо URI з змінних оточення

mongoose.connect(DB_URI)
    .then(() => console.log('Підключено до MongoDB Atlas!'))
    .catch(err => console.error('Помилка підключення до MongoDB:', err));

// Визначаємо схему для подій (як дані будуть виглядати в базі)
const eventSchema = new mongoose.Schema({
    date: { type: String, required: true }, // Дата події
    description: { type: String, required: true }, // Опис події
    // Можна додати інші поля, наприклад:
    // petId: { type: String, required: false }, // Якщо у вас буде кілька тварин
    // type: { type: String, enum: ['vet', 'medicine', 'grooming', 'play'], default: 'play' }
}, { timestamps: true }); // Додає поля createdAt і updatedAt автоматично

// Створюємо модель Event з нашої схеми
// Ця модель буде представляти колекцію 'events' у вашій базі даних
const Event = mongoose.model('Event', eventSchema);

// Додаємо middleware
app.use(express.json());
app.use(cors());

// --- Маршрути (API-точки) ---

// 1. Головна сторінка (просто для тесту)
app.get('/', (req, res) => {
    res.send('Привіт від сервера "Мій Улюбленець"! Сервер працює!');
});

// 2. Маршрут для отримання інформації про улюбленця (залишаємо без змін, бо це статичні дані)
app.get('/api/pet-info', (req, res) => {
    const petInfo = {
        name: "Барсик",
        species: "Кіт",
        breed: "Дворовий",
        age: "2 роки",
        gender: "♂",
        description: "Барсик – дуже грайливий та лагідний кіт, обожнює полювання на іграшкових мишей та довгий сон на сонечку.",
        weight: "4.5 кг"
    };
    res.json(petInfo);
});

// 3. Маршрут для отримання списку подій (Тепер з бази даних)
app.get('/api/events', async (req, res) => {
    try {
        // Знаходимо всі події в колекції 'events'
        const events = await Event.find();
        // Mongoose повертає об'єкти з полем _id, але Frontend чекає 'id'
        // Тому перетворюємо _id на id
        const formattedEvents = events.map(event => ({
            id: event._id.toString(), // Перетворюємо ObjectId на рядок
            date: event.date,
            description: event.description
        }));
        res.json(formattedEvents);
    } catch (error) {
        console.error('Помилка отримання подій:', error);
        res.status(500).json({ message: 'Помилка сервера при отриманні подій.' });
    }
});

// 4. Маршрут для додавання нової події (Тепер в базу даних)
app.post('/api/events', async (req, res) => {
    const { date, description } = req.body;

    if (!date || !description) {
        return res.status(400).json({ message: 'Дата та опис події обов\'язкові.' });
    }

    try {
        // Створюємо новий документ на основі моделі Event
        const newEvent = new Event({ date, description });
        // Зберігаємо його в базу даних
        await newEvent.save();

        // Надсилаємо назад створену подію з її новим _id
        res.status(201).json({
            id: newEvent._id.toString(), // Важливо: відправляємо _id як id
            date: newEvent.date,
            description: newEvent.description
        });
    } catch (error) {
        console.error('Помилка додавання події:', error);
        res.status(500).json({ message: 'Помилка сервера при додаванні події.' });
    }
});

// 5. Маршрут для видалення події (Тепер з бази даних)
app.delete('/api/events/:id', async (req, res) => {
    const eventId = req.params.id; // Це вже _id з бази даних

    try {
        // Знаходимо та видаляємо документ за його _id
        const result = await Event.findByIdAndDelete(eventId);

        if (result) {
            res.status(200).json({ message: 'Подію успішно видалено.' });
        } else {
            res.status(404).json({ message: 'Подію не знайдено.' });
        }
    } catch (error) {
        console.error('Помилка видалення події:', error);
        // Якщо ID неправильного формату, Mongoose також кине помилку, ловимо її тут
        res.status(500).json({ message: 'Помилка сервера при видаленні події. Можливо, невірний ID.' });
    }
});


// Запускаємо сервер
app.listen(PORT, () => {
    console.log(`Сервер запущено на http://localhost:${PORT}`);
    console.log('Тестовий маршрут для інформації про улюбленця: http://localhost:3000/api/pet-info');
    console.log('Тестовий маршрут для подій: http://localhost:3000/api/events');
});