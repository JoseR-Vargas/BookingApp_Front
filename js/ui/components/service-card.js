// ===== COMPONENTES DE TARJETA DE SERVICIO =====
// Funciones de render puras — sin lógica de negocio ni llamadas API.

function renderServiceCard(service, professionals) {
  const profNames = service.professionals
    .map(function(profId) {
      const prof = professionals.find(function(p) { return p.id === profId; });
      return prof ? prof.name : profId;
    })
    .join(', ');

  return (
    '<div class="col-lg-4 col-md-6">' +
      '<div class="service-card p-4 text-center h-100">' +
        '<div class="service-icon"><i class="' + service.icon + '"></i></div>' +
        '<h5>' + service.name + '</h5>' +
        '<p class="text-muted">' + service.description + '</p>' +
        '<div class="price">$' + service.price.toLocaleString() + '</div>' +
        '<div class="duration"><i class="fas fa-clock me-1"></i>' + service.duration + ' minutos</div>' +
        '<div class="mt-3"><small class="text-muted">Profesional: ' + profNames + '</small></div>' +
      '</div>' +
    '</div>'
  );
}

function renderServiceSelectionCard(service, professionals) {
  const profNames = service.professionals
    .map(function(profId) {
      const prof = professionals.find(function(p) { return p.id === profId; });
      return prof ? prof.name : profId;
    })
    .join(', ');

  return (
    '<div class="col-md-6">' +
      '<div class="service-selection-card"' +
        ' data-service-id="' + service.id + '"' +
        ' data-service-name="' + service.name + '"' +
        ' data-service-price="' + service.price + '"' +
        ' data-service-duration="' + service.duration + '"' +
        ' data-service-professionals="' + service.professionals.join(',') + '">' +
        '<i class="' + service.icon + '"></i>' +
        '<h5>' + service.name + '</h5>' +
        '<p>' + service.description + '</p>' +
        '<div class="price">$' + service.price.toLocaleString() + '</div>' +
        '<div class="duration"><i class="fas fa-clock me-1"></i>' + service.duration + ' minutos</div>' +
        '<small class="text-muted">Profesionales: ' + profNames + '</small>' +
      '</div>' +
    '</div>'
  );
}

window.renderServiceCard = renderServiceCard;
window.renderServiceSelectionCard = renderServiceSelectionCard;
