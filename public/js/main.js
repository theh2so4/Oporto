// Función para formatear números como moneda
function formatCurrency(amount) {
  return '€' + parseFloat(amount).toFixed(2);
}

// Función para actualizar el reloj en tiempo real (si existe)
function updateClock() {
  const clockElement = document.getElementById('reloj');
  if (clockElement) {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    clockElement.textContent = `${hours}:${minutes}:${seconds}`;
  }
}

// Iniciar reloj si existe el elemento
document.addEventListener('DOMContentLoaded', function() {
  updateClock();
  setInterval(updateClock, 1000);
  
  // Búsqueda de clientes en tiempo real (para ventas)
  const clienteSearch = document.getElementById('cliente-search');
  if (clienteSearch) {
    clienteSearch.addEventListener('input', function() {
      if (this.value.length >= 2) {
        fetch(`/clientes/buscar?q=${this.value}`)
          .then(response => response.json())
          .then(data => {
            const resultsContainer = document.getElementById('cliente-results');
            resultsContainer.innerHTML = '';
            
            data.forEach(cliente => {
              const div = document.createElement('div');
              div.className = 'cliente-result';
              div.textContent = cliente.nombre;
              div.dataset.id = cliente._id;
              div.addEventListener('click', function() {
                document.getElementById('cliente_id').value = this.dataset.id;
                clienteSearch.value = this.textContent;
                resultsContainer.innerHTML = '';
              });
              resultsContainer.appendChild(div);
            });
          })
          .catch(error => console.error('Error:', error));
      }
    });
  }
});
