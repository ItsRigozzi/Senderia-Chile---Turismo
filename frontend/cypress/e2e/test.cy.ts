const destino = {
  id: 1,
  nombre: 'Parque Nacional Cypress',
  descripcion: 'Un destino de prueba para recorrer la interfaz de Sendería.',
  categoria_nombre: 'Parques Nacionales',
  region_nombre: 'Región de prueba',
  latitud: -33.45,
  longitud: -70.66,
  horario: '09:00 - 18:00',
  condiciones_acceso: 'Llevar agua y calzado cómodo.',
  imagen_url: null,
};

describe('Sendería Chile', () => {
  it('permite explorar un destino y abrir su ficha', () => {
    cy.intercept('GET', '**/api/destinos', {
      statusCode: 200,
      body: { destinos: [destino], source: 'database' },
    }).as('obtenerDestinos');

    cy.intercept('GET', '**/api/destinos/1', {
      statusCode: 200,
      body: { destino },
    }).as('obtenerDetalle');

    cy.visit('/');
    cy.wait('@obtenerDestinos');

    cy.contains('h3', destino.nombre).should('be.visible');
    cy.get('input[placeholder*="deseas explorar"]').type('Cypress');
    cy.contains('h3', destino.nombre).should('be.visible');

    cy.contains('.destino-card', destino.nombre).click();
    cy.wait('@obtenerDetalle');

    cy.location('pathname').should('eq', '/destinos/1');
    cy.contains('h1', destino.nombre).should('be.visible');
    cy.contains(destino.descripcion).should('be.visible');
  });

  it('permite iniciar sesión y consultar la página de favoritos', () => {
    cy.intercept('GET', '**/api/destinos', {
      statusCode: 200,
      body: { destinos: [destino], source: 'database' },
    }).as('obtenerDestinos');

    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        usuario: {
          id: 7,
          nombre: 'Usuario Cypress',
          email: 'cypress@senderia.cl',
          rol: 'usuario',
        },
        token: 'token-de-prueba',
      },
    }).as('iniciarSesion');

    cy.intercept('GET', '**/api/auth/me', {
      statusCode: 200,
      body: {
        usuario: {
          id: 7,
          nombre: 'Usuario Cypress',
          email: 'cypress@senderia.cl',
          rol: 'usuario',
        },
      },
    }).as('restaurarSesion');

    cy.intercept('GET', '**/api/favoritos', {
      statusCode: 200,
      body: {
        favoritos: [
          {
            favorito_id: 12,
            id: destino.id,
            nombre: destino.nombre,
            descripcion: destino.descripcion,
            categoria_nombre: destino.categoria_nombre,
            region_nombre: destino.region_nombre,
            imagen_url: destino.imagen_url,
          },
        ],
      },
    }).as('obtenerFavoritos');

    cy.visit('/login');
    cy.get('input[type="email"]').type('cypress@senderia.cl');
    cy.get('input[type="password"]').type('ClaveDePrueba123!');
    cy.contains('button[type="submit"]', 'Iniciar Sesión').click();

    cy.wait('@iniciarSesion');
    cy.location('pathname').should('eq', '/explorar');
    cy.wait('@obtenerDestinos');
    cy.contains('button', '♡ Favoritos').click();
    cy.wait('@restaurarSesion');
    cy.wait('@obtenerFavoritos');

    cy.location('pathname').should('eq', '/favoritos');
    cy.contains('h1', 'Mis atractivos guardados').should('be.visible');
    cy.contains('h2', destino.nombre).should('be.visible');
  });
});
