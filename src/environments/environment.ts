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

    apiUrl: 'https://fichas-api.yosiftware.es/',

    // Plataforma Yosiftware (ecosistema-kit/ACCESO.md): la cuenta, la sesión y lo social son suyos.
    plataforma: {
        entorno: 'produccion',
        sdkUrl: 'https://cuentas.yosiftware.es/sdk/v1/yosiftware.js',
        apiUrl: 'https://cuentas-api.yosiftware.es',
        socialUrl: 'https://social.yosiftware.es',
    },
}
