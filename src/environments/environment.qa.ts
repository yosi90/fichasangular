export const environment = {
    production: false,
    firestoreDatabaseId: 'fichas-rol',
    // Proyecto de Firebase solo para QA (kit 1.72, ecosistema-kit/ENTORNOS.md): QA no toca nada de producción.
    firebase: {
        projectId: 'yosiftware-fichas-qa',
        appId: '1:938769617676:web:68d8c13069d2b2a2acaf29',
        databaseURL: 'https://yosiftware-fichas-qa-default-rtdb.europe-west1.firebasedatabase.app',
        storageBucket: 'yosiftware-fichas-qa.firebasestorage.app',
        apiKey: 'AIzaSyCUGznkfjNstuZ_jIxPMS4piFuOE2E1pHg',
        authDomain: 'yosiftware-fichas-qa.firebaseapp.com',
        messagingSenderId: '938769617676',
    },

    // Desarrollo contra la plataforma de QA (https://rol.dev.yosiftware.es): la API de desarrollo
    // (127.0.0.1:5010) por el proxy del servidor de desarrollo (proxy.qa.json).
    apiUrl: '/api/',

    // La caché de catálogos de la RTDB es la del proyecto de QA, que rellena la API de desarrollo; dotes y conjuros
    // se siguen leyendo de la API (rol_dev). Ver src/app/services/catalogo-api.ts.
    catalogosDesdeApi: true,

    // Plataforma Yosiftware (ecosistema-kit/ACCESO.md): la cuenta, la sesión y lo social son suyos.
    plataforma: {
        entorno: 'qa',
        sdkUrl: 'https://qa-cuentas.yosiftware.es/sdk/v1/yosiftware.js',
        apiUrl: 'https://qa-cuentas-api.yosiftware.es',
        socialUrl: 'https://qa-social.yosiftware.es',
    },
}
