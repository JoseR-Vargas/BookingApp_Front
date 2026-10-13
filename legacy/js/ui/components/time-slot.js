// ===== COMPONENTE DE SLOT DE TIEMPO =====
// Función de render pura para opciones de horario.

function renderTimeSlot(timeString, isBooked) {
  if (isBooked) {
    return '<option value="' + timeString + '" disabled>' + timeString + ' — Ocupado</option>';
  }
  return '<option value="' + timeString + '">' + timeString + '</option>';
}

window.renderTimeSlot = renderTimeSlot;
