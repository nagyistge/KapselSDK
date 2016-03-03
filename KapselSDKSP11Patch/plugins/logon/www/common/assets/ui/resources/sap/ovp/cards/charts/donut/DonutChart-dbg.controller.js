(function () {
	"use strict";
	/*global sap, jQuery */

	sap.ui.controller("sap.ovp.cards.charts.donut.DonutChart", {
		onInit: function () {
			var measureArrNames = [];
			var dimensionArrayNames = [];
			var vizFrame = this.getView().byId("donutChartCard");
			var measuresArr = vizFrame.getDataset().getMeasures();
			var dimensionsArr = vizFrame.getDataset().getDimensions();

			measureArrNames.push(measuresArr[0].getName());
			dimensionArrayNames.push(dimensionsArr[0].getName());

			vizFrame.addFeed(new sap.viz.ui5.controls.common.feeds.FeedItem({
				'uid': "size",
				'type': "Measure",
				'values': measureArrNames
			}));
			vizFrame.addFeed(new sap.viz.ui5.controls.common.feeds.FeedItem({
				'uid': "color",
				'type': "Dimension",
				'values': dimensionArrayNames
			}));

			vizFrame.setVizProperties({
				size:{
					title:{
						visible:false
					}
				},
				color:{
					title:{
						visible:false
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
		}
	});
})();
