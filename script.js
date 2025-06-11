// --- Завдання 1: Зміна Імені Улюбленця по Кліку (залишаємо, але ім'я буде завантажуватись з сервера) ---
const petNameElement = document.getElementById('pet-name');
let currentPetName; // Тепер ім'я буде встановлюватися з сервера

if (petNameElement) {
    petNameElement.addEventListener('click', function() {
        // Для спрощення, поки не будемо міняти його на інше ім'я, а просто виведемо в консоль
        console.log(`Клік на ім'я. Поточне ім'я: ${currentPetName}`);
        // Пізніше тут можна додати логіку зміни імені через PUT-запит до сервера
    });
}


// --- Завдання 2: "Підсвічування" Швидких Фактів при Наведенні Мишки (без змін) ---
const factItems = document.querySelectorAll('.fact-item');

factItems.forEach(item => {
    item.addEventListener('mouseenter', function() {
        item.classList.add('highlight');
    });

    item.addEventListener('mouseleave', function() {
        item.classList.remove('highlight');
    });
});


// --- НОВЕ: Завдання 3: Модальне Вікно та ВЗАЄМОДІЯ З BACKEND ---

// 1. Знаходимо всі необхідні елементи DOM
const addEventButton = document.getElementById('add-event-button');
const addEventModal = document.getElementById('add-event-modal');
const closeButton = document.querySelector('.close-button');
const eventForm = document.getElementById('event-form');
const eventDateInput = document.getElementById('event-date-input');
const eventDescriptionInput = document.getElementById('event-description-input');
const eventListContainer = document.getElementById('event-list'); // Контейнер, куди додаємо події
const quickFactsGrid = document.querySelector('.quick-facts-grid');
const petSpeciesBreedElement = document.querySelector('.pet-species-breed');
const petAgeGenderElement = document.querySelector('.pet-age-gender');
const petDescriptionElement = document.querySelector('.pet-description');


// Базовий URL нашого Backend-сервера
const API_BASE_URL = 'https://pet-journal-backend-api.onrender.com';

