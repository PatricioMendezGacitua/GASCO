sap.ui.define([
	"com/gasco/Abastecimiento/controller/Inbound/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/m/MessageBox"
], function (Controller, JSONModel, MessageToast, MessageBox) {
	"use strict";

	return Controller.extend("com.gasco.Abastecimiento.controller.Inbound.Detail_Recepciones", {

		onInit: function () {
			this._route = this.getOwnerComponent().getRouter();
			this._route.getRoute("Recepciones_Detail").attachMatched(this._onRouteMatched, this);
		},

		_onRouteMatched: function (oEvent) {
			var buttonMenu = this.getView().byId("buttonMenuId");
			var oObjectStatus = this.getView().byId("oObjectStatusId");
			var buttonMenu2 = this.getView().byId("buttonMenu2Id");
			var numeroDocumentoVBOX = this.getView().byId("idNumeroDocumentoVBOX");
			numeroDocumentoVBOX.setVisible(false);

			var textoErrorVBOX = this.getView().byId("idTextoErrorVBOX");
			textoErrorVBOX.setVisible(false);

			buttonMenu.setVisible(false);
			oObjectStatus.setVisible(false);
			buttonMenu2.setVisible(false);

			this.getView().byId("oPageDetailId").scrollTo(0, 0, 1000);
			var oComponent = this.getOwnerComponent();
			this._route = oComponent.getRouter();
			var oArgs = oEvent.getParameter("arguments");

			this._oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			if (this._oStorage.get("navegacion_IngresoMercaderia") !== null) {
				this._oStorage.put("navegacion_IngresoMercaderia", null);
				this.userSCPCod = this._oStorage.get("user_code_IngresoMercaderia");
				this.userSCPName = this._oStorage.get("user_name_IngresoMercaderia");

				this.InputsViewRecepcionar = [{
					"id": "oInputOCRecepcion",
					"required": true,
					"type": "ip"
				}, {
					"id": "oDatePickerFCRecepcion",
					"required": true,
					"type": "dt"
				}, {
					"id": "oInputPatenteRecepcion",
					"required": true,
					"type": "ip"
				}, {
					"id": "oInputGuiaDespachoRecepcion",
					"required": true,
					"type": "ip"
				}, {
					"id": "oDatePickerFDRecepcion",
					"required": true,
					"type": "dt"
				}, {
					"id": "oTextAreaObservacionRecepcion",
					"required": false,
					"type": "ip"
				}];

				this.idIngreso = oArgs.ingreso;
				this.idEstadoIngreso = oArgs.estadoIngreso;
				this.getView().byId("tituloDetalleSolicitudView").setText("Detalle Ingreso N°" + this.idIngreso);

				if (!sap.ui.Device.system.desktop) {
					buttonMenu.setVisible(true);
					oObjectStatus.setVisible(true);
					buttonMenu2.setVisible(true);
				}

				var oButtonRecepcionar = this.getView().byId("oButtonRecepcionarId");
				oButtonRecepcionar.setVisible(true);

				if (this.idEstadoIngreso === "1" || this.idEstadoIngreso === "4") {
					this.consultaIngresoTomado().then(function (respuestaIngresoTomado) {

						if (!respuestaIngresoTomado.resolve) {
							this.registrarUsoIngreso().then(function () {
								this.iniciarView();
								this.enabledObjectView(true);
							}.bind(this));
						} else {
							MessageBox.information("Este ingreso está siendo tratado actualmente por otro usuario.\n \n ¿Desea continuar?", {
								title: "Aviso",
								details: "<p><strong>Datos de acceso:</strong></p>\n" +
									"<ul>" +
									"<li><strong>Nombre:</strong> " + respuestaIngresoTomado.data[0].NOMBRE_COMPLETO + "</li>" +
									"<li><strong>Fecha:</strong> " + respuestaIngresoTomado.data[0].FECHA + "</li>" +
									"<li><strong>Hora:</strong> " + respuestaIngresoTomado.data[0].HORA + "</li>" +
									"</ul>",
								contentWidth: "500px",
								styleClass: "sapUiResponsivePadding--header sapUiResponsivePadding--content sapUiResponsivePadding--footer",
								actions: ["Si", "No"],
								emphasizedAction: "Si",
								onClose: function (oAction) {
									if (oAction === "Si") {
										this.registrarUsoIngreso().then(function () {
											this.iniciarView();
										}.bind(this));
									} else {
										this.volverAlListMenu();
									}
								}.bind(this)
							});
						}
					}.bind(this));
				} else {
					oButtonRecepcionar.setVisible(false);
					this.iniciarView();
					this.enabledObjectView(false);
				}

			} else {
				this.onBackMenu();
			}

		},

		enabledObjectView: function (cond) {
			var oVBoxRecepcion = this.getView().byId("oVBoxRecepcionId");
			//var oInputOCRecepcion = this.getView().byId("oInputOCRecepcion");
			var oDatePickerFCRecepcion = this.getView().byId("oDatePickerFCRecepcion");
			var oInputPatenteRecepcion = this.getView().byId("oInputPatenteRecepcion");
			var oInputGuiaDespachoRecepcion = this.getView().byId("oInputGuiaDespachoRecepcion");
			var oDatePickerFDRecepcion = this.getView().byId("oDatePickerFDRecepcion");
			var oTextAreaObservacionRecepcion = this.getView().byId("oTextAreaObservacionRecepcion");

			//oInputOCRecepcion.setEnabled(cond);
			oDatePickerFCRecepcion.setEnabled(cond);
			oInputPatenteRecepcion.setEnabled(cond);
			//oInputGuiaDespachoRecepcion.setEnabled(cond);
			//oDatePickerFDRecepcion.setEnabled(cond);
			oTextAreaObservacionRecepcion.setEnabled(cond);
			oVBoxRecepcion.setEnabled(cond);
		},

		iniciarView: function (idEstadoIngreso) {
			var oVBoxImagenGuiaDespachoDR = this.getView().byId("oVBoxImagenGuiaDespachoDR");
			oVBoxImagenGuiaDespachoDR.setVisible(false);
			this.openBusyDialogCargando();
			this.temporalesPorUsuarioConectado(this.userSCPCod, this.idIngreso, this.idEstadoIngreso, true).then(function (
				respuestaTemporalesPorUsuarioConectado) {
				var data = respuestaTemporalesPorUsuarioConectado[0];
				this.idOC = data.ID_OC;
				this.ordenDeCompra = data.ORDEN_DE_COMPRA;
				this.idEstadoIngresoFull = data.ID_ESTADO_INGRESO;
				var oObjectStatus = this.getView().byId("oObjectStatusId");

				oObjectStatus.setState(data.STATE_ESTADO_INGRESO);
				oObjectStatus.setText(data.TITULO_ESTADO_INGRESO);
				oObjectStatus.setVisible(data.VISIBLE_ESTADO_INGRESO);

				var oFooterPage = this.getView().byId("oFooterPageId");
				oFooterPage.setVisible(true);

				var numeroDocumentoVBOX = this.getView().byId("idNumeroDocumentoVBOX");
				var oTextNroDocuento = this.getView().byId("oTextNroDocuentoId");

				numeroDocumentoVBOX.setVisible(data.VISIBLE_NRO_DOCUMENTO);
				oTextNroDocuento.setText(data.NUMERO_INGRESO_ERP);

				var textoErrorVBOX = this.getView().byId("idTextoErrorVBOX");
				var oTextMotivoFalla = this.getView().byId("oTextMotivoFallaId");

				textoErrorVBOX.setVisible(data.VISIBLE_TEXTO_ERROR);
				oTextMotivoFalla.setText(data.TEXTO_ERROR);

				var oInputOCRecepcion = this.getView().byId("oInputOCRecepcion");
				var oDatePickerFCRecepcion = this.getView().byId("oDatePickerFCRecepcion");
				var oInputPatenteRecepcion = this.getView().byId("oInputPatenteRecepcion");
				var oInputGuiaDespachoRecepcion = this.getView().byId("oInputGuiaDespachoRecepcion");
				var oDatePickerFDRecepcion = this.getView().byId("oDatePickerFDRecepcion");
				var oTextAreaObservacionRecepcion = this.getView().byId("oTextAreaObservacionRecepcion");
				var oButtonRecepcionar = this.getView().byId("oButtonRecepcionarId");
				oButtonRecepcionar.setEnabled(false);

				var oImageEvidenciaGuiaDespacho = this.getView().byId("oImageEvidenciaGuiaDespachoDRId");
				var oLightBoxItemEvidenciaGuiaDespacho = this.getView().byId("oLightBoxItemEvidenciaGuiaDespachoDRId");

				var arrPicker = [{
					id: "oDatePickerFDRecepcion",
					type: "date"
				}, {
					id: "oDatePickerFCRecepcion",
					type: "date"
				}];

				this.functionDisablePicker(arrPicker);

				////oDatePickerFDRecepcion.setMaxDate(new Date());

				var hoy = new Date();
				var unMesesEnMilisegundos = 2629750000;
				var resta = hoy.getTime() - unMesesEnMilisegundos;

				var primerDiaDelMes = new Date(resta);
				primerDiaDelMes = primerDiaDelMes.setDate(1);

				var fechaHaceTresMesesEnMilisegundos = new Date(primerDiaDelMes);
				oDatePickerFCRecepcion.setMinDate(new Date(fechaHaceTresMesesEnMilisegundos));
				oDatePickerFCRecepcion.setMaxDate(hoy);

				oInputOCRecepcion.setValue(data.ORDEN_DE_COMPRA);
				oDatePickerFCRecepcion.setDateValue(this.fechaRevert(data.FECHA_CONTABILIZACION));
				oInputPatenteRecepcion.setValue(data.PATENTE);
				oInputGuiaDespachoRecepcion.setValue(data.GUIA_DESPACHO);
				oDatePickerFDRecepcion.setDateValue(this.fechaRevert(data.FECHA_GUIA_DESPACHO));
				oTextAreaObservacionRecepcion.setValue(data.OBSERVACION);

				var url = encodeURI(data.LINK_GUIA_DESPACHO_MOBILE);
				var urlOriginal = encodeURI(data.LINK_GUIA_DESPACHO);
				
				this.linkGuiaDespacho = urlOriginal === "" ? null : urlOriginal;
				oImageEvidenciaGuiaDespacho.setSrc();
				oLightBoxItemEvidenciaGuiaDespacho.setImageSrc();

				if (url !== null) {
					if (url.length > 0) {

						var ObjectUrl = url;
						var MIMETYPE = "image/png";
						var NOMBRE = "Imagen";

						var array = [{
							URL: ObjectUrl,
							MIMETYPE: MIMETYPE,
							NOMBRE: NOMBRE
						}];

						this.functionCallBase64oDescarga(array, "Visualizar").then(function (imagen) {
							oVBoxImagenGuiaDespachoDR.setVisible(true);
							oImageEvidenciaGuiaDespacho.setSrc(imagen[0].url);
							oLightBoxItemEvidenciaGuiaDespacho.setImageSrc(imagen[0].url);
						}.bind(this));

					}
				}

				var countSeriado = 0;
				data.POSICIONES.forEach(function (element, index) {
					if (element.TITULO_TIPO_POSICION === "Seriado") {
						countSeriado++;
					}

					if (data.POSICIONES.length === (index + 1)) {
						if (countSeriado === 0) {
							oButtonRecepcionar.setEnabled(true);
						} else {
							MessageBox.information('Ingreso temporal N°' + this.idIngreso +
								' cuenta con una o más posiciones de tipo "Seriado". \n Para recepcionar esté ingreso debe acceder desde el Portal Web.', {
									title: "Aviso",
									onClose: function (sAction) {}.bind(this)
								});
						}
					}
				}.bind(this));

				this.bindView(data);
			}.bind(this));

		},

		fechaRevert: function (fecha) {
			var retorno = "";
			if (fecha !== null) {
				fecha = fecha.split("/");
				retorno = new Date(fecha[2] + "/" + fecha[1] + "/" + fecha[0]);
			}
			return retorno;
		},

		bindView: function (data) {

			var oModeloDataTemporal = new JSONModel([]);
			this.getView().setModel(oModeloDataTemporal, "oModeloDataTemporal");

			oModeloDataTemporal.setData(data);
			this.getView().byId("oTitlePosicionesIdRecepcion").setText("Posiciones (" + data.POSICIONES.length + ")");
			oModeloDataTemporal.refresh();
			this.BusyDialogCargando.close();

		},

		onRecepcionarIngresoPorSupervisor: function () {
			var contenedor = this.getView().byId("oPageDetailId");
			this.validar(this.InputsViewRecepcionar, "", contenedor).then(function (respuestaValidar) {
				if (!respuestaValidar) {

					this.validarALoMenosUnoSeleccionadoSupervisor().then(function (respuesta) {
						if (respuesta) {
							MessageBox.information('¿Seguro que deseas recepcionar el trabajo realizado?', {
								title: "Aviso",
								actions: ["Si", "No"],
								styleClass: "",
								onClose: function (sAction) {
									if (sAction === "Si") {

										this.openBusyDialogCargando();

										this.consultaIngresoTomado().then(function (respuestaIngresoTomado) {
											if (!respuestaIngresoTomado.resolve) {
												this.recepcionarComoSupervisor();
											} else {
												this.BusyDialogCargando.close();
												MessageBox.information("Este ingreso está siendo tratado actualmente por otro usuario, ¿Desea continuar?", {
													title: "Aviso",
													details: "<p><strong>Datos de acceso:</strong></p>\n" +
														"<ul>" +
														"<li><strong> > Nombre:</strong> " + respuestaIngresoTomado.data[0].NOMBRE_COMPLETO + "</li>" +
														"<li><strong> > Fecha:</strong> " + respuestaIngresoTomado.data[0].FECHA + "</li>" +
														"<li><strong> > Hora:</strong> " + respuestaIngresoTomado.data[0].HORA + "</li>" +
														"</ul>",
													contentWidth: "100px",
													styleClass: "sapUiResponsivePadding--header sapUiResponsivePadding--content sapUiResponsivePadding--footer",
													actions: ["Si", "No"],
													emphasizedAction: "Si",
													onClose: function (oAction) {
														if (oAction === "Si") {
															this.openBusyDialogCargando();
															this.recepcionarComoSupervisor();
														} else {
															this.volverAlListMenu();
														}
													}.bind(this),
												});
											}
										}.bind(this));

									}
								}.bind(this)
							});
						} else {
							MessageToast.show("Ingresa cantidad, asigna almacén y/o selecciona a lo menos una posición para continuar.", {
								duration: 6000
							});
						}
					}.bind(this));
				} else {
					this._wizard.goToStep(this.getView().byId("CabeceraStep"));
					MessageToast.show("Completa los campos obligatorios para continuar.");

					jQuery.sap.delayedCall(3000, this, function () {
						this.quitarState(this.InputsView, "");
					}.bind(this));
				}
			}.bind(this));
		},

		recepcionarComoSupervisor: function () {

			var error = "";
			var ot = this.getView().byId("oInputOCRecepcion").getValue();
			var guiDespacho = this.getView().byId("oInputGuiaDespachoRecepcion").getValue();

			var fechaConta = this.getView().byId("oDatePickerFCRecepcion").getDateValue();
			var patente = this.getView().byId("oInputPatenteRecepcion").getValue();
			var fechaGuia = this.getView().byId("oDatePickerFDRecepcion").getDateValue();
			var observacion = this.getView().byId("oTextAreaObservacionRecepcion").getValue();

			var recordDataIngresoERP = {};

			recordDataIngresoERP.Ikey = "1"; // Edm.String - MaxLength="1" 
			recordDataIngresoERP.IGmCode = "01"; // Edm.String - MaxLength="2" - sap:label="GM_Code" SIEMPRE 01 EN DURO
			recordDataIngresoERP.IPstngDate = fechaConta; // Edm.DateTime - sap:label="Fecha contab." INGRESO > FECHA_CONTABILIZACION
			recordDataIngresoERP.IDocDate = fechaGuia; // Edm.DateTime - sap:label="Fecha documento" INGRESO > FECHA_GUIA_DESPACHO
			recordDataIngresoERP.RefDocNo = guiDespacho.slice(0, 16); // Edm.String - MaxLength="16" - sap:label="Referencia" INGRESO > GUIA_DESPACHO
			recordDataIngresoERP.BillOfLading = patente.slice(0, 16); // Edm.String - MaxLength="16" - sap:label="Carta" INGRESO > PATENTE

			var obs = observacion;
			if (obs.length > 25) {
				obs = observacion.slice(0, 22) + "...";
			}

			recordDataIngresoERP.HeaderTxt = obs; // Edm.String - MaxLength="25" - sap:label="Texto" INGRESO > FECHA_CONTABILIZACION

			//CrearDocMatItem
			recordDataIngresoERP.NavCrearDocMatItem = [];

			//CrearDocMatSerial
			recordDataIngresoERP.NavCrearDocMatSerial = [];
			/*var recordCrearDocMatSerial = {};

			recordCrearDocMatSerial.Ikey = "1"; //Edm.String" - MaxLength="1"/>
			recordCrearDocMatSerial.MatdocItm = ""; //Edm.String" - MaxLength="4" - sap:label="Posición DocMat"/> POSICION > NUMERO_POSICION
			recordCrearDocMatSerial.Serialno = ""; //Edm.String" - MaxLength="8" - sap:label="Número de serie"/> SERIE_POSICION > NUMERO_SERIE
			recordCrearDocMatSerial.Uii = ""; //Edm.String" - MaxLength="72" - sap:label="UII"/> ?

			recordDataIngresoERP.CrearDocMatSerial.push(recordCrearDocMatSerial);*/

			//CrearDocMatDocumento
			var recordCrearDocMatDocumento = {};
			recordDataIngresoERP.navCrearDocMatDocumento = recordCrearDocMatDocumento;

			recordCrearDocMatDocumento.Ikey = "1"; //Edm.String" - MaxLength="1"/>
			recordCrearDocMatDocumento.EMblnr = ""; //Edm.String" - MaxLength="10" - sap:label="Doc.material"/>
			recordCrearDocMatDocumento.EMjahr = ""; //Edm.String" - MaxLength="4" - sap:label="Ejerc.doc.mat."/>

			var fecha = new Date();
			fecha.setHours(0);
			fecha.setMinutes(0);
			fecha.setSeconds(0);

			var dataIngreso = {
				ID_INGRESO: Number(this.idIngreso),
				ID_OC: this.idOC,
				ID_ESTADO_INGRESO: 2,
				FECHA_CONTABILIZACION: this.convertFechaXSJS(fechaConta),
				GUIA_DESPACHO: guiDespacho,
				FECHA_GUIA_DESPACHO: this.convertFechaXSJS(fechaGuia),
				PATENTE: patente,
				OBSERVACION: observacion,
				FECHA_RECEPCION: this.convertFechaXSJS(fecha),
				HORA_RECEPCION: this.horaXSJS(),
				USER_SCP_COD_RECEPCION: this.userSCPCod,
				FECHA_INBOUND: null,
				HORA_INBOUND: null,
				NUMERO_INGRESO_ERP: null,
				USER_SCP_COD_INBOUND: null,
				LINK_GUIA_DESPACHO: this.linkGuiaDespacho
			};

			var creacionConError = 0;

			this.createIngreso(dataIngreso, this.idEstadoIngresoFull).then(function (respuestaIngreso) {
				if (respuestaIngreso.resolve) {
					var idIngreso = respuestaIngreso.idIngreso;
					var idList = this.getView().byId("idtableLPHIRecepcion");

					var posicionesSeleccionadas = [];

					var recorrerPosiciones = function (element, index) {
						if (element.length === index) {

							if (creacionConError === 0) {

								this.createIngresoERP(recordDataIngresoERP).then(function (respuestaCreateIngresoERP) {
									if (respuestaCreateIngresoERP.resolve) {
										this.datosCreacion = {
											ID_AVISO: idIngreso,
											NUMERO_MATERIAL: ""
										};

										this.cambioEstadoMasivo(respuestaCreateIngresoERP.nroDocumento, "2", idIngreso, "").then(function () {
											this.registrarLog("Ingreso_Temporal_Recepcionado", this.datosCreacion).then(function (respuestaRegistrarLog) {
												this.BusyDialogCargando.close();
												this.preocesoGenerarOCConExito(idIngreso, respuestaCreateIngresoERP.nroDocumento);
											}.bind(this));
										}.bind(this));
									} else {
										var detail = null;

										if (respuestaCreateIngresoERP.error.length > 0) {
											detail = respuestaCreateIngresoERP.error;
											error = respuestaCreateIngresoERP.error;
										}
										this.datosCreacion = {
											ID_AVISO: idIngreso,
											NUMERO_MATERIAL: ""
										};

										this.cambioEstadoMasivo("", "4", idIngreso, error).then(function () {
											this.registrarLog("Reprocesar_Ingreso_Temporal", this.datosCreacion).then(function (respuestaRegistrarLog) {
												this.BusyDialogCargando.close();
												this.errorAlRecepcionarOC(detail);
											}.bind(this));
										}.bind(this));

									}
								}.bind(this));
							} else {

								this.datosCreacion = {
									ID_AVISO: idIngreso,
									NUMERO_MATERIAL: ""
								};
								this.cambioEstadoMasivo("", "4", idIngreso, "").then(function () {
									this.registrarLog("Reprocesar_Ingreso_Temporal", this.datosCreacion).then(function (respuestaRegistrarLog) {
										this.BusyDialogCargando.close();
										this.errorAlRecepcionarOC(null);
									}.bind(this));
								}.bind(this));
							}
						} else {

							var pos0 = element[index].getContent()[0].getContent()[0].getContent();
							var pos1 = element[index].getContent()[0].getContent()[1].getContent();

							var cantPen = pos1[4].getItems()[1].getText();
							//var cantPenNum = Number(pos1[4].getItems()[1].getText().replace(/\./g, ""));
							if (cantPen !== "0") {
								var codMaterial = pos0[1].getItems()[1].getText();
								var position = pos0[3].getItems()[1].getText();
								var denomination = pos0[4].getItems()[1].getText();

								var ubicacion = pos1[0].getItems()[1].getItems()[0].getText();
								var centro = pos1[1].getItems()[1].getItems()[0].getText();
								var almacen = pos1[2].getItems()[1].getText();
								var cantTotal = pos1[3].getItems()[1].getText();
								var unidadMedida = pos1[5].getItems()[1].getText();
								var step = pos1[6].getItems()[1].getValue().toString();
								//var check = pos1[7].getItems()[0].getSelected();

								var loteo = "";
								var vBoxLote = pos1[8];

								if (vBoxLote.getVisible()) {
									loteo = vBoxLote.getItems()[1].getValue();
								}

								var stockZero = pos1[9].getItems()[1].getText();
								var idPosicion = pos1[10].getItems()[1].getText();
								var codigoSAPProveedor = pos1[11].getItems()[1].getText();
								var idTipoPosicion = pos1[12].getItems()[1].getText();

								if (almacen === "Asignar") {
									almacen = "";
								}

								var dataPosiciones = {
									ID_POSICION: Number(idPosicion),
									ID_INGRESO: idIngreso,
									ID_ESTADO_POSICION: 2,
									NUMERO_POSICION: position,
									CODIGO_MATERIAL: codMaterial,
									DESCRIPCION_MATERIAL: denomination,
									CANTIDAD_MATERIAL_TOTAL: cantTotal,
									CANTIDAD_MATERIAL_PENDIENTE: cantPen,
									CANTIDAD_MATERIAL_INGRESADO: step,
									UNIDAD_DE_MEDIDA_MATERIAL: unidadMedida,
									NUMERO_UBICACION: ubicacion,
									NUMERO_LOTE: loteo,
									CENTRO: centro,
									ALMACEN: almacen,
									ID_TIPO_POSICION: Number(idTipoPosicion),
									STOCK_MATERIAL: stockZero,
									CODIGO_SAP_PROVEEDOR: codigoSAPProveedor
								};

								//#region DATOS PARA RECEPCIONAR EN EL ERP
								var recordCrearDocMatItem = {};

								recordCrearDocMatItem.Ikey = "1"; //Edm.String" - MaxLength="1"/> 
								recordCrearDocMatItem.Material = codMaterial.slice(0, 18); //Edm.String" - MaxLength="18" - sap:label="Material"/> POSICION > CODIGO_MATERIAL
								recordCrearDocMatItem.Plant = centro.slice(0, 4); //Edm.String" - MaxLength="4" - sap:label="Centro"/>  POSICION > CENTRO
								recordCrearDocMatItem.StgeLoc = almacen.slice(0, 4); //Edm.String" - MaxLength="4" - sap:label="Almacén"/> POSICION > ALMACEN
								recordCrearDocMatItem.MoveType = "101"; //Edm.String" - MaxLength="3" - sap:label="Cl.movimiento"/> POSICION > SIEMPRE 101 EN DURO
								recordCrearDocMatItem.EntryQnt = step; //Edm.Decimal" - Precision="13" Scale="3" - sap:label="Ctd.en UME"/> POSICION > CANTIDAD_MATERIAL_INGRESADO
								recordCrearDocMatItem.EntryUom = unidadMedida.slice(0, 3); //Edm.String" - MaxLength="3" - sap:label="UM entrada"/> POSICION > UNIDAD_DE_MEDIDA_MATERIAL
								recordCrearDocMatItem.PoNumber = this.ordenDeCompra.slice(0, 10); //Edm.String" - MaxLength="10" - sap:label="Pedido"/> ORDEN_DE_COMPRA > ORDEN_DE_COMPRA
								recordCrearDocMatItem.PoItem = position.slice(0, 5); //Edm.String" - MaxLength="5" - sap:label="Posición"/> POSICION > NUMERO_POSICION
								recordCrearDocMatItem.StgeBin = ubicacion.slice(0, 10); //Edm.String" - MaxLength="10" - sap:label="Ubicación"/> POSICION > NUMERO_UBICACION
								recordCrearDocMatItem.Vendor = codigoSAPProveedor.slice(0, 10); //Type="Edm.String" - MaxLength="10" - sap:label="Proveedor"/>
								recordCrearDocMatItem.Batch = loteo.slice(0, 10); //Type="Edm.String" - MaxLength="10" - sap:label="Número de lote"/>

								recordDataIngresoERP.NavCrearDocMatItem.push(recordCrearDocMatItem);

								//#endregion	

								this.createPosicionIngreso(dataPosiciones, this.idEstadoIngresoFull).then(function (respuestaPosicionIngreso) {
									if (respuestaPosicionIngreso) {
										if (stockZero === "0") {
											this.datosCreacion = {
												ID_AVISO: idIngreso,
												NUMERO_MATERIAL: codMaterial
											};
											this.registrarLog("Stock_Cero_Material", this.datosCreacion).then(function (respuestaRegistrarLog) {
												index++;
												recorrerPosiciones(element, index);
											}.bind(this));
										} else {
											index++;
											recorrerPosiciones(element, index);
										}
									} else {
										creacionConError++;
										index++;
										recorrerPosiciones(element, index);
									}
								}.bind(this));
							}

						}
					}.bind(this);

					idList.getItems().forEach(function (elementt, indexx) {
						var pos1 = elementt.getContent()[0].getContent()[1].getContent();
						var check = pos1[7].getItems()[0].getSelected();
						if (check) {
							posicionesSeleccionadas.push(elementt);
						}

						if (idList.getItems().length === indexx + 1) {
							recorrerPosiciones(posicionesSeleccionadas, 0);
						}
					}.bind(this));

				} else {
					this.BusyDialogCargando.close();
					this.errorAlRecepcionarOC(null);
				}
			}.bind(this));

		},

		preocesoGenerarOCConExito: function (idIngreso, nroDoc) {
			MessageBox.success("Ingreso temporal N°" + idIngreso + " fue recepcionado con éxito. \n  \n El documento SAP asociado es el N°" +
				nroDoc + ".", {
					title: "Aviso",
					onClose: function (sAction) {
						this.resetMasterDetail();
					}.bind(this)
				});
		},

		errorAlRecepcionarOC: function (detail) {

			MessageBox.information(
				"No fue posible recepcionar el ingreso de la Orden de Compra, intenta más tarde o comunícate con el área encargada.", {
					title: "Aviso",
					details: detail,
					contentWidth: "500px",
					styleClass: "sapUiResponsivePadding--header sapUiResponsivePadding--content sapUiResponsivePadding--footer",
					actions: ["OK"],
					onClose: function (oAction) {
					//	this.registrarUsoIngreso().then(function () {
							this.resetMasterDetail();
					//	}.bind(this));
					}.bind(this)
				});

		},

		volverAlListMenu: function () {
			if (this.idEstadoIngreso === "1") {
				MessageBox.information('¿Seguro deseas salir?', {
					title: "Aviso",
					actions: ["Si", "No"],
					styleClass: "",
					onClose: function (sAction) {
						if (sAction === "Si") {
							this.resetMasterDetail();
						}
					}.bind(this)
				});
			} else {
				this.resetMasterDetail();
			}
		},

		resetMasterDetail: function () {
			this._oStorage.put("navegacion_IngresoMercaderia", "si");
			this.getOwnerComponent().getRouter().navTo("Recepciones_Master", {
				estadoIngreso: this.idEstadoIngreso
			});
		},

		onExit: function () {
			var oFooterPage = this.getView().byId("oFooterPageId");
			oFooterPage.setVisible(false);
		}

	});

});