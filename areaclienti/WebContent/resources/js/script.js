/**
 * Script principale
 */

/* Costanti */


var contextPath = "http://ws.services.ltc-logistics.it/logica/rest";
var wsLogin = "/utente/login";
var wsUpdate = "/utente/update";

var pathCerca = "/tracking/cerca";
var pathDettagli = "/tracking/dettagli/";

var wsArchivia = "/tracking/archivia/";
var wsElimina = "/tracking/elimina/";

/* Funzioni */

//Genera un suffisso da appendere alle chiamate POST per evitare che alcuni browser facciano caching
var getAntiCacheSuffix = function() {
	return '?v=' + Date.now();
};

//Codifica in Base64
var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

var encodeBase64 = function (input) {
    var output = "";
    var chr1, chr2, chr3 = "";
    var enc1, enc2, enc3, enc4 = "";
    var i = 0;

    do {
        chr1 = input.charCodeAt(i++);
        chr2 = input.charCodeAt(i++);
        chr3 = input.charCodeAt(i++);

        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;

        if (isNaN(chr2)) {
            enc3 = enc4 = 64;
        } else if (isNaN(chr3)) {
            enc4 = 64;
        }

        output = output +
            keyStr.charAt(enc1) +
            keyStr.charAt(enc2) +
            keyStr.charAt(enc3) +
            keyStr.charAt(enc4);
        chr1 = chr2 = chr3 = "";
        enc1 = enc2 = enc3 = enc4 = "";
    } while (i < input.length);

    return output;
};

var decodeBase64 = function (input) {
    var output = "";
    var chr1, chr2, chr3 = "";
    var enc1, enc2, enc3, enc4 = "";
    var i = 0;

    // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
    var base64test = /[^A-Za-z0-9\+\/\=]/g;
    if (base64test.exec(input)) {
        window.alert("There were invalid base64 characters in the input text.\n" +
            "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +
            "Expect errors in decoding.");
    }
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

    do {
        enc1 = keyStr.indexOf(input.charAt(i++));
        enc2 = keyStr.indexOf(input.charAt(i++));
        enc3 = keyStr.indexOf(input.charAt(i++));
        enc4 = keyStr.indexOf(input.charAt(i++));

        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;

        output = output + String.fromCharCode(chr1);

        if (enc3 != 64) {
            output = output + String.fromCharCode(chr2);
        }
        if (enc4 != 64) {
            output = output + String.fromCharCode(chr3);
        }

        chr1 = chr2 = chr3 = "";
        enc1 = enc2 = enc3 = enc4 = "";

    } while (i < input.length);

    return output;
};

//Imposta gli header per le richieste HTTP (attualmente solo la basic auth)
//In teoria si potrebbe impostare in maniera globale così:
//$http.defaults.headers.common.Authorization = 'Basic ...';
var getHTTPHeaderConfig = function() {
	var authString = sessionStorage.username + ':' + sessionStorage.password;
	var encodedAuthString = 'Basic ' + encodeBase64(authString);
	var config = {
			headers : {Authorization : encodedAuthString}
	}
	return config;
};

//Funzione utile a cambiare elementi nello schermo per mostrare il caricamento
var loading = function(isLoading) {
	if (isLoading) {
		document.getElementById('bottoneRicerca').innerHTML = '<i class="fa fa-refresh fa-spin" aria-hidden="true"></i> sto cercando...';
		document.getElementById("main").style.cursor = "progress";
	} else {
		document.getElementById("main").style.cursor = "auto";
		document.getElementById('bottoneRicerca').innerHTML = 'Cerca';
	}
};

// Creazione del modulo Angular, app principale.
var ltcApp = angular.module('ltcApp', [ 'ngRoute', 'angular-table', 'angular-tabs' ]);

// Configurazione delle rotte
ltcApp.config(function($routeProvider) {
	$routeProvider
	.when('/', {
		templateUrl : 'resources/html/pages/login.html',
		controller : 'loginController'
	})
	.when('/login', {
		templateUrl : 'resources/html/pages/login.html',
		controller : 'loginController'
	})
	.when('/reimposta', {
		templateUrl : 'resources/html/pages/resetPassword.html',
		controller : 'errorController'
	})
	.when('/index', {
		templateUrl : 'resources/html/pages/choose.html',
		controller : 'indexController'
	})
	.when('/lista', {
		templateUrl : 'resources/html/pages/list.html',
		controller : 'listController'
	})
	.when('/storico', {
		templateUrl : 'resources/html/pages/archive.html',
		controller : 'archiveController'
	})
	.when('/preferenze', {
		templateUrl : 'resources/html/pages/preferences.html',
		controller : 'preferencesController'
	})
	.when('/dettaglio', {
		templateUrl : 'resources/html/pages/detail.html',
		controller : 'detailController'
	})
	.when('/dettaglioarchiviato', {
		templateUrl : 'resources/html/pages/detailArchived.html',
		controller : 'archivedDetailController'
	})
	.when('/errore', {
		templateUrl : 'resources/html/pages/error.html',
		controller : 'errorController'
	})
	.otherwise({redirectTo:'/errore'});
});

