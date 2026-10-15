export const environment = {
    production: false,
    firestoreDatabaseId: 'fichas-rol',
    firebase: {
        projectId: 'yosiftware-fichas',
        appId: '1:89131912577:web:e44115b5692471f58eec80',
        databaseURL: 'https://yosiftware-fichas-default-rtdb.europe-west1.firebasedatabase.app',
        storageBucket: 'yosiftware-fichas.appspot.com',
        locationId: 'europe-west',
        apiKey: 'AIzaSyA8EKaHtmn2K7dXYcd23XBT2hc-vKx26gs',
        authDomain: 'yosiftware-fichas.firebaseapp.com',
        messagingSenderId: '89131912577',
    },

    // Desarrollo contra la plataforma de QA (https://rol.dev.yosiftware.es): la API de desarrollo
    // (127.0.0.1:5010) por el proxy del servidor de desarrollo (proxy.qa.json).
    apiUrl: '/api/',

    // Las cachés públicas de catálogos viven en la RTDB de producción: desde desarrollo no se escriben
    // (los datos vendrían de `rol_dev`).
    sincronizacionCaches: false,

    // Plataforma Yosiftware (ecosistema-kit/ACCESO.md): la cuenta, la sesión y lo social son suyos.
    plataforma: {
        entorno: 'qa',
        sdkUrl: 'https://qa-cuentas.yosiftware.es/sdk/v1/yosiftware.js',
        apiUrl: 'https://qa-cuentas-api.yosiftware.es',
        socialUrl: 'https://qa-social.yosiftware.es',
    },
}
