// ===== COMPONENTE DE TABLA DE RESERVAS =====
// Funciones de render puras para filas de la tabla de reservas admin.

function formatBookingDate(dateString) {
  var parts = dateString.split('-');
  var date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  return date.toLocaleDateString('es-ES', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function renderBookingRow(booking) {
  var professionalName = (booking.professional && booking.professional.name)
    || (booking.barber && booking.barber.name)
    || 'N/A';
  var dateFormatted = formatBookingDate(booking.date);
  var notesHtml = booking.notes
    ? '<div class="notes-cell" title="' + booking.notes + '"><span class="notes-text">' + booking.notes + '</span></div>'
    : '<span class="text-muted">Sin notas</span>';

  return (
    '<tr>' +
      '<td>#' + booking._id.slice(-6) + '</td>' +
      '<td>' +
        '<div>' +
          '<strong>' + booking.client.name + '</strong><br>' +
          '<small class="text-muted">' + booking.client.email + '</small>' +
        '</div>' +
      '</td>' +
      '<td><strong>' + (booking.client.phone || 'N/A') + '</strong></td>' +
      '<td>' +
        '<div>' +
          '<strong>' + booking.service.name + '</strong><br>' +
          '<small class="text-muted">$' + booking.service.price + '</small>' +
        '</div>' +
      '</td>' +
      '<td>' + dateFormatted + '</td>' +
      '<td>' + booking.time + '</td>' +
      '<td>' + professionalName + '</td>' +
      '<td>' + notesHtml + '</td>' +
      '<td>' +
        '<button class="btn btn-danger btn-sm"' +
          ' onclick="adminApp.deleteBooking(\'' + booking._id + '\', \'' + booking.client.name + '\')"' +
          ' title="Eliminar reserva">' +
          '<i class="fas fa-trash"></i>' +
        '</button>' +
      '</td>' +
    '</tr>'
  );
}

window.renderBookingRow = renderBookingRow;
window.formatBookingDate = formatBookingDate;