// Controller principale e inject Angular's $scope
ltcApp.controller('mainController', function($scope, $http, $location) {

	// Variabili condivise in tutta la app
	$scope.username = undefined;
	$scope.password = undefined;

});

ltcApp.controller('loginController', function($scope, $http, $location) {

	$scope.message = '';

	// Funzione di login, se va a buon fine setta le variabili di sessione.
	$scope.login = function() {
		//Le imposto la prima volta, saranno usate per tutte le chiamate
		sessionStorage.username = $scope.username;
		sessionStorage.password = $scope.password;
		//Eseguo la chiamata di login per autenticarmi
		$http.get(contextPath + wsLogin, getHTTPHeaderConfig()).then(
				function(response) {
					if (response.status == 200) {
						sessionStorage.nome = response.data.nome;
						sessionStorage.cognome = response.data.cognome;
						sessionStorage.setItem("permessi", JSON.stringify(response.data.permessi));
						sessionStorage.setItem("sedi", JSON.stringify(response.data.sedi));
						sessionStorage.setItem("commesse", JSON.stringify(response.data.commesse));
						sessionStorage.ricerca = 'true';
						sessionStorage.ricercaArchiviati = 'true';
						$location.path('/index');
						$location.replace();
					} else {
						$scope.message = "Nome utente o password non corretti."
					}
				}, function(response) {
					//Errore
					$scope.message = "Ci sono stati problemi con il login.";
				});
	};
});

ltcApp.controller('indexController', function($scope) {
	
	$scope.message = 'Ciao ' + sessionStorage.nome + " " + sessionStorage.cognome + "!";
	
});

ltcApp.controller('listController', function($scope, $http, $location, $filter) {
	
	if (sessionStorage.username == null || sessionStorage.username == undefined) {
		$location.path('/login');
		$location.replace();
	}
	
	$scope.message = '';
	
	$scope.configurazioneTabella = { itemsPerPage: 10, fillLastPage: true, maxPages : 10 };
	
	//Recupero la lista dei clienti gestibili per raffinare le query, se presente
	$scope.clienti = JSON.parse(sessionStorage.getItem("commesse"));
	$scope.cliente = $scope.clienti[0];
	
	//In base al tipo di account mostro o nascondo la lista dei clienti gestibili
//	if ($scope.clienti.length > 1) {
//		$scope.mostraCliente = true;
//	} else {
//		$scope.mostraCliente = false;
//	}
	$scope.mostraCliente = false;
		
	//Recupero la lista degli ordini già cercati, se presente nascondo il pannello di ricerca.
	//Nel sessionStorage posso salvare solo stringhe, undefined è visto come una stringa...	
	if (sessionStorage.ricerca == 'true') {
		$("#form").collapse('show');
	} else {
		$("#form").collapse('hide');
	}
	
	var ordini = sessionStorage.getItem("listaOrdini");
	if (ordini == "undefined" || ordini == undefined || ordini == null) {
		$scope.ordini = [];
	} else {
		$scope.ordini = JSON.parse(ordini);
	}
	
	$scope.cerca = function() {
		if (sessionStorage.ricerca == 'true') {
			loading(true);
			var filtro = {
				idCommessa : $scope.cliente,
				riferimento : $scope.nOrdine,
				inizio : document.getElementById('dpd1').value,
				fine : document.getElementById('dpd2').value,
				destinatario : $scope.destinatario,
				stato : $scope.stato,
				archiviazione : 'NO'
			};
			$http.post(contextPath + pathCerca + getAntiCacheSuffix(), filtro, getHTTPHeaderConfig()).then(
					function(response) {
						if (response.status == 200) {
							$scope.ordini = response.data;
							sessionStorage.setItem("listaOrdini", JSON.stringify(response.data));
							sessionStorage.ricerca = 'false';
							//$(".collapse").collapse('hide');
							$("#form").collapse('hide');
						} else if (response.status == 401) {
							sessionStorage.clear();
							$location.path('/login');
							$location.replace();
						} else {
							$scope.message = "La richiesta non e' andata a buon fine, prova di nuovo"
						}
						loading(false);
					}, function(response) {
						//Errore
						$scope.message = "Ci sono stati problemi di comunicazione con il server, prova di nuovo.";
						loading(false);
					});
		} else {
			sessionStorage.ricerca = 'true';
			//$(".collapse").collapse('show');
			$("#form").collapse('show');
		}
		
	}
	
	$scope.visualizzaDettaglio = function(id) {
		$http.get(contextPath + pathDettagli + id + getAntiCacheSuffix(), getHTTPHeaderConfig()).then(
				function(response) {
					if (response.status == 200) {
						sessionStorage.setItem("dettaglioOrdine", JSON.stringify(response.data));
						$location.path('/dettaglio');
						$location.replace();
					} else if (response.status == 401) {
						sessionStorage.clear();
						$location.path('/login');
						$location.replace();
					} else {
						$scope.message = "La richiesta non e' andata a buon fine, prova di nuovo"
						sessionStorage.dettaglioOrdine = undefined;
					}
				}, function(response) {
					//Errore
					$scope.message = "Ci sono stati problemi di comunicazione con il server, prova di nuovo.";
					sessionStorage.dettaglioOrdine = undefined;
				});
	};
});

