sap.ui.define([
	"com/gasco/Abastecimiento/controller/Inbound/BaseController",
	"sap/ui/model/Filter",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/TextArea",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/ui/model/FilterOperator",
	"sap/m/ColumnListItem",
	"sap/m/GroupHeaderListItem"
], function (BaseController,
	Filter,
	Dialog,
	Button,
	TextArea,
	JSONModel,
	MessageToast,
	MessageBox,
	FilterOperator,
	ColumnListItem,
	GroupHeaderListItem) {
	var evento;

	return BaseController.extend("com.gasco.Abastecimiento.controller.Inbound.Master_Recepciones", {

		onInit: function () {
			this._route = this.getOwnerComponent().getRouter();
			this._route.getRoute("Recepciones_Master").attachMatched(this._onRouteMatched, this);
			this._route.getRoute("Recepciones_Master_Dos").attachMatched(this._onRouteMatched, this);

		},

		handleRefresh: function (evt) {
			jQuery.sap.delayedCall(1000, this, function () {
				this.getView().byId("oSearchFieldBuscarId").setValue();
				this.getView().byId("pullToRefresh").hide();
				this.iniciarView("X", this.filtroDePantallaSeleccionado);
			}.bind(this));

		},

		buscarAutocompletar: function (oEvent) {

			var oSearchFieldBuscar = this.getView().byId("oSearchFieldBuscarId");
			var value = "X";
			if (oSearchFieldBuscar.getValue().trim().length > 0) {
				value = oSearchFieldBuscar.getValue().trim();
			}

			var clear = oEvent.getParameter("clearButtonPressed");
			var refresh = oEvent.getParameter("refreshButtonPressed");

			if (clear) {
				this.iniciarView("X", this.filtroDePantallaSeleccionado);
			} else if (refresh) {
				this.iniciarView(value, this.filtroDePantallaSeleccionado);
			} else {
				if (value.length > 0) {
					this.iniciarView(value, this.filtroDePantallaSeleccionado);
				}
			}

		},

		onlyNumber: function (oEvent) {
			var obj = oEvent.getSource();

			var value = obj.getValue().toString();
			if (value.trim().length > 0) {
				value = value.toString().replace(/[^0-9\_]/g, '');
				obj.setValue(Number(value));
			}

		},

		onlyNumberChart: function (oEvent) {
			var obj = oEvent.getSource();

			var value = obj.getValue().toString();
			if (value.trim().length > 0) {
				value = value.toString().replace(/[^0-9 A-Z a-z\_]/g, '');
				obj.setValue(value.toUpperCase());
			}

		},

		_onRouteMatched: function (oEvent) {
			var oComponent = this.getOwnerComponent();
			this._route = oComponent.getRouter();
			var oArgs = oEvent.getParameter("arguments");
			this.rootViewName = oEvent.getParameter("name");
			this.idEstadoIngreso = oArgs.estadoIngreso;

			if (oArgs.estadoIngreso == "4") {
				this.idEstadoIngreso = "1";
			}

			this._oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			if (this._oStorage.get("navegacion_IngresoMercaderia") !== null) {
				this._oStorage.put("navegacion_IngresoMercaderia", null);
				this.userSCPCod = this._oStorage.get("user_code_IngresoMercaderia");
				this.userSCPName = this._oStorage.get("user_name_IngresoMercaderia");
				this.filtroDePantallaSeleccionado = this.idEstadoIngreso;
				this.setearTextoMenuButton();
				this.iniciarView("X", this.idEstadoIngreso);
			} else {
				this.onBackMenu();
			}

		},

		onAnulaOC: function (oEvent) {

			var objectO = oEvent.getParameters().listItem.getBindingContext("oModeloTemporales").getObject();
			var idIngreso = objectO.ID_INGRESO;

			var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;

			MessageBox.show("¿Seguro desea anular el ingreso N°" + idIngreso + "?", {
				icon: sap.m.MessageBox.Icon.QUESTION,
				title: "Eliminar",
				styleClass: bCompact ? "sapUiSizeCompact" : "",
				actions: ["Aceptar", "Cancelar"],
				onClose: function (sAction) {
					if (sAction === 'Cancelar') {
						return;
					} else {
						this.openBusyDialogCargando();
						this.changeEstadoTresIngreso(idIngreso).then(function () {
							this.BusyDialogCargando.close();
							this.cambioDeEstadoBase(this.filtroDePantallaSeleccionado);
							MessageToast.show("Ingreso anulado correctamente.");
						}.bind(this));
					}
				}.bind(this)
			});

		},

		cambioDeEstadoUno: function () {
			this.cambioDeEstadoBase("1");
		},

		cambioDeEstadoDos: function () {
			this.cambioDeEstadoBase("2");
		},

		cambioDeEstadoTres: function () {
			this.cambioDeEstadoBase("3");
		},

		cambioDeEstadoBase: function (idEstadoIngreso) {
			var toggle = this.getView().byId("oToggleButtonAnularOCId");

			var visible = false;
			this.filtroDePantallaSeleccionado = idEstadoIngreso;
			this.setearTextoMenuButton();

			if (idEstadoIngreso === "1") {
				visible = true;
			}

			toggle.setPressed(false);
			toggle.setVisible(visible);
			this.onToggleAnularOrdenBase(false);
				
				var name = "Recepciones_Master";
			if(this.rootViewName === "Recepciones_Master"){
				name = "Recepciones_Master_Dos";
			}	
				
			this.changeView(name, idEstadoIngreso);

		},

		changeView: function (param, idEstadoIngreso) {

			this._oStorage.put("navegacion_IngresoMercaderia", "si");
			this.getOwnerComponent().getRouter().navTo(param, {
				estadoIngreso: idEstadoIngreso
			});

		},

		setearTextoMenuButton: function () {
			var oMenuButtonFilter = this.getView().byId("oMenuButtonFilterId");
			var text = "Pendientes";
			if (this.filtroDePantallaSeleccionado === "2") {
				text = "Recepcionadas";
			} else if (this.filtroDePantallaSeleccionado === "3") {
				text = "Anuladas";
			}
			oMenuButtonFilter.setText(text);
		},

		onToggleAnularOrden: function () {
			var toggle = this.getView().byId("oToggleButtonAnularOCId");
			this.onToggleAnularOrdenBase(toggle.getPressed());
		},

		onToggleAnularOrdenBase: function (pressed) {

			var list = this.getView().byId("idList");
			var mode = "SingleSelectMaster";
			if (pressed) {
				mode = "Delete";
			}
			list.setMode(mode);

		},

		iniciarView: function (idIngreso, idEstadoIngreso) {
			this.getView().byId("idPageMaster").scrollTo(0, 0, 1000);
			this.openBusyDialogCargando();
			this.temporalesPorUsuarioConectado(this.userSCPCod, idIngreso, idEstadoIngreso, false).then(function (
				respuestaTemporalesPorUsuarioConectado) {
				var temporales = respuestaTemporalesPorUsuarioConectado;
				//debugger;
				//var e = this.eliminaDuplicado(temporales, "ID_INGRESO");
				//console.log(e);
				this.bindItemsList(temporales);
			}.bind(this));

		},

		eliminaDuplicado: function (tuArreglo, atributodetuArreglo) {
			var nuevoArreglo = [];
			var nuevoJson = {};

			for (var i in tuArreglo) {
				if (tuArreglo[i].ID_ESTADO_INGRESO === 4) {
					nuevoJson[tuArreglo[i][atributodetuArreglo]] = tuArreglo[i];
				}
			}

			for (i in nuevoJson) {
				nuevoArreglo.push(nuevoJson[i]);
			}

			nuevoJson = {};

			for (var e in nuevoArreglo) {
				for (var a in tuArreglo) {
					if (tuArreglo[a].ID_INGRESO !== nuevoArreglo[e].ID_INGRESO && tuArreglo[a].ID_ESTADO_INGRESO !== 4) {
						nuevoJson[tuArreglo[a][atributodetuArreglo]] = tuArreglo[a];
					}
				}
			}

			for (e in nuevoJson) {
				nuevoArreglo.push(nuevoJson[e]);
			}
			return nuevoArreglo;
		},

		desLista: function () {

			var traerListaProyectos = this.getView().byId("idList");
			var aPreguntar = traerListaProyectos.getSelectedItem();

			if (aPreguntar !== null) {
				aPreguntar.setSelected(false);
			}

		},

		bindItemsList: function (temporales) {

			var toggle = this.getView().byId("oToggleButtonAnularOCId");
			toggle.setEnabled(true);
			var oModeloTemporales = new JSONModel([]);
			this.getView().setModel(oModeloTemporales, "oModeloTemporales");

			if (temporales.length > 100) {
				temporales.setSizeLimit(temporales.length);
			}

			if (temporales.length === 0) {
				toggle.setEnabled(false);
			}

			oModeloTemporales.setData(temporales);
			oModeloTemporales.refresh();
			this.finishedEvent(temporales);

		},

		finishedEvent: function (temporales) {
			this.getView().byId("idPagina").setText("Recepciones (" + temporales.length + ")");
			this.desLista();
			this.BusyDialogCargando.close();
		},

		formatterStatus: function (estado) {
			var valor = "None";

			if (estado === "Rechazado") {
				valor = "Error";
			} else if (estado === "Aprobado") {
				valor = "Success";
			} else if (estado === "Pendiente") {
				valor = "Warning";
			} else {
				valor = "None";
			}

			return valor;
		},

		onListItemPressed: function (oEvent) {
			evento = oEvent.getParameter("listItem") || oEvent.getSource();
			this.navDetailSolicitud();
		},

		openSelectedFilter: function (oEvent) {

			var oButton = oEvent.getSource();

			if (!this._menuFilter) {
				this._menuFilter = sap.ui.xmlfragment(
					"com.gasco.Abastecimiento.view.fragments.MenuFilter",
					this
				);
				this.getView().addDependent(this._menuFilter);
			}

			var eDock = sap.ui.core.Popup.Dock;
			this._menuFilter.open(this._bKeyboard, oButton, eDock.BeginTop, eDock.BeginBottom, oButton);

		},

		navDetailSolicitud: function () {
			var base = evento;
			var paths = base.getBindingContext("oModeloTemporales").getPath();

			var idIngreso = base.getBindingContext("oModeloTemporales").getProperty(paths).ID_INGRESO;
			var idEstadoIngreso = base.getBindingContext("oModeloTemporales").getProperty(paths).ID_ESTADO_INGRESO;

			this._oStorage.put("navegacion_IngresoMercaderia", "si");
			this.getOwnerComponent().getRouter().navTo("Recepciones_Detail", {
				ingreso: idIngreso,
				estadoIngreso: idEstadoIngreso
			});
		}

	});

});