// Функція для форматування дати з YYYY-MM-DD в DD.MM.YYYY
// Функція для форматування дати з YYYY-MM-DD в DD.MM.YYYY
function formatDate(dateString) {
    if (!dateString) return '';
    // Якщо дата вже в DD.MM.YYYY, не змінюємо (це може статися, якщо дані прийшли зі старим форматом)
    if (dateString.includes('.')) return dateString; 

    // Створюємо об'єкт Date для форматування
    const date = new Date(dateString + 'T00:00:00'); // Додаємо 'T00:00:00' для уникнення проблем з часовими поясами
    if (isNaN(date.getTime())) { // Перевірка, чи коректна дата
        return dateString; // Якщо дата невалідна, повертаємо оригінал
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Місяці від 0 до 11
    const year = date.getFullYear();

    return `${day}.${month}.${year}`;
}


// Функція для відображення подій на сторінці
async function renderEvents(events) {
    eventListContainer.innerHTML = ''; // Очищаємо список перед відображенням
    if (events.length === 0) {
        eventListContainer.innerHTML = '<p class="no-events-message">Подій ще немає. Додайте першу!</p>';
        return;
    }

    // Сортуємо події за датою у зворотному порядку (найновіші зверху)
    // Перетворюємо дату у формат YYYY-MM-DD для коректного порівняння
    const sortedEvents = [...events].sort((a, b) => {
        const dateA = a.date.split('.').reverse().join('-'); // Перетворюємо 01.06.2025 в 2025-06-01
        const dateB = b.date.split('.').reverse().join('-');
        return new Date(dateB) - new Date(dateA);
    });


    sortedEvents.forEach(event => {
        const newEventItem = document.createElement('div');
        newEventItem.classList.add('event-item');
        newEventItem.dataset.id = event.id;

        newEventItem.innerHTML = `
            <span class="event-date">${formatDate(event.date)}</span>
            <p>${event.description}</p>
            <button class="delete-event-btn" data-id="${event.id}">&times;</button>
        `;
        eventListContainer.appendChild(newEventItem); // Додаємо в кінець, бо вже відсортували
    });

    // Додаємо слухачів для кнопок видалення (ПІСЛЯ того, як елементи додані!)
    document.querySelectorAll('.delete-event-btn').forEach(button => {
        button.addEventListener('click', async function(e) {
            const eventIdToDelete = e.target.dataset.id;
            await deleteEvent(eventIdToDelete); // Викликаємо функцію видалення на сервері
        });
    });
}

// --- Нові функції для взаємодії з Backend ---

// 1. Завантаження інформації про улюбленця
async function loadPetInfo() {
    try {
        const response = await fetch(`${API_BASE_URL}/pet-info`); // GET-запит до сервера
        if (!response.ok) { // Перевірка, чи успішна відповідь (статус 200)
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json(); // Парсимо відповідь як JSON

        // Оновлюємо елементи на сторінці даними з сервера
        if (petNameElement) petNameElement.textContent = data.name;
        currentPetName = data.name; // Зберігаємо ім'я для подальшого використання
        if (petSpeciesBreedElement) petSpeciesBreedElement.textContent = `${data.species}, ${data.breed}`;
        if (petAgeGenderElement) petAgeGenderElement.textContent = `${data.age}, ${data.gender}`;
        if (petDescriptionElement) petDescriptionElement.textContent = data.description;

        // Оновлення "Швидких фактів" (поки вручну, але можна зробити динамічніше)
        // Можна також додати дані з сервера, якщо вони є.
        // Наприклад, припустимо, сервер повертає вагу:
        const weightFactSpan = document.querySelector('.fact-item span');
        if (weightFactSpan && data.weight) {
            weightFactSpan.textContent = data.weight;
        }

    } catch (error) {
        console.error('Помилка завантаження інформації про улюбленця:', error);
        // Можна показати повідомлення користувачу про помилку
        // eventListContainer.innerHTML = '<p class="error-message">Не вдалося завантажити інформацію про улюбленця.</p>';
    }
}

// 2. Завантаження подій
async function loadEvents() {
    try {
        eventListContainer.innerHTML = '<p class="no-events-message">Завантаження подій...</p>'; // Показ завантаження
        const response = await fetch(`${API_BASE_URL}/events`); // GET-запит до сервера
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const events = await response.json(); // Отримуємо список подій
        renderEvents(events); // Відображаємо їх на сторінці
    } catch (error) {
        console.error('Помилка завантаження подій:', error);
        eventListContainer.innerHTML = '<p class="no-events-message">Не вдалося завантажити події.</p>';
    }
}

// 3. Додавання нової події (POST-запит)
async function addEvent(date, description) {
    try {
        const response = await fetch(`${API_BASE_URL}/events`, {
            method: 'POST', // Метод HTTP-запиту
            headers: {
                'Content-Type': 'application/json' // Важливо: вказуємо, що надсилаємо JSON
            },
            body: JSON.stringify({ date, description }) // Надсилаємо дані у форматі JSON
        });

        if (!response.ok) {
            const errorText = await response.text(); // Читаємо відповідь сервера для деталізації
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const newEvent = await response.json(); // Отримуємо створену подію з сервера (з ID)
        console.log('Подія успішно додана на сервер:', newEvent);
        await loadEvents(); // Перезавантажуємо всі події, щоб список оновився
        // alert('Подія додана!'); // Можна замінити на краще сповіщення, якщо не хочеш постійні попи
    } catch (error) {
        console.error('Помилка додавання події:', error);
        alert('Не вдалося додати подію. Спробуйте ще раз: ' + error.message);
    }
}

// 4. Видалення події (DELETE-запит)
async function deleteEvent(idToDelete) {
    try {
        const response = await fetch(`${API_BASE_URL}/events/${idToDelete}`, { // DELETE-запит до конкретного ID
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        console.log(`Подію з ID ${idToDelete} успішно видалено.`);
        await loadEvents(); // Перезавантажуємо список після видалення
    } catch (error) {
        console.error('Помилка видалення події:', error);
        alert('Не вдалося видалити подію. Спробуйте ще раз: ' + error.message);
    }
}


// --- Слухачі Подій ---

// Відкриття модального вікна
// Глобальна змінна для екземпляра Flatpickr, щоб до нього можна було звертатися
let datePickerInstance;

// Відкриття модального вікна
if (addEventButton) {
    addEventButton.addEventListener('click', function() {
        addEventModal.classList.add('active'); // Додаємо клас 'active' для відображення
        eventForm.reset();

        // Ініціалізуємо Flatpickr тут
        // Якщо Flatpickr вже ініціалізований, ми просто оновлюємо його
        if (!datePickerInstance) {
            datePickerInstance = flatpickr("#event-date-input", {
                dateFormat: "Y-m-d", // Формат, який буде відправлятися на сервер
                locale: "uk", // Використовуємо українську локаль
                // Додаткові опції, якщо потрібні, наприклад:
                // minDate: "today", // Заборонити вибір дат у минулому
                // disable: ["2025-07-04"], // Заборонити конкретні дати
            });
        }
        // Встановлюємо сьогоднішню дату за замовчуванням для Flatpickr
        datePickerInstance.setDate(new Date(), true); // true для перемикання місяця/року
    });
}

// Закриття модального вікна при кліку на хрестик
if (closeButton) {
    closeButton.addEventListener('click', function() {
        addEventModal.classList.remove('active'); // Видаляємо клас 'active' для приховування
    });
}

// Закриття модального вікна при кліку поза ним (на затемнений фон)
if (addEventModal) {
    window.addEventListener('click', function(event) {
        if (event.target === addEventModal) {
            addEventModal.classList.remove('active');
        }
    });
}

// Обробка відправки форми (додавання події)
if (eventForm) {
    eventForm.addEventListener('submit', async function(e) { // 'async' бо функція викликає асинхронний addEvent
        e.preventDefault(); // Зупиняємо стандартну відправку форми

        const date = eventDateInput.value;
        const description = eventDescriptionInput.value;

        if (date && description) {
            try {
                await addEvent(date, description); // Чекаємо, поки подія додасться на сервер
                addEventModal.classList.remove('active'); // Закриваємо модальне вікно ТІЛЬКИ ПІСЛЯ УСПІХУ
            } catch (error) {
                console.error("Помилка при додаванні події через форму:", error);
                // Повідомлення про помилку вже буде в addEvent
            }
        } else {
            alert('Будь ласка, заповніть усі поля!');
        }
    });
}

// --- Ініціалізація: Завантажуємо дані при першому завантаженні сторінки ---
document.addEventListener('DOMContentLoaded', () => { // Переконаємось, що DOM завантажений
    loadPetInfo(); // Завантажуємо інформацію про улюбленця
    loadEvents(); // Завантажуємо події
});

console.log("JavaScript завантажився і працює, готовий спілкуватися з Backend!");