ltcApp.controller('archiveController', function($scope, $http, $location, $filter) {
	
	if (sessionStorage.username == null || sessionStorage.username == undefined) {
		$location.path('/login');
		$location.replace();
	}

	$scope.message = '';
	
	$scope.configurazioneTabella = { itemsPerPage: 10, fillLastPage: true, maxPages : 10 };
	
	//Recupero la lista dei clienti gestibili per raffinare le query, se presente
	$scope.clienti = JSON.parse(sessionStorage.getItem("commesse"));
	$scope.cliente = $scope.clienti[0];
	
	//In base al tipo di account mostro o nascondo la lista dei clienti gestibili
//	if ($scope.clienti.length > 1) {
//		$scope.mostraCliente = true;
//	} else {
//		$scope.mostraCliente = false;
//	}
	$scope.mostraCliente = false;
		
	//Recupero la lista degli ordini già cercati, se presente nascondo il pannello di ricerca.
	//Nel sessionStorage posso salvare solo stringhe, undefined è visto come una stringa...	
	if (sessionStorage.ricercaArchiviati == 'true') {
		$("#form").collapse('show');
	} else {
		$("#form").collapse('hide');
	}
	
	var ordini = sessionStorage.getItem("listaOrdiniArchiviati");
	if (ordini == "undefined" || ordini == undefined || ordini == null) {
		$scope.ordini = [];
	} else {
		$scope.ordini = JSON.parse(ordini);
	}
		
	$scope.cerca = function() {
		if (sessionStorage.ricercaArchiviati == 'true') {
			loading(true);
			var filtro = {
				idCommessa : $scope.cliente,
				riferimento : $scope.nOrdine,
				inizio : document.getElementById('dpd1').value,
				fine : document.getElementById('dpd2').value,
				destinatario : $scope.destinatario,
				stato : $scope.stato,
				archiviazione : 'SI'
			};
			$http.post(contextPath + pathCerca + getAntiCacheSuffix(), filtro, getHTTPHeaderConfig()).then(
					function(response) {
						if (response.status == 200) {
							$scope.ordini = response.data;
							sessionStorage.setItem("listaOrdiniArchiviati", JSON.stringify(response.data));
							sessionStorage.ricercaArchiviati = 'false';
							$("#form").collapse('hide');
						} else if (response.status == 401) {
							sessionStorage.clear();
							$location.path('/login');
							$location.replace();
						} else {
							$scope.message = "La richiesta non e' andata a buon fine, prova di nuovo"
						}
						loading(false);
					}, function(response) {
						//Errore
						$scope.message = "Ci sono stati problemi di comunicazione con il server, prova di nuovo.";
						loading(false);
					});
		} else {
			sessionStorage.ricercaArchiviati = 'true';
			$("#form").collapse('show');
		}
		
	}
	
	$scope.visualizzaDettaglio = function(id) {
		$http.get(contextPath + pathDettagli + id + getAntiCacheSuffix(), getHTTPHeaderConfig()).then(
				function(response) {
					if (response.status == 200) {
						sessionStorage.setItem("dettaglioOrdineArchiviato", JSON.stringify(response.data));
						$location.path('/dettaglioarchiviato');
						$location.replace();
					} else if (response.status == 401) {
						sessionStorage.clear();
						$location.path('/login');
						$location.replace();
					} else {
						$scope.message = "La richiesta non e' andata a buon fine, prova di nuovo"
						sessionStorage.dettaglioOrdine = undefined;
					}
				}, function(response) {
					//Errore
					$scope.message = "Ci sono stati problemi di comunicazione con il server, prova di nuovo.";
					sessionStorage.dettaglioOrdine = undefined;
				});
	};
});

