(function () {
	"use strict";
	/*global sap, jQuery */

	sap.ui.controller("sap.ovp.cards.charts.bubble.BubbleChart", {
		onInit: function () {
			var vizFrame = this.getView().byId("bubbleChartCard");
			vizFrame.setVizProperties({
				valueAxis:{
					title:{
						visible:true
					},
					label:{
						formatString:"yValueAxisFormatter"
					}
				},
				valueAxis2:{
					title:{
						visible:true
					},
					label:{
						formatString:"yValueAxisFormatter"
					}
				},
				categoryAxis:{
					title:{
						visible:true
					},
					label:{
						formatString:"yValueAxisFormatter"
					}
				},
				legend: {
					isScrollable: false
				},
				title: {
					visible: false
				},
				interaction:{
					noninteractiveMode: true,
					selectability: {
						legendSelection: false,
						axisLabelSelection: false,
						mode: "NONE",
						plotLassoSelection: false,
						plotStdSelection: false
					}
				}
			});
			sap.ovp.cards.charts.Utils.formatChartYaxis();
			sap.ovp.cards.charts.Utils.AnalyticalCardHandler.call(this, vizFrame);
		},
		onBeforeRendering : function() {
			var vizFrame = this.getView().byId("bubbleChartCard");
			var binding = vizFrame.getDataset().getBinding("data");
			binding.attachDataReceived(function(){sap.ovp.cards.charts.Utils.hideDateTimeAxis(vizFrame, "valueAxis");});
		}
	});
})();
