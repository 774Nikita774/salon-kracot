// Текущие данные для записи
let currentBooking = {
  service: '',
  date: '',
  time: ''
};

// Доступные временные слоты
const TIME_SLOTS = [
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
];

// Получение всех занятых слотов для даты с сервера
async function getBookedSlots(date) {
  try {
    const response = await fetch('/api/orders');
    
    // Проверка на HTML-ответ (ошибку сервера)
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
      const errorText = await response.text();
      console.error('Сервер вернул ошибку вместо JSON:', response.status, errorText.substring(0, 200));
      return [];
    }

    const orders = await response.json();
    return orders
      .filter(order => order.date === date)
      .map(order => order.time);
  } catch (error) {
    console.error('Ошибка загрузки слотов:', error);
    return [];
  }
}

// Обновление доступных временных слотов
async function updateTimeSlots(selectedDate) {
  const timeSelect = document.getElementById('time');
  if (!selectedDate) {
    timeSelect.disabled = true;
    timeSelect.innerHTML = '<option value="">Сначала выберите дату</option>';
    return;
  }
  
  try {
    const bookedSlots = await getBookedSlots(selectedDate);
    timeSelect.disabled = false;
    timeSelect.innerHTML = '<option value="">Выберите время</option>';
    
    TIME_SLOTS.forEach(slot => {
      const isBooked = bookedSlots.includes(slot);
      const option = document.createElement('option');
      option.value = slot;
      option.textContent = slot;
      if (isBooked) {
        option.disabled = true;
        option.textContent += ' (занято)';
      }
      timeSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Ошибка загрузки слотов:', error);
  }
}

// Открытие модального окна
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.showModal();
    document.body.style.overflow = 'hidden';
  }
}

// Закрытие модального окна
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.close();
    document.body.style.overflow = '';
  }
}

// Показ модального окна успеха
function showSuccessModal() {
  openModal('successModal');
  setTimeout(() => {
    closeModal('successModal');
  }, 3000);
}

// Сохранение записи на сервер
async function saveAppointment(booking, clientName, clientPhone) {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: clientName,
      phone: clientPhone,
      service: booking.service,
      date: booking.date,
      time: booking.time
    })
  });
  
const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    console.error('Сервер вернул не JSON:', text.substring(0, 200));
    throw new Error('Ошибка сервера. Пожалуйста, попробуйте позже.');
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Ошибка при сохранении');
  }

  return await response.json();
}

// Проверка, занято ли время
async function isTimeSlotBooked(date, time) {
  const bookedSlots = await getBookedSlots(date);
  return bookedSlots.includes(time);
}

// Инициализация страницы
async function initBookingPage() {
  // Установка минимальной даты (сегодня)
  const dateInput = document.getElementById('date');
  const today = new Date().toISOString().split('T')[0];
  dateInput.min = today;
  
  // Обработчик изменения даты
  dateInput.addEventListener('change', async (e) => {
    currentBooking.date = e.target.value;
    await updateTimeSlots(currentBooking.date);
  });
  
  // Обработчик изменения времени
  const timeSelect = document.getElementById('time');
  timeSelect.addEventListener('change', (e) => {
    currentBooking.time = e.target.value;
  });
  
  // Обработчик изменения услуги
  const serviceSelect = document.getElementById('service');
  serviceSelect.addEventListener('change', (e) => {
    currentBooking.service = e.target.value;
  });
  
  // Обработчик отправки формы бронирования
  const bookingForm = document.getElementById('bookingForm');
  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Валидация
    if (!currentBooking.service) {
      alert('Пожалуйста, выберите услугу');
      return;
    }
    if (!currentBooking.date) {
      alert('Пожалуйста, выберите дату');
      return;
    }
    if (!currentBooking.time) {
      alert('Пожалуйста, выберите время');
      return;
    }
    
    // Проверка, не занято ли время (повторная проверка)
    const isBooked = await isTimeSlotBooked(currentBooking.date, currentBooking.time);
    if (isBooked) {
      alert('К сожалению, это время уже занято. Пожалуйста, выберите другое время.');
      await updateTimeSlots(currentBooking.date);
      return;
    }
    
    // Открываем модальное окно для ввода контактных данных
    openModal('contactModal');
  });
  
  // Обработчик формы контактов
  const contactForm = document.getElementById('contactForm');
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const clientName = document.getElementById('clientName').value.trim();
    const clientPhone = document.getElementById('clientPhone').value.trim();
    
    if (!clientName || !clientPhone) {
      alert('Пожалуйста, заполните все поля');
      return;
    }
    
    // Проверка телефона (простая валидация)
    const phoneRegex = /^[\d\s\+\-\(\)]{10,}$/;
    if (!phoneRegex.test(clientPhone)) {
      alert('Пожалуйста, введите корректный номер телефона');
      return;
    }
    
    try {
      // Повторная проверка перед сохранением
      const isBooked = await isTimeSlotBooked(currentBooking.date, currentBooking.time);
      if (isBooked) {
        alert('Время уже занято. Пожалуйста, выберите другое время.');
        closeModal('contactModal');
        await updateTimeSlots(currentBooking.date);
        return;
      }
      
      // Сохраняем запись на сервер
      await saveAppointment(currentBooking, clientName, clientPhone);
      
      // Очищаем форму
      closeModal('contactModal');
      contactForm.reset();
      
      // Сбрасываем текущую запись
      currentBooking = { service: '', date: '', time: '' };
      document.getElementById('bookingForm').reset();
      document.getElementById('time').innerHTML = '<option value="">Сначала выберите дату</option>';
      document.getElementById('time').disabled = true;
      
      // Показываем модалку успеха
      showSuccessModal();
      
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert(error.message || 'Произошла ошибка при сохранении. Пожалуйста, попробуйте снова.');
    }
  });
}

// Запуск при загрузке страницы
document.addEventListener('DOMContentLoaded', initBookingPage);