ltcApp.controller('preferencesController', function($scope, $http) {
	
	if (sessionStorage.username == null || sessionStorage.username == undefined) {
		$location.path('/login');
		$location.replace();
	}
	
	$scope.message = '';
	
	$scope.cambia = function() {
		var cambioPassword = {
				username : sessionStorage.username,
				password : sessionStorage.password,
				nuovaPassword : $scope.password
		}
		$http.post(contextPath + wsUpdate + getAntiCacheSuffix(), cambioPassword, getHTTPHeaderConfig()).then(
				function(response) {
					if (response.status == 200) {
						sessionStorage.password = $scope.password;
						$scope.message = "Password modificata con successo";
					} else if (response.status == 401) {
						sessionStorage.clear();
						$location.path('/login');
						$location.replace();
					} else {
						$scope.message = "La richiesta non e' andata a buon fine, prova di nuovo";
						sessionStorage.dettaglioOrdine = undefined;
					}
				}, function(response) {
					//Errore
					$scope.message = "Ci sono stati problemi di comunicazione con il server, prova di nuovo.";
					sessionStorage.dettaglioOrdine = undefined;
				});
	};
});

ltcApp.controller('detailController', function($scope, $location, $http) {
	
	if (sessionStorage.username == null || sessionStorage.username == undefined) {
		$location.path('/login');
		$location.replace();
	}
	
	$scope.message = '';
	$scope.ordine = JSON.parse(sessionStorage.getItem("dettaglioOrdine"));
	
	$scope.indietro = function() {
		$location.path('/lista');
		$location.replace();
	};
	
	$scope.archivia = function() {
		$http.get(contextPath + wsArchivia + $scope.ordine.id + getAntiCacheSuffix(), getHTTPHeaderConfig()).then(
				function(response) {
					if (response.status == 200) {
						sessionStorage.setItem("listaOrdini", undefined);
						$location.path('/lista');
						$location.replace();
					} else if (response.status == 401) {
						sessionStorage.clear();
						$location.path('/login');
						$location.replace();
					} else {
						$scope.message = "La richiesta non e' andata a buon fine, prova di nuovo"
						sessionStorage.dettaglioOrdine = undefined;
					}
				}, function(response) {
					//Errore
					$scope.message = "Ci sono stati problemi di comunicazione con il server, prova di nuovo.";
					sessionStorage.dettaglioOrdine = undefined;
				});
	};
});

ltcApp.controller('archivedDetailController', function($scope, $location, $http) {
	
	if (sessionStorage.username == null || sessionStorage.username == undefined) {
		$location.path('/login');
		$location.replace();
	}
	
	$scope.message = '';
	$scope.ordine = JSON.parse(sessionStorage.getItem("dettaglioOrdineArchiviato"));
	
	$scope.indietro = function() {
		$location.path('/storico');
		$location.replace();
	};
	
	$scope.elimina = function() {
		$http.get(contextPath + wsElimina + $scope.ordine.id + getAntiCacheSuffix(), getHTTPHeaderConfig()).then(
				function(response) {
					if (response.status == 200) {
						sessionStorage.setItem("listaOrdiniArchiviati", undefined);
						$location.path('/storico');
						$location.replace();
					} else if (response.status == 401) {
						sessionStorage.clear();
						$location.path('/login');
						$location.replace();
					} else {
						$scope.message = "La richiesta non e' andata a buon fine, prova di nuovo"
						sessionStorage.dettaglioOrdine = undefined;
					}
				}, function(response) {
					//Errore
					$scope.message = "Ci sono stati problemi di comunicazione con il server, prova di nuovo.";
					sessionStorage.dettaglioOrdine = undefined;
				});
	};
});

ltcApp.controller('errorController', function($scope) {
	$scope.message = '';
});

/*Controller del menù laterale*/
ltcApp.controller('menuController', function($scope, $location, $http) {
	$scope.message = '';
	$scope.logout = function() {
		//Pulisco lo storage e porto l'utente fuori.
		sessionStorage.clear();
		$location.path('/login');
		$location.replace();
	};
});
