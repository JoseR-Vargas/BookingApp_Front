// ===== COMPONENTE DE TARJETA DE PROFESIONAL =====
// Función de render pura — sin lógica de negocio ni llamadas API.

function renderProfessionalCard(professional) {
  return (
    '<div class="col-md-6 col-lg-4">' +
      '<div class="barber-selection-card"' +
        ' data-professional-id="' + professional.id + '"' +
        ' data-professional-name="' + professional.name + '">' +
        '<div class="barber-avatar"><i class="' + professional.avatar + '"></i></div>' +
        '<h6 class="barber-name">' + professional.name + '</h6>' +
        '<p class="barber-specialty">' + professional.specialty + '</p>' +
        '<div class="barber-info">' +
          '<small class="text-muted"><i class="fas fa-star text-warning"></i> ' + professional.rating + '</small>' +
          '<small class="text-muted ms-2"><i class="fas fa-clock"></i> ' + professional.experience + '</small>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

window.renderProfessionalCard = renderProfessionalCard